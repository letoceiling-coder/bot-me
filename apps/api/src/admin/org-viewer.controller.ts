import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/auth.decorators";
import { PlatformAdminGuard } from "./platform-admin.guard";
import { AuditService } from "../common/audit.service";
import { PrismaService } from "../prisma/prisma.service";

@Controller("admin/org-viewer")
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class OrgViewerAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get("conversations")
  async listConversations(@Query("organizationId") organizationId?: string) {
    const rows = await this.prisma.conversation.findMany({
      where: organizationId ? { organizationId } : undefined,
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
    });

    const orgIds = [...new Set(rows.map((r) => r.organizationId))];
    const orgs = await this.prisma.organization.findMany({
      where: { id: { in: orgIds } },
      select: { id: true, name: true },
    });
    const orgMap = Object.fromEntries(orgs.map((o) => [o.id, o.name]));

    return rows.map((c) => ({
      id: c.id,
      organizationId: c.organizationId,
      organizationName: orgMap[c.organizationId] ?? "—",
      channel: c.channel,
      peerName: c.peerName,
      status: c.status,
      lastMessageAt: c.lastMessageAt.toISOString(),
      preview: c.messages[0]?.content?.slice(0, 120) ?? null,
      messageCount: c._count.messages,
    }));
  }

  @Get("conversations/:id/messages")
  async getMessages(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
  ) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id },
    });
    if (!conv) return [];

    await this.audit.log({
      organizationId: conv.organizationId,
      userId: user.userId,
      action: "admin.view_conversation",
      resource: `conversation:${id}`,
    });

    const messages = await this.prisma.message.findMany({
      where: { conversationId: id },
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
