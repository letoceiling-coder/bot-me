import { Module } from "@nestjs/common";
import { CryptoService } from "../common/crypto.service";
import { TariffsAdminController } from "./tariffs-admin.controller";
import { TariffsAdminService } from "./tariffs-admin.service";
import { SettingsAdminController } from "./settings-admin.controller";
import { SettingsAdminService } from "./settings-admin.service";
import { PlatformAdminGuard } from "./platform-admin.guard";

@Module({
  controllers: [TariffsAdminController, SettingsAdminController],
  providers: [
    TariffsAdminService,
    SettingsAdminService,
    CryptoService,
    PlatformAdminGuard,
  ],
  exports: [SettingsAdminService, TariffsAdminService],
})
export class AdminModule {}
