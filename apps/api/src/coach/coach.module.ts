import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { AuditService } from "../common/audit.service";
import { OrgRoleGuard } from "../common/org-role.guard";
import { CoachController, AuditController } from "./coach.controller";
import { CoachService } from "./coach.service";

@Module({
  imports: [AdminModule],
  controllers: [CoachController, AuditController],
  providers: [CoachService, OrgRoleGuard],
  exports: [CoachService],
})
export class CoachModule {}
