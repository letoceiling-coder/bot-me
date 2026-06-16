import { Module } from "@nestjs/common";
import { CryptoService } from "../common/crypto.service";
import { AuditService } from "../common/audit.service";
import { TariffsAdminController } from "./tariffs-admin.controller";
import { TariffsAdminService } from "./tariffs-admin.service";
import { SettingsAdminController } from "./settings-admin.controller";
import { SettingsAdminService } from "./settings-admin.service";
import { OrgViewerAdminController } from "./org-viewer.controller";
import { PlatformAdminGuard } from "./platform-admin.guard";

@Module({
  controllers: [
    TariffsAdminController,
    SettingsAdminController,
    OrgViewerAdminController,
  ],
  providers: [
    TariffsAdminService,
    SettingsAdminService,
    CryptoService,
    PlatformAdminGuard,
    AuditService,
  ],
  exports: [SettingsAdminService, TariffsAdminService, AuditService],
})
export class AdminModule {}
