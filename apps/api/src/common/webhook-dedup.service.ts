import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class WebhookDedupService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns true if this is a new event; false if duplicate. */
  async tryClaim(params: {
    source: string;
    dedupeKey: string;
    organizationId?: string;
  }): Promise<boolean> {
    try {
      await this.prisma.webhookDedup.create({
        data: {
          source: params.source,
          dedupeKey: params.dedupeKey,
          organizationId: params.organizationId,
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}
