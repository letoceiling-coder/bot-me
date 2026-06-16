import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "crypto";
import type { MaxIntegrationDto } from "@botme/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CryptoService } from "../common/crypto.service";
import { AgentRuntimeService } from "../agent/agent-runtime.service";
import { LeadsService } from "../leads/leads.service";
import { NotificationsService } from "../notifications/notifications.service";
import { WebhookDedupService } from "../common/webhook-dedup.service";

type MaxMetadata = {
  assistantId?: string;
  botName?: string;
  webhookSecret?: string;
};

type MaxUpdate = {
  update_type?: string;
  timestamp?: number;
  message?: {
    sender?: { user_id?: number; is_bot?: boolean; name?: string };
    recipient?: { chat_id?: number; chat_type?: string; user_id?: number };
    body?: { text?: string; mid?: string };
  };
};

@Injectable()
export class MaxService {
  private readonly apiBase = "https://platform-api.max.ru";

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly config: ConfigService,
    private readonly agent: AgentRuntimeService,
    private readonly leads: LeadsService,
    private readonly notifications: NotificationsService,
    private readonly dedup: WebhookDedupService,
  ) {}

  async getStatus(organizationId: string): Promise<MaxIntegrationDto> {
    const row = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "max" } },
    });
    const meta = (row?.metadata ?? {}) as MaxMetadata;
    const hasToken = Boolean(row?.credentialsEnc);

    return {
      status: row?.status ?? "DISCONNECTED",
      enabled: row?.enabled ?? false,
      lastError: row?.lastError ?? null,
      assistantId: meta.assistantId ?? null,
      botName: meta.botName ?? null,
      hasToken,
      tokenMasked: hasToken
        ? this.crypto.maskSecret(this.decryptToken(row!.credentialsEnc!))
        : null,
    };
  }

  async saveCredentials(
    organizationId: string,
    botToken: string | undefined,
    assistantId: string,
  ) {
    const assistant = await this.prisma.assistant.findFirst({
      where: { id: assistantId, organizationId, isActive: true },
    });
    if (!assistant) {
      throw new BadRequestException("Ассистент не найден или неактивен");
    }

    const existing = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "max" } },
    });

    let meta: MaxMetadata = {
      assistantId,
      botName: (existing?.metadata as MaxMetadata)?.botName,
      webhookSecret: (existing?.metadata as MaxMetadata)?.webhookSecret,
    };

    let encrypted = existing?.credentialsEnc ?? null;

    if (botToken?.trim()) {
      const me = await this.maxApi<{ name?: string }>(
        botToken.trim(),
        "GET",
        "/me",
      );
      encrypted = this.crypto.encrypt(botToken.trim());
      meta = {
        assistantId,
        botName: me.name ?? undefined,
        webhookSecret: meta.webhookSecret,
      };
    } else if (!encrypted) {
      throw new BadRequestException("Укажите токен MAX-бота");
    }

    await this.prisma.integration.upsert({
      where: { organizationId_type: { organizationId, type: "max" } },
      create: {
        organizationId,
        type: "max",
        enabled: false,
        credentialsEnc: encrypted,
        status: "DISCONNECTED",
        metadata: meta,
      },
      update: {
        credentialsEnc: encrypted,
        metadata: meta,
      },
    });

    return this.getStatus(organizationId);
  }

  async connect(organizationId: string) {
    const row = await this.getIntegration(organizationId);
    const token = this.decryptToken(row.credentialsEnc!);
    const meta = (row.metadata ?? {}) as MaxMetadata;
    const webhookSecret = meta.webhookSecret ?? randomBytes(16).toString("hex");
    const webhookUrl = this.webhookUrl(organizationId, webhookSecret);

    const result = await this.maxApi<{ success?: boolean; message?: string }>(
      token,
      "POST",
      "/subscriptions",
      {
        url: webhookUrl,
        update_types: ["message_created"],
        secret: webhookSecret,
      },
    );

    if (result.success === false) {
      const desc = result.message ?? "Ошибка webhook";
      await this.prisma.integration.update({
        where: { id: row.id },
        data: { status: "ERROR", lastError: desc },
      });
      await this.notifications.notifyOrg({
        organizationId,
        type: "integration_error",
        title: "Ошибка MAX",
        body: desc,
      });
      throw new BadRequestException(`MAX: ${desc}`);
    }

    await this.prisma.integration.update({
      where: { id: row.id },
      data: {
        status: "CONNECTED",
        enabled: true,
        lastError: null,
        metadata: { ...meta, webhookSecret },
      },
    });

    return this.getStatus(organizationId);
  }

  async disconnect(organizationId: string) {
    const row = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "max" } },
    });
    if (!row?.credentialsEnc) {
      return this.getStatus(organizationId);
    }

    const meta = (row.metadata ?? {}) as MaxMetadata;
    const token = this.decryptToken(row.credentialsEnc);
    if (meta.webhookSecret) {
      const url = this.webhookUrl(row.organizationId, meta.webhookSecret);
      try {
        await this.maxApi(token, "DELETE", `/subscriptions?url=${encodeURIComponent(url)}`);
      } catch {
        // ignore cleanup errors
      }
    }

    await this.prisma.integration.update({
      where: { id: row.id },
      data: { status: "DISCONNECTED", enabled: false, lastError: null },
    });

    return this.getStatus(organizationId);
  }

  async handleWebhook(
    organizationId: string,
    secret: string | undefined,
    headerSecret: string | undefined,
    update: MaxUpdate,
  ) {
    const row = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "max" } },
    });
    if (!row?.credentialsEnc) {
      return { ok: false, error: "not_found" };
    }

    const meta = (row.metadata ?? {}) as MaxMetadata;

    const resolvedSecret = headerSecret ?? secret;
    if (meta.webhookSecret && resolvedSecret !== meta.webhookSecret) {
      return { ok: false, error: "forbidden" };
    }

    if (update.update_type !== "message_created") {
      return { ok: true, skipped: true };
    }

    const mid = update.message?.body?.mid;
    if (mid) {
      const isNew = await this.dedup.tryClaim({
        source: "max",
        dedupeKey: `${organizationId}:${mid}`,
        organizationId,
      });
      if (!isNew) return { ok: true, duplicate: true };
    }

    if (row.status !== "CONNECTED" || !row.enabled) {
      return { ok: true, skipped: true };
    }

    const text = update.message?.body?.text?.trim();
    const sender = update.message?.sender;
    const recipient = update.message?.recipient;

    if (!text || !sender || sender.is_bot) {
      return { ok: true, skipped: true };
    }

    if (!meta.assistantId) {
      return { ok: true, skipped: true };
    }

    const chatType = recipient?.chat_type ?? "dialog";
    const userId = sender.user_id;
    const chatId = recipient?.chat_id;
    const externalId = this.buildExternalId(chatType, userId, chatId);
    if (!externalId) {
      return { ok: true, skipped: true };
    }

    const peerName = sender.name ?? (userId ? `MAX · ${userId}` : "MAX user");

    let conversation = await this.prisma.conversation.findUnique({
      where: {
        organizationId_channel_externalId: {
          organizationId,
          channel: "max",
          externalId,
        },
      },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 12 },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          organizationId,
          integrationId: row.id,
          channel: "max",
          externalId,
          peerName,
          status: "bot_active",
        },
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 12 },
        },
      });
    }

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: text,
        metadata: { maxMid: mid, chatType, userId, chatId },
      },
    });

    await this.leads.maybeCreateFromMessage({
      organizationId,
      assistantId: meta.assistantId,
      text,
      source: "max",
      conversationId: conversation.id,
      peerName,
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), peerName },
    });

    if (conversation.status === "human_active") {
      return { ok: true, humanActive: true };
    }

    const history = conversation.messages
      .slice()
      .reverse()
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    let reply: string;
    try {
      const result = await this.agent.generateReply({
        organizationId,
        assistantId: meta.assistantId,
        userMessage: text,
        history,
      });
      reply = result.reply;
    } catch (err) {
      reply =
        "Извините, сейчас не могу ответить. Попробуйте позже или напишите оператору.";
      await this.prisma.integration.update({
        where: { id: row.id },
        data: {
          lastError: err instanceof Error ? err.message : "Ошибка ассистента",
        },
      });
    }

    const token = this.decryptToken(row.credentialsEnc!);
    await this.sendMessage(token, externalId, reply);

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
      },
    });

    return { ok: true };
  }

  async sendOutboundForConversation(
    organizationId: string,
    conversation: { externalId: string | null },
    text: string,
  ) {
    if (!conversation.externalId) {
      throw new BadRequestException("Нет externalId для MAX-диалога");
    }

    const row = await this.getIntegration(organizationId);
    const token = this.decryptToken(row.credentialsEnc!);
    await this.sendMessage(token, conversation.externalId, text);
  }

  private buildExternalId(
    chatType: string,
    userId?: number,
    chatId?: number,
  ): string | null {
    if (chatType === "dialog" && userId) return `user:${userId}`;
    if (chatId) return `chat:${chatId}`;
    if (userId) return `user:${userId}`;
    return null;
  }

  private parseExternalId(externalId: string) {
    if (externalId.startsWith("user:")) {
      return { query: { user_id: externalId.slice(5) } };
    }
    if (externalId.startsWith("chat:")) {
      return { query: { chat_id: externalId.slice(5) } };
    }
    return { query: { user_id: externalId } };
  }

  private async sendMessage(token: string, externalId: string, text: string) {
    const { query } = this.parseExternalId(externalId);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
    await this.maxApi(token, "POST", `/messages?${params.toString()}`, {
      text: text.slice(0, 4000),
    });
  }

  private async getIntegration(organizationId: string) {
    const row = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "max" } },
    });
    if (!row?.credentialsEnc) {
      throw new NotFoundException("MAX не настроен");
    }
    return row;
  }

  private decryptToken(encrypted: string) {
    return this.crypto.decrypt(encrypted);
  }

  private webhookUrl(organizationId: string, secret: string) {
    const origin =
      this.config.get<string>("WEB_ORIGIN") ?? "https://bot-me.neeklo.ru";
    return `${origin}/api/webhooks/max/${organizationId}?secret=${secret}`;
  }

  private async maxApi<T>(
    token: string,
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const res = await fetch(`${this.apiBase}${path}`, {
      method,
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new BadRequestException(
        errText.slice(0, 200) || `MAX API ${res.status}`,
      );
    }

    if (res.status === 204) {
      return {} as T;
    }

    return res.json() as Promise<T>;
  }
}
