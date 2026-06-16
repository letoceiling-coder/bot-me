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
import { KnowledgeModule } from "./knowledge/knowledge.module";
import { AgentModule } from "./agent/agent.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { InboxModule } from "./inbox/inbox.module";
import { LeadsModule } from "./leads/leads.module";

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
    KnowledgeModule,
    AgentModule,
    AssistantsModule,
    IntegrationsModule,
    InboxModule,
    LeadsModule,
  ],
})
export class AppModule {}
