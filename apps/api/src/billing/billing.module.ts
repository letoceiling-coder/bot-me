import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { PrismaModule } from "../prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { UsageService } from "./usage.service";

@Module({
  imports: [AdminModule, NotificationsModule, PrismaModule],
  controllers: [BillingController],
  providers: [BillingService, UsageService],
  exports: [BillingService, UsageService],
})
export class BillingModule {}
