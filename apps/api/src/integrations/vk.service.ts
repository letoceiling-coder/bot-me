import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "crypto";
import type { VkIntegrationDto } from "@botme/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CryptoService } from "../common/crypto.service";
import { AgentRuntimeService } from "../agent/agent-runtime.service";
import { LeadsService } from "../leads/leads.service";
import { NotificationsService } from "../notifications/notifications.service";
import { WebhookDedupService } from "../common/webhook-dedup.service";

type VkMetadata = {
  assistantId?: string;
  groupId?: number;
  groupName?: string;
  confirmationCode?: string;
  webhookSecret?: string;
  callbackServerId?: number;
};

type VkWebhookBody = {
  type?: string;
  group_id?: number;
  secret?: string;
  object?: {
    message?: {
      id?: number;
      date?: number;
      peer_id?: number;
      from_id?: number;
      text?: string;
      out?: number;
    };
  };
};

@Injectable()
export class VkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly config: ConfigService,
    private readonly agent: AgentRuntimeService,
    private readonly leads: LeadsService,
    private readonly notifications: NotificationsService,
    private readonly dedup: WebhookDedupService,
  ) {}

  async getStatus(organizationId: string): Promise<VkIntegrationDto> {
    const row = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "vk" } },
    });
    const meta = (row?.metadata ?? {}) as VkMetadata;
    const hasCredentials = Boolean(row?.credentialsEnc);
    const webhookSecret = meta.webhookSecret;

    return {
      status: row?.status ?? "DISCONNECTED",
      enabled: row?.enabled ?? false,
      lastError: row?.lastError ?? null,
      assistantId: meta.assistantId ?? null,
      groupId: meta.groupId ?? null,
      groupName: meta.groupName ?? null,
      hasCredentials,
      tokenMasked:
        hasCredentials && row?.credentialsEnc
          ? this.crypto.maskSecret(this.decryptToken(row.credentialsEnc))
          : null,
      webhookUrl: webhookSecret
        ? this.webhookUrl(organizationId, webhookSecret)
        : null,
    };
  }

  async saveCredentials(
    organizationId: string,
    accessToken: string | undefined,
    groupId: number | undefined,
    confirmationCode: string | undefined,
    webhookSecret: string | undefined,
    assistantId: string,
  ) {
    const assistant = await this.prisma.assistant.findFirst({
      where: { id: assistantId, organizationId, isActive: true },
    });
    if (!assistant) {
      throw new BadRequestException("Ассистент не найден или неактивен");
    }

    const existing = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "vk" } },
    });
    const prevMeta = (existing?.metadata ?? {}) as VkMetadata;

    let encrypted = existing?.credentialsEnc ?? null;
    if (accessToken?.trim()) {
      encrypted = this.crypto.encrypt(accessToken.trim());
    } else if (!encrypted) {
      throw new BadRequestException("Укажите ключ доступа сообщества");
    }

    const resolvedGroupId = groupId ?? prevMeta.groupId;
    if (!resolvedGroupId) {
      throw new BadRequestException("Укажите ID сообщества VK");
    }

    const resolvedConfirmation =
      confirmationCode?.trim() ?? prevMeta.confirmationCode;
    if (!resolvedConfirmation) {
      throw new BadRequestException(
        "Укажите строку подтверждения из настроек Callback API",
      );
    }

    const resolvedSecret =
      webhookSecret?.trim() ?? prevMeta.webhookSecret ?? randomBytes(12).toString("hex");

    const token = this.decryptToken(encrypted!);
    const group = await this.vkApi<{ id: number; name?: string }[]>(
      "groups.getById",
      token,
      { group_id: resolvedGroupId },
    );
    const groupName = group[0]?.name ?? prevMeta.groupName;

    const meta: VkMetadata = {
      assistantId,
      groupId: resolvedGroupId,
      groupName,
      confirmationCode: resolvedConfirmation,
      webhookSecret: resolvedSecret,
      callbackServerId: prevMeta.callbackServerId,
    };

    await this.prisma.integration.upsert({
      where: { organizationId_type: { organizationId, type: "vk" } },
      create: {
        organizationId,
        type: "vk",
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
    const meta = (row.metadata ?? {}) as VkMetadata;
    if (!meta.groupId || !meta.webhookSecret || !meta.confirmationCode) {
      throw new BadRequestException("Сначала сохраните все поля VK");
    }

    const webhookUrl = this.webhookUrl(organizationId, meta.webhookSecret);
    let serverId = meta.callbackServerId;

    try {
      if (serverId) {
        await this.vkApi("groups.setCallbackSettings", token, {
          group_id: meta.groupId,
          server_id: serverId,
          message_new: 1,
        });
      } else {
        serverId = await this.vkApi<number>("groups.addCallbackServer", token, {
          group_id: meta.groupId,
          url: webhookUrl,
          title: "botme",
          secret_key: meta.webhookSecret,
        });
        await this.vkApi("groups.setCallbackSettings", token, {
          group_id: meta.groupId,
          server_id: serverId,
          message_new: 1,
        });
      }
    } catch (err) {
      const desc = err instanceof Error ? err.message : "Ошибка Callback API";
      await this.prisma.integration.update({
        where: { id: row.id },
        data: { status: "ERROR", lastError: desc },
      });
      await this.notifications.notifyOrg({
        organizationId,
        type: "integration_error",
        title: "Ошибка VK",
        body: desc,
      });
      throw new BadRequestException(`VK: ${desc}`);
    }

    await this.prisma.integration.update({
      where: { id: row.id },
      data: {
        status: "CONNECTED",
        enabled: true,
        lastError: null,
        metadata: { ...meta, callbackServerId: serverId },
      },
    });

    return this.getStatus(organizationId);
  }

  async disconnect(organizationId: string) {
    const row = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "vk" } },
    });
    if (!row?.credentialsEnc) {
      return this.getStatus(organizationId);
    }

    const meta = (row.metadata ?? {}) as VkMetadata;
    const token = this.decryptToken(row.credentialsEnc);
    if (meta.groupId && meta.callbackServerId) {
      try {
        await this.vkApi("groups.deleteCallbackServer", token, {
          group_id: meta.groupId,
          server_id: meta.callbackServerId,
        });
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
    body: VkWebhookBody,
  ) {
    const row = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "vk" } },
    });
    if (!row) {
      return { kind: "text" as const, body: "ok" };
    }

    const meta = (row.metadata ?? {}) as VkMetadata;

    if (body.type === "confirmation") {
      if (
        meta.webhookSecret &&
        body.secret !== meta.webhookSecret &&
        secret !== meta.webhookSecret
      ) {
        return { kind: "text" as const, body: "forbidden" };
      }
      return {
        kind: "text" as const,
        body: meta.confirmationCode ?? "ok",
      };
    }

    if (meta.webhookSecret && secret !== meta.webhookSecret && body.secret !== meta.webhookSecret) {
      return { kind: "text" as const, body: "forbidden" };
    }

    if (body.type !== "message_new") {
      return { kind: "text" as const, body: "ok" };
    }

    const message = body.object?.message;
    const msgId = message?.id;
    if (msgId != null) {
      const isNew = await this.dedup.tryClaim({
        source: "vk",
        dedupeKey: `${organizationId}:${msgId}`,
        organizationId,
      });
      if (!isNew) return { kind: "text" as const, body: "ok" };
    }

    if (row.status !== "CONNECTED" || !row.enabled) {
      return { kind: "text" as const, body: "ok" };
    }

    const text = message?.text?.trim();
    const peerId = message?.peer_id;
    const fromId = message?.from_id;

    if (!text || !peerId || message?.out === 1) {
      return { kind: "text" as const, body: "ok" };
    }

    if (meta.groupId && fromId === -meta.groupId) {
      return { kind: "text" as const, body: "ok" };
    }

    if (!meta.assistantId) {
      return { kind: "text" as const, body: "ok" };
    }

    const externalId = String(peerId);
    const peerName = fromId ? `VK · ${fromId}` : `VK · ${peerId}`;

    let conversation = await this.prisma.conversation.findUnique({
      where: {
        organizationId_channel_externalId: {
          organizationId,
          channel: "vk",
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
          channel: "vk",
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
        metadata: { vkMessageId: msgId, peerId, fromId },
      },
    });

    await this.leads.maybeCreateFromMessage({
      organizationId,
      assistantId: meta.assistantId,
      text,
      source: "vk",
      conversationId: conversation.id,
      peerName,
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), peerName },
    });

    if (conversation.status === "human_active") {
      return { kind: "text" as const, body: "ok" };
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
    await this.sendMessage(token, peerId, reply);

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
      },
    });

    return { kind: "text" as const, body: "ok" };
  }

  async sendOutboundForConversation(
    organizationId: string,
    conversation: { externalId: string | null },
    text: string,
  ) {
    if (!conversation.externalId) {
      throw new BadRequestException("Нет externalId для VK-диалога");
    }

    const peerId = Number(conversation.externalId);
    if (Number.isNaN(peerId)) {
      throw new BadRequestException("Некорректный peer_id VK");
    }

    const row = await this.getIntegration(organizationId);
    const token = this.decryptToken(row.credentialsEnc!);
    await this.sendMessage(token, peerId, text);
  }

  private async sendMessage(token: string, peerId: number, text: string) {
    await this.vkApi("messages.send", token, {
      peer_id: peerId,
      random_id: Date.now(),
      message: text.slice(0, 4096),
    });
  }

  private async getIntegration(organizationId: string) {
    const row = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "vk" } },
    });
    if (!row?.credentialsEnc) {
      throw new NotFoundException("VK не настроен");
    }
    return row;
  }

  private decryptToken(encrypted: string) {
    return this.crypto.decrypt(encrypted);
  }

  private webhookUrl(organizationId: string, secret: string) {
    const origin =
      this.config.get<string>("WEB_ORIGIN") ?? "https://bot-me.neeklo.ru";
    return `${origin}/api/webhooks/vk/${organizationId}?secret=${secret}`;
  }

  private async vkApi<T>(
    method: string,
    token: string,
    params: Record<string, string | number>,
  ): Promise<T> {
    const res = await fetch(`https://api.vk.com/method/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(params).map(([k, v]) => [k, String(v)]),
        ),
        access_token: token,
        v: "5.199",
      }),
    });

    const data = (await res.json()) as {
      response?: T;
      error?: { error_msg?: string; error_code?: number };
    };

    if (data.error) {
      throw new BadRequestException(data.error.error_msg ?? "Ошибка VK API");
    }

    return data.response as T;
  }
}
