import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { NotificationDto, NotificationsSummaryDto } from "@botme/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async list(organizationId: string, userId: string): Promise<NotificationsSummaryDto> {
    const rows = await this.prisma.notification.findMany({
      where: {
        organizationId,
        OR: [{ userId: null }, { userId }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = rows.filter((r) => !r.read).length;
    return {
      items: rows.map((r) => this.toDto(r)),
      unreadCount,
    };
  }

  async markRead(organizationId: string, userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: {
        id,
        organizationId,
        OR: [{ userId: null }, { userId }],
      },
      data: { read: true },
    });
    return { ok: true };
  }

  async markAllRead(organizationId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        organizationId,
        read: false,
        OR: [{ userId: null }, { userId }],
      },
      data: { read: true },
    });
    return { ok: true };
  }

  async notifyOrg(params: {
    organizationId: string;
    type: string;
    title: string;
    body: string;
    userId?: string | null;
    sendEmail?: boolean;
  }) {
    await this.prisma.notification.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId ?? null,
        type: params.type,
        title: params.title,
        body: params.body,
      },
    });

    if (params.sendEmail !== false) {
      await this.sendEmailToAdmins(
        params.organizationId,
        params.title,
        params.body,
      );
    }
  }

  private async sendEmailToAdmins(
    organizationId: string,
    subject: string,
    body: string,
  ) {
    const smtpHost = this.config.get<string>("SMTP_HOST");
    if (!smtpHost) return;

    const admins = await this.prisma.user.findMany({
      where: {
        organizationId,
        role: { in: ["OWNER", "ADMIN"] },
      },
      select: { email: true },
    });

    for (const admin of admins) {
      this.logger.log(`[email] ${admin.email}: ${subject} — ${body.slice(0, 120)}`);
    }
  }

  private toDto(row: {
    id: string;
    type: string;
    title: string;
    body: string;
    read: boolean;
    createdAt: Date;
  }): NotificationDto {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      read: row.read,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
