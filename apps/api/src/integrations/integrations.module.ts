import { Module } from "@nestjs/common";
import { AgentModule } from "../agent/agent.module";
import { CryptoService } from "../common/crypto.service";
import { IntegrationsController } from "./integrations.controller";
import { WebhooksController } from "./webhooks.controller";
import { TelegramService } from "./telegram.service";

@Module({
  imports: [AgentModule],
  controllers: [IntegrationsController, WebhooksController],
  providers: [TelegramService, CryptoService],
  exports: [TelegramService],
})
export class IntegrationsModule {}
