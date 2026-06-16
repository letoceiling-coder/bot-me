import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { TelegramIntegrationDto } from "@botme/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CryptoService } from "../common/crypto.service";
import { AgentRuntimeService } from "../agent/agent-runtime.service";
import { LeadsService } from "../leads/leads.service";

type TelegramMetadata = {
  assistantId?: string;
  botUsername?: string;
  botId?: number;
};

@Injectable()
export class TelegramService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly config: ConfigService,
    private readonly agent: AgentRuntimeService,
    private readonly leads: LeadsService,
  ) {}

  async getStatus(organizationId: string): Promise<TelegramIntegrationDto> {
    const row = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "telegram" } },
    });
    const meta = (row?.metadata ?? {}) as TelegramMetadata;
    const hasToken = Boolean(row?.credentialsEnc);
    return {
      status: row?.status ?? "DISCONNECTED",
      enabled: row?.enabled ?? false,
      lastError: row?.lastError ?? null,
      botUsername: meta.botUsername ?? null,
      assistantId: meta.assistantId ?? null,
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
      where: { organizationId_type: { organizationId, type: "telegram" } },
    });

    let meta: TelegramMetadata = {
      assistantId,
      botUsername: (existing?.metadata as TelegramMetadata)?.botUsername,
      botId: (existing?.metadata as TelegramMetadata)?.botId,
    };

    let encrypted = existing?.credentialsEnc ?? null;

    if (botToken?.trim()) {
      const me = await this.telegramApi(botToken.trim(), "getMe", {});
      if (!me.ok) {
        throw new BadRequestException("Неверный токен Telegram-бота");
      }
      const bot = me.result as { username?: string; id?: number };
      encrypted = this.crypto.encrypt(botToken.trim());
      meta = {
        assistantId,
        botUsername: bot.username ?? undefined,
        botId: bot.id ?? undefined,
      };
    } else if (!encrypted) {
      throw new BadRequestException("Укажите токен бота");
    }

    await this.prisma.integration.upsert({
      where: { organizationId_type: { organizationId, type: "telegram" } },
      create: {
        organizationId,
        type: "telegram",
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
    const webhookUrl = this.webhookUrl(organizationId);

    const result = await this.telegramApi(token, "setWebhook", {
      url: webhookUrl,
      allowed_updates: ["message"],
    });

    if (!result.ok) {
      const desc = (result as { description?: string }).description ?? "Ошибка webhook";
      await this.prisma.integration.update({
        where: { id: row.id },
        data: { status: "ERROR", lastError: desc },
      });
      throw new BadRequestException(`Telegram: ${desc}`);
    }

    await this.prisma.integration.update({
      where: { id: row.id },
      data: { status: "CONNECTED", enabled: true, lastError: null },
    });

    return this.getStatus(organizationId);
  }

  async disconnect(organizationId: string) {
    const row = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "telegram" } },
    });
    if (!row?.credentialsEnc) {
      return this.getStatus(organizationId);
    }

    const token = this.decryptToken(row.credentialsEnc);
    await this.telegramApi(token, "deleteWebhook", { drop_pending_updates: true });

    await this.prisma.integration.update({
      where: { id: row.id },
      data: { status: "DISCONNECTED", enabled: false, lastError: null },
    });

    return this.getStatus(organizationId);
  }

  async handleWebhook(organizationId: string, update: Record<string, unknown>) {
    const row = await this.getIntegration(organizationId);
    if (row.status !== "CONNECTED" || !row.enabled) {
      return { ok: true, skipped: true };
    }

    const message = update.message as
      | {
          message_id?: number;
          text?: string;
          chat?: { id?: number; first_name?: string; username?: string; title?: string };
          from?: { first_name?: string; username?: string };
        }
      | undefined;

    if (!message?.text || !message.chat?.id) {
      return { ok: true, skipped: true };
    }

    const meta = (row.metadata ?? {}) as TelegramMetadata;
    if (!meta.assistantId) {
      return { ok: true, skipped: true };
    }

    const token = this.decryptToken(row.credentialsEnc!);
    const chatId = String(message.chat.id);
    const peerName =
      message.chat.title ||
      message.from?.first_name ||
      message.chat.first_name ||
      message.chat.username ||
      `Chat ${chatId}`;

    let conversation = await this.prisma.conversation.findUnique({
      where: {
        organizationId_channel_externalId: {
          organizationId,
          channel: "telegram",
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
          channel: "telegram",
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
        content: message.text,
        metadata: { telegramMessageId: message.message_id },
      },
    });

    await this.leads.maybeCreateFromMessage({
      organizationId,
      assistantId: meta.assistantId,
      text: message.text,
      source: "telegram",
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
        userMessage: message.text,
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

    await this.telegramApi(token, "sendMessage", {
      chat_id: message.chat.id,
      text: reply.slice(0, 4000),
    });

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
      throw new BadRequestException("Нет externalId для Telegram-диалога");
    }

    const row = await this.getIntegration(organizationId);
    const token = this.decryptToken(row.credentialsEnc!);
    const chatId = Number(conversation.externalId);
    if (Number.isNaN(chatId)) {
      throw new BadRequestException("Некорректный chat ID Telegram");
    }

    const result = await this.telegramApi(token, "sendMessage", {
      chat_id: chatId,
      text: text.slice(0, 4000),
    });

    if (!result.ok) {
      const desc =
        (result as { description?: string }).description ?? "Ошибка отправки";
      throw new BadRequestException(`Telegram: ${desc}`);
    }
  }

  private async getIntegration(organizationId: string) {
    const row = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: "telegram" } },
    });
    if (!row?.credentialsEnc) {
      throw new NotFoundException("Telegram не настроен");
    }
    return row;
  }

  private decryptToken(encrypted: string) {
    return this.crypto.decrypt(encrypted);
  }

  private webhookUrl(organizationId: string) {
    const origin =
      this.config.get<string>("WEB_ORIGIN") ?? "https://bot-me.neeklo.ru";
    return `${origin}/api/webhooks/telegram/${organizationId}`;
  }

  private async telegramApi(
    token: string,
    method: string,
    body: Record<string, unknown>,
  ) {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json() as Promise<{ ok: boolean; result?: unknown; description?: string }>;
  }
}
