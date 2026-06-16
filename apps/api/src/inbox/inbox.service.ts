import { Injectable, NotFoundException } from "@nestjs/common";
import type { InboxConversationDto, InboxMessageDto } from "@botme/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InboxService {
  constructor(private readonly prisma: PrismaService) {}

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
}
