import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { AdminModule } from "./admin/admin.module";
import { TariffsModule } from "./tariffs/tariffs.module";
import { BillingModule } from "./billing/billing.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { AssistantsModule } from "./assistants/assistants.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    HealthModule,
    AdminModule,
    TariffsModule,
    BillingModule,
    DashboardModule,
    AssistantsModule,
  ],
})
export class AppModule {}
