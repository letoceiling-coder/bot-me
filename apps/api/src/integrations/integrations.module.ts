import { Module } from "@nestjs/common";
import { AgentModule } from "../agent/agent.module";
import { LeadsModule } from "../leads/leads.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { CryptoService } from "../common/crypto.service";
import { WebhookDedupService } from "../common/webhook-dedup.service";
import {
  WebhookRateLimitGuard,
  WebhookRateLimitService,
} from "../common/webhook-rate-limit.service";
import { IntegrationsController } from "./integrations.controller";
import { WebhooksController } from "./webhooks.controller";
import { TelegramService } from "./telegram.service";
import { AvitoService } from "./avito.service";

@Module({
  imports: [AgentModule, LeadsModule, NotificationsModule],
  controllers: [IntegrationsController, WebhooksController],
  providers: [
    TelegramService,
    AvitoService,
    CryptoService,
    WebhookDedupService,
    WebhookRateLimitService,
    WebhookRateLimitGuard,
  ],
  exports: [TelegramService, AvitoService],
})
export class IntegrationsModule {}
