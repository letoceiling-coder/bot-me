import { Body, Controller, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Public } from "../auth/auth.decorators";
import {
  WebhookRateLimitGuard,
} from "../common/webhook-rate-limit.service";
import { TelegramService } from "./telegram.service";
import { AvitoService } from "./avito.service";

@Controller("webhooks")
export class WebhooksController {
  constructor(
    private readonly telegram: TelegramService,
    private readonly avito: AvitoService,
  ) {}

  @Public()
  @UseGuards(WebhookRateLimitGuard)
  @Post("telegram/:organizationId")
  handleTelegramWebhook(
    @Param("organizationId") organizationId: string,
    @Query("secret") secret: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.telegram.handleWebhook(organizationId, secret, body);
  }

  @Public()
  @UseGuards(WebhookRateLimitGuard)
  @Post("avito/:organizationId")
  handleAvitoWebhook(
    @Param("organizationId") organizationId: string,
    @Query("secret") secret: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.avito.handleWebhook(organizationId, secret, body);
  }
}
