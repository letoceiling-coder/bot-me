import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { BillingModule } from "../billing/billing.module";
import { AgentRuntimeService } from "./agent-runtime.service";

@Module({
  imports: [AdminModule, KnowledgeModule, BillingModule],
  providers: [AgentRuntimeService],
  exports: [AgentRuntimeService],
})
export class AgentModule {}
