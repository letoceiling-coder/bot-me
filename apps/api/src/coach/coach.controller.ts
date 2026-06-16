import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/auth.decorators";
import { OrgRoleGuard, OrgRoles } from "../common/org-role.guard";
import { AuditService } from "../common/audit.service";
import { CoachService } from "./coach.service";
import { CoachAnalyzeDto } from "./coach.dto";

@Controller("coach")
@UseGuards(JwtAuthGuard, OrgRoleGuard)
@OrgRoles("OWNER", "ADMIN")
export class CoachController {
  constructor(
    private readonly coach: CoachService,
    private readonly audit: AuditService,
  ) {}

  @Post("sessions")
  async analyze(
    @CurrentUser() user: { userId: string; organizationId: string },
    @Body() body: CoachAnalyzeDto,
  ) {
    const result = await this.coach.analyzeConversation(
      user.organizationId,
      body.conversationId,
    );

    await this.audit.log({
      organizationId: user.organizationId,
      userId: user.userId,
      action: "coach.analyze",
      resource: `conversation:${body.conversationId}`,
      metadata: { suggestionCount: result.suggestions.length },
    });

    return result;
  }
}

@Controller("audit")
@UseGuards(JwtAuthGuard, OrgRoleGuard)
@OrgRoles("OWNER", "ADMIN")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@CurrentUser() user: { organizationId: string }) {
    return this.audit.listForOrg(user.organizationId);
  }
}
