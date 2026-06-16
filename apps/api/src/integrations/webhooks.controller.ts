import { Body, Controller, Param, Post } from "@nestjs/common";
import { Public } from "../auth/auth.decorators";
import { TelegramService } from "./telegram.service";

@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly telegram: TelegramService) {}

  @Public()
  @Post("telegram/:organizationId")
  handleTelegramWebhook(
    @Param("organizationId") organizationId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.telegram.handleWebhook(organizationId, body);
  }
}
