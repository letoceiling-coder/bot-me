import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "crypto";
import type { AvitoIntegrationDto } from "@botme/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CryptoService } from "../common/crypto.service";
import { AgentRuntimeService } from "../agent/agent-runtime.service";
import { LeadsService } from "../leads/leads.service";

type AvitoCredentials = {
  clientId: string;
  clientSecret: string;
};

type AvitoMetadata = {
  assistantId?: string;
  profileId?: number;
  webhookSecret?: string;
  accountName?: string;
};

type AvitoWebhookValue = {
  id?: string;
  chat_id?: string;
  user_id?: number;
  author_id?: number;
  type?: string;
  content?: { text?: string };
};

@Injectable()
export class AvitoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly config: ConfigService,
    private readonly agent: AgentRuntimeService,
    private readonly leads: LeadsService,
  ) {}

  async getStatus(organizationId: string): Promise<AvitoIntegrationDto> {
    const row = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "avito" } },
    });
    const meta = (row?.metadata ?? {}) as AvitoMetadata;
    const hasCredentials = Boolean(row?.credentialsEnc);

    let clientIdMasked: string | null = null;
    if (hasCredentials && row?.credentialsEnc) {
      const creds = this.parseCredentials(row.credentialsEnc);
      clientIdMasked = this.crypto.maskSecret(creds.clientId);
    }

    return {
      status: row?.status ?? "DISCONNECTED",
      enabled: row?.enabled ?? false,
      lastError: row?.lastError ?? null,
      assistantId: meta.assistantId ?? null,
      profileId: meta.profileId ?? null,
      hasCredentials,
      clientIdMasked,
    };
  }

  async saveCredentials(
    organizationId: string,
    clientId: string | undefined,
    clientSecret: string | undefined,
    profileId: number | undefined,
    assistantId: string,
  ) {
    const assistant = await this.prisma.assistant.findFirst({
      where: { id: assistantId, organizationId, isActive: true },
    });
    if (!assistant) {
      throw new BadRequestException("Ассистент не найден или неактивен");
    }

    const existing = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "avito" } },
    });

    let creds: AvitoCredentials | null = existing?.credentialsEnc
      ? this.parseCredentials(existing.credentialsEnc)
      : null;

    if (clientId?.trim() && clientSecret?.trim()) {
      creds = { clientId: clientId.trim(), clientSecret: clientSecret.trim() };
    } else if (!creds) {
      throw new BadRequestException("Укажите Client ID и Client Secret");
    }

    const resolvedProfileId =
      profileId ?? (existing?.metadata as AvitoMetadata)?.profileId;
    if (!resolvedProfileId) {
      throw new BadRequestException("Укажите Profile ID (номер профиля Avito)");
    }

    await this.getAccessToken(creds!.clientId, creds!.clientSecret);

    const prevMeta = (existing?.metadata ?? {}) as AvitoMetadata;
    const meta: AvitoMetadata = {
      assistantId,
      profileId: resolvedProfileId,
      webhookSecret: prevMeta.webhookSecret,
      accountName: prevMeta.accountName,
    };

    await this.prisma.integration.upsert({
      where: { organizationId_type: { organizationId, type: "avito" } },
      create: {
        organizationId,
        type: "avito",
        enabled: false,
        credentialsEnc: this.encryptCredentials(creds!),
        status: "DISCONNECTED",
        metadata: meta,
      },
      update: {
        credentialsEnc: this.encryptCredentials(creds!),
        metadata: meta,
      },
    });

    return this.getStatus(organizationId);
  }

  async connect(organizationId: string) {
    const row = await this.getIntegration(organizationId);
    const creds = this.parseCredentials(row.credentialsEnc!);
    const meta = (row.metadata ?? {}) as AvitoMetadata;
    const webhookSecret = meta.webhookSecret ?? randomBytes(16).toString("hex");
    const webhookUrl = this.webhookUrl(organizationId, webhookSecret);
    const token = await this.getAccessToken(creds.clientId, creds.clientSecret);

    const result = await this.avitoApi(token, "POST", "/messenger/v3/webhook", {
      url: webhookUrl,
    });

    if (!result.ok) {
      const desc =
        (result.data as { error?: { message?: string } })?.error?.message ??
        (result.data as { message?: string })?.message ??
        "Ошибка webhook";
      await this.prisma.integration.update({
        where: { id: row.id },
        data: { status: "ERROR", lastError: desc },
      });
      throw new BadRequestException(`Avito: ${desc}`);
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
      where: { organizationId_type: { organizationId, type: "avito" } },
    });
    if (!row?.credentialsEnc) {
      return this.getStatus(organizationId);
    }

    const creds = this.parseCredentials(row.credentialsEnc);
    const token = await this.getAccessToken(creds.clientId, creds.clientSecret);
    await this.avitoApi(token, "POST", "/messenger/v1/webhook/unsubscribe", {});

    await this.prisma.integration.update({
      where: { id: row.id },
      data: { status: "DISCONNECTED", enabled: false, lastError: null },
    });

    return this.getStatus(organizationId);
  }

  async handleWebhook(
    organizationId: string,
    secret: string | undefined,
    body: Record<string, unknown>,
  ) {
    const row = await this.getIntegration(organizationId);
    const meta = (row.metadata ?? {}) as AvitoMetadata;

    if (meta.webhookSecret && secret !== meta.webhookSecret) {
      return { ok: false, error: "forbidden" };
    }

    if (row.status !== "CONNECTED" || !row.enabled) {
      return { ok: true, skipped: true };
    }

    const payload = body.payload as
      | { type?: string; value?: AvitoWebhookValue }
      | undefined;
    const value = payload?.value;
    const text = value?.content?.text;
    const chatId = value?.chat_id;

    if (!text || !chatId || payload?.type !== "message") {
      return { ok: true, skipped: true };
    }

    if (meta.profileId && value?.author_id === meta.profileId) {
      return { ok: true, skipped: true };
    }

    if (!meta.assistantId) {
      return { ok: true, skipped: true };
    }

    const creds = this.parseCredentials(row.credentialsEnc!);
    const peerName = `Avito · ${chatId.slice(0, 8)}`;

    let conversation = await this.prisma.conversation.findUnique({
      where: {
        organizationId_channel_externalId: {
          organizationId,
          channel: "avito",
          externalId: chatId,
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
          channel: "avito",
          externalId: chatId,
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
        metadata: { avitoMessageId: value?.id, chatId },
      },
    });

    await this.leads.maybeCreateFromMessage({
      organizationId,
      assistantId: meta.assistantId,
      text,
      source: "avito",
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

    const token = await this.getAccessToken(creds.clientId, creds.clientSecret);
    const userId = meta.profileId ?? value?.user_id;
    if (!userId) {
      return { ok: true, skipped: true };
    }

    const sendResult = await this.sendMessage(token, userId, chatId, reply);
    if (!sendResult.ok) {
      await this.prisma.integration.update({
        where: { id: row.id },
        data: {
          lastError: sendResult.error ?? "Ошибка отправки",
          status: sendResult.unauthorized ? "ERROR" : row.status,
        },
      });
    }

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
      },
    });

    return { ok: true };
  }

  async sendMessage(
    accessToken: string,
    userId: number,
    chatId: string,
    text: string,
  ) {
    const result = await this.avitoApi(
      accessToken,
      "POST",
      `/messenger/v1/accounts/${userId}/chats/${chatId}/messages`,
      {
        type: "text",
        message: { text: text.slice(0, 4000) },
      },
    );

    return {
      ok: result.ok,
      error:
        (result.data as { error?: { message?: string } })?.error?.message ??
        (result.data as { message?: string })?.message,
      unauthorized: result.status === 401,
    };
  }

  async sendOutboundForConversation(
    organizationId: string,
    conversation: { externalId: string | null; channel: string },
    text: string,
  ) {
    if (conversation.channel !== "avito" || !conversation.externalId) {
      throw new BadRequestException("Отправка доступна только для Avito-диалогов");
    }

    const row = await this.getIntegration(organizationId);
    const creds = this.parseCredentials(row.credentialsEnc!);
    const meta = (row.metadata ?? {}) as AvitoMetadata;
    if (!meta.profileId) {
      throw new BadRequestException("Avito profile ID не настроен");
    }

    const token = await this.getAccessToken(creds.clientId, creds.clientSecret);
    const result = await this.sendMessage(
      token,
      meta.profileId,
      conversation.externalId,
      text,
    );
    if (!result.ok) {
      throw new BadRequestException(result.error ?? "Не удалось отправить сообщение");
    }
  }

  private async getIntegration(organizationId: string) {
    const row = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "avito" } },
    });
    if (!row?.credentialsEnc) {
      throw new NotFoundException("Avito не настроен");
    }
    return row;
  }

  private parseCredentials(encrypted: string): AvitoCredentials {
    return JSON.parse(this.crypto.decrypt(encrypted)) as AvitoCredentials;
  }

  private encryptCredentials(creds: AvitoCredentials) {
    return this.crypto.encrypt(JSON.stringify(creds));
  }

  private webhookUrl(organizationId: string, secret: string) {
    const origin =
      this.config.get<string>("WEB_ORIGIN") ?? "https://bot-me.neeklo.ru";
    return `${origin}/api/webhooks/avito/${organizationId}?secret=${secret}`;
  }

  private async getAccessToken(clientId: string, clientSecret: string) {
    const res = await fetch("https://api.avito.ru/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const data = (await res.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!res.ok || !data.access_token) {
      throw new BadRequestException(
        data.error_description ?? data.error ?? "Неверные ключи Avito",
      );
    }

    return data.access_token;
  }

  private async avitoApi(
    token: string,
    method: string,
    path: string,
    body: Record<string, unknown>,
  ) {
    const res = await fetch(`https://api.avito.ru${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: method === "GET" ? undefined : JSON.stringify(body),
    });

    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    return { ok: res.ok, status: res.status, data };
  }
}
