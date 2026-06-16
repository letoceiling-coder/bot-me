import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PlatformAdminGuard } from "./platform-admin.guard";
import { SettingsAdminService } from "./settings-admin.service";
import { NeekloSettingsDto, YukassaSettingsDto } from "./tariffs-admin.dto";

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
}
