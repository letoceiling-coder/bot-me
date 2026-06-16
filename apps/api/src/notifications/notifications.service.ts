import { Injectable, Logger } from "@nestjs/common";
import type { NotificationDto, NotificationsSummaryDto } from "@botme/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "./email.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
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
    const admins = await this.prisma.user.findMany({
      where: {
        organizationId,
        role: { in: ["OWNER", "ADMIN"] },
      },
      select: { email: true },
    });

    if (!this.email.isConfigured()) {
      for (const admin of admins) {
        this.logger.debug(`[email stub] ${admin.email}: ${subject}`);
      }
      return;
    }

    const text = `${subject}\n\n${body}\n\n— botme`;
    for (const admin of admins) {
      const sent = await this.email.send(admin.email, subject, text);
      if (sent) {
        this.logger.log(`Email sent to ${admin.email}: ${subject}`);
      }
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
