import { Body, Controller, Get, Post, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/auth.decorators";
import { TelegramService } from "./telegram.service";
import { AvitoService } from "./avito.service";
import { VkService } from "./vk.service";
import { MaxService } from "./max.service";
import {
  UpdateAvitoIntegrationDto,
  UpdateMaxIntegrationDto,
  UpdateTelegramIntegrationDto,
  UpdateVkIntegrationDto,
} from "./integrations.dto";

@Controller("integrations")
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(
    private readonly telegram: TelegramService,
    private readonly avito: AvitoService,
    private readonly vk: VkService,
    private readonly max: MaxService,
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

  @Get("vk")
  getVk(@CurrentUser() user: { organizationId: string }) {
    return this.vk.getStatus(user.organizationId);
  }

  @Put("vk")
  saveVk(
    @CurrentUser() user: { organizationId: string },
    @Body() body: UpdateVkIntegrationDto,
  ) {
    return this.vk.saveCredentials(
      user.organizationId,
      body.accessToken,
      body.groupId,
      body.confirmationCode,
      body.webhookSecret,
      body.assistantId,
    );
  }

  @Post("vk/connect")
  connectVk(@CurrentUser() user: { organizationId: string }) {
    return this.vk.connect(user.organizationId);
  }

  @Post("vk/disconnect")
  disconnectVk(@CurrentUser() user: { organizationId: string }) {
    return this.vk.disconnect(user.organizationId);
  }

  @Get("max")
  getMax(@CurrentUser() user: { organizationId: string }) {
    return this.max.getStatus(user.organizationId);
  }

  @Put("max")
  saveMax(
    @CurrentUser() user: { organizationId: string },
    @Body() body: UpdateMaxIntegrationDto,
  ) {
    return this.max.saveCredentials(
      user.organizationId,
      body.botToken,
      body.assistantId,
    );
  }

  @Post("max/connect")
  connectMax(@CurrentUser() user: { organizationId: string }) {
    return this.max.connect(user.organizationId);
  }

  @Post("max/disconnect")
  disconnectMax(@CurrentUser() user: { organizationId: string }) {
    return this.max.disconnect(user.organizationId);
  }
}
