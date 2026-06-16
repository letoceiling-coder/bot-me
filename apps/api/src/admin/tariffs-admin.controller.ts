import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PlatformAdminGuard } from "./platform-admin.guard";
import { TariffsAdminService } from "./tariffs-admin.service";
import { CreateTariffDto, UpdateTariffDto } from "./tariffs-admin.dto";

@Controller("admin/tariffs")
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class TariffsAdminController {
  constructor(private readonly tariffs: TariffsAdminService) {}

  @Get()
  list() {
    return this.tariffs.listAll();
  }

  @Post()
  create(@Body() body: CreateTariffDto) {
    return this.tariffs.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateTariffDto) {
    return this.tariffs.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tariffs.remove(id);
  }
}
