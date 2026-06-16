import { Body, Controller, Param, Post, Query } from "@nestjs/common";
import { Public } from "../auth/auth.decorators";
import { TelegramService } from "./telegram.service";
import { AvitoService } from "./avito.service";

@Controller("webhooks")
export class WebhooksController {
  constructor(
    private readonly telegram: TelegramService,
    private readonly avito: AvitoService,
  ) {}

  @Public()
  @Post("telegram/:organizationId")
  handleTelegramWebhook(
    @Param("organizationId") organizationId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.telegram.handleWebhook(organizationId, body);
  }

  @Public()
  @Post("avito/:organizationId")
  handleAvitoWebhook(
    @Param("organizationId") organizationId: string,
    @Query("secret") secret: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.avito.handleWebhook(organizationId, secret, body);
  }
}
