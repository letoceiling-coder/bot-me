import { Body, Controller, Get, Post, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/auth.decorators";
import { TelegramService } from "./telegram.service";
import { AvitoService } from "./avito.service";
import {
  UpdateAvitoIntegrationDto,
  UpdateTelegramIntegrationDto,
} from "./integrations.dto";

@Controller("integrations")
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(
    private readonly telegram: TelegramService,
    private readonly avito: AvitoService,
  ) {}

  @Get("telegram")
  getTelegram(@CurrentUser() user: { organizationId: string }) {
    return this.telegram.getStatus(user.organizationId);
  }

  @Put("telegram")
  saveTelegram(
    @CurrentUser() user: { organizationId: string },
    @Body() body: UpdateTelegramIntegrationDto,
  ) {
    return this.telegram.saveCredentials(
      user.organizationId,
      body.botToken,
      body.assistantId,
    );
  }

  @Post("telegram/connect")
  connectTelegram(@CurrentUser() user: { organizationId: string }) {
    return this.telegram.connect(user.organizationId);
  }

  @Post("telegram/disconnect")
  disconnectTelegram(@CurrentUser() user: { organizationId: string }) {
    return this.telegram.disconnect(user.organizationId);
  }

  @Get("avito")
  getAvito(@CurrentUser() user: { organizationId: string }) {
    return this.avito.getStatus(user.organizationId);
  }

  @Put("avito")
  saveAvito(
    @CurrentUser() user: { organizationId: string },
    @Body() body: UpdateAvitoIntegrationDto,
  ) {
    return this.avito.saveCredentials(
      user.organizationId,
      body.clientId,
      body.clientSecret,
      body.profileId,
      body.assistantId,
    );
  }

  @Post("avito/connect")
  connectAvito(@CurrentUser() user: { organizationId: string }) {
    return this.avito.connect(user.organizationId);
  }

  @Post("avito/disconnect")
  disconnectAvito(@CurrentUser() user: { organizationId: string }) {
    return this.avito.disconnect(user.organizationId);
  }
}
