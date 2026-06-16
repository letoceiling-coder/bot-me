import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class UsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  currentPeriod() {
    return new Date().toISOString().slice(0, 7);
  }

  async getUsageSummary(organizationId: string) {
    const period = this.currentPeriod();
    const limit = await this.getMessageLimit(organizationId);
    const row = await this.prisma.orgUsagePeriod.findUnique({
      where: { organizationId_period: { organizationId, period } },
    });
    const used = row?.messageCount ?? 0;
    return {
      period,
      used,
      limit,
      percent: limit > 0 ? Math.round((used / limit) * 100) : 0,
    };
  }

  async assertCanUseLlm(organizationId: string) {
    const limit = await this.getMessageLimit(organizationId);
    const period = this.currentPeriod();
    const row = await this.prisma.orgUsagePeriod.findUnique({
      where: { organizationId_period: { organizationId, period } },
    });
    if ((row?.messageCount ?? 0) >= limit) {
      throw new BadRequestException(
        `Лимит тарифа: ${limit} сообщений/мес. Обновите тариф или дождитесь нового периода.`,
      );
    }
  }

  async recordLlmCall(organizationId: string) {
    const period = this.currentPeriod();
    const limit = await this.getMessageLimit(organizationId);

    const row = await this.prisma.orgUsagePeriod.upsert({
      where: { organizationId_period: { organizationId, period } },
      create: {
        organizationId,
        period,
        messageCount: 1,
        llmCalls: 1,
      },
      update: {
        messageCount: { increment: 1 },
        llmCalls: { increment: 1 },
      },
    });

    const percent = limit > 0 ? row.messageCount / limit : 0;
    if (percent >= 0.8 && !row.usageWarningSent) {
      await this.notifications.notifyOrg({
        organizationId,
        type: "usage_warning",
        title: "Использовано 80% лимита сообщений",
        body: `${row.messageCount} из ${limit} за ${period}`,
        sendEmail: true,
      });
      await this.prisma.orgUsagePeriod.update({
        where: { id: row.id },
        data: { usageWarningSent: true },
      });
    }
  }

  private async getMessageLimit(organizationId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    const tariff = await this.prisma.tariffPlan.findUnique({
      where: { slug: org.plan },
    });
    const limits = (tariff?.limits ?? {}) as { messages?: number };
    return limits.messages ?? 500;
  }
}
