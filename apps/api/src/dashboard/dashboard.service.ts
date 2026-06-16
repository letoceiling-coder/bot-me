import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(organizationId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [integrations, assistants, conversationsToday] = await Promise.all([
      this.prisma.integration.count({
        where: { organizationId, status: "CONNECTED" },
      }),
      this.prisma.assistant.count({ where: { organizationId, isActive: true } }),
      this.prisma.conversation.count({
        where: { organizationId, createdAt: { gte: startOfDay } },
      }),
    ]);

    return { integrations, assistants, conversationsToday };
  }
}
