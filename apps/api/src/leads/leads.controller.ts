import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/auth.decorators";
import { LeadsService } from "./leads.service";
import { CreateLeadDto, UpdateLeadDto } from "./leads.dto";

@Controller("leads")
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  list(@CurrentUser() user: { organizationId: string }) {
    return this.leads.list(user.organizationId);
  }

  @Post()
  create(
    @CurrentUser() user: { organizationId: string },
    @Body() body: CreateLeadDto,
  ) {
    return this.leads.create(user.organizationId, body);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: { organizationId: string },
    @Param("id") id: string,
    @Body() body: UpdateLeadDto,
  ) {
    return this.leads.update(user.organizationId, id, body);
  }
}
