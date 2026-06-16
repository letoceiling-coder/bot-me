import { Body, Controller, Get, Post, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PlatformAdminGuard } from "./platform-admin.guard";
import { SettingsAdminService } from "./settings-admin.service";
import { NeekloSettingsDto, YukassaSettingsDto } from "./tariffs-admin.dto";
import { OpenRouterSettingsDto, S3SettingsDto } from "./settings.dto";

@Controller("admin/settings")
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class SettingsAdminController {
  constructor(private readonly settings: SettingsAdminService) {}

  @Get("yukassa")
  getYukassa() {
    return this.settings.getYukassaPublic();
  }

  @Put("yukassa")
  setYukassa(@Body() body: YukassaSettingsDto) {
    return this.settings.setYukassa(body);
  }

  @Get("neeklo")
  getNeeklo() {
    return this.settings.getNeekloPublic();
  }

  @Put("neeklo")
  setNeeklo(@Body() body: NeekloSettingsDto) {
    return this.settings.setNeeklo(body);
  }

  @Get("openrouter")
  getOpenRouter() {
    return this.settings.getOpenRouterPublic();
  }

  @Put("openrouter")
  setOpenRouter(@Body() body: OpenRouterSettingsDto) {
    return this.settings.setOpenRouter(body);
  }

  @Get("s3")
  getS3() {
    return this.settings.getS3Public();
  }

  @Put("s3")
  setS3(@Body() body: S3SettingsDto) {
    return this.settings.setS3(body);
  }

  @Post("test")
  testConnections() {
    return this.settings.testConnections();
  }
}
