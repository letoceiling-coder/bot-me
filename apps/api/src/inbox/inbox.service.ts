import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { InboxConversationDto, InboxMessageDto } from "@botme/shared";
import { PrismaService } from "../prisma/prisma.service";
import { TelegramService } from "../integrations/telegram.service";
import { AvitoService } from "../integrations/avito.service";

@Injectable()
export class InboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    private readonly avito: AvitoService,
  ) {}

  async listConversations(organizationId: string): Promise<InboxConversationDto[]> {
    const rows = await this.prisma.conversation.findMany({
      where: { organizationId },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
    });

    return rows.map((c) => ({
      id: c.id,
      channel: c.channel,
      peerName: c.peerName,
      status: c.status,
      lastMessageAt: c.lastMessageAt.toISOString(),
      preview: c.messages[0]?.content?.slice(0, 120) ?? null,
      messageCount: c._count.messages,
    }));
  }

  async getMessages(
    organizationId: string,
    conversationId: string,
  ): Promise<InboxMessageDto[]> {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId },
    });
    if (!conv) throw new NotFoundException("Диалог не найден");

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async takeover(organizationId: string, conversationId: string) {
    const conv = await this.requireConversation(organizationId, conversationId);
    await this.prisma.conversation.update({
      where: { id: conv.id },
      data: { status: "human_active" },
    });
    return { ok: true, status: "human_active" };
  }

  async release(organizationId: string, conversationId: string) {
    const conv = await this.requireConversation(organizationId, conversationId);
    await this.prisma.conversation.update({
      where: { id: conv.id },
      data: { status: "bot_active" },
    });
    return { ok: true, status: "bot_active" };
  }

  async reply(
    organizationId: string,
    conversationId: string,
    content: string,
  ) {
    const conv = await this.requireConversation(organizationId, conversationId);

    if (conv.status === "bot_active") {
      await this.prisma.conversation.update({
        where: { id: conv.id },
        data: { status: "human_active" },
      });
    }

    if (conv.channel === "telegram") {
      await this.telegram.sendOutboundForConversation(organizationId, conv, content);
    } else if (conv.channel === "avito") {
      await this.avito.sendOutboundForConversation(organizationId, conv, content);
    } else {
      throw new BadRequestException("Канал не поддерживает исходящие сообщения");
    }

    await this.prisma.message.create({
      data: {
        conversationId: conv.id,
        role: "operator",
        content,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date() },
    });

    return { ok: true, status: "human_active" };
  }

  private async requireConversation(organizationId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId },
    });
    if (!conv) throw new NotFoundException("Диалог не найден");
    return conv;
  }
}
