import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { Public } from "../auth/auth.decorators";
import { WebhookRateLimitGuard } from "../common/webhook-rate-limit.service";
import { TelegramService } from "./telegram.service";
import { AvitoService } from "./avito.service";
import { VkService } from "./vk.service";
import { MaxService } from "./max.service";

@Controller("webhooks")
export class WebhooksController {
  constructor(
    private readonly telegram: TelegramService,
    private readonly avito: AvitoService,
    private readonly vk: VkService,
    private readonly max: MaxService,
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

  @Public()
  @UseGuards(WebhookRateLimitGuard)
  @Post("vk/:organizationId")
  async handleVkWebhook(
    @Param("organizationId") organizationId: string,
    @Query("secret") secret: string | undefined,
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ) {
    const result = await this.vk.handleWebhook(
      organizationId,
      secret,
      body as Parameters<VkService["handleWebhook"]>[2],
    );
    res.type("text/plain").send(result.body);
  }

  @Public()
  @UseGuards(WebhookRateLimitGuard)
  @Post("max/:organizationId")
  handleMaxWebhook(
    @Param("organizationId") organizationId: string,
    @Query("secret") secret: string | undefined,
    @Headers("x-max-bot-api-secret") headerSecret: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.max.handleWebhook(
      organizationId,
      secret,
      headerSecret,
      body as Parameters<MaxService["handleWebhook"]>[3],
    );
  }
}
