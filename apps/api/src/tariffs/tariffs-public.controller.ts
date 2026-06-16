import { Controller, Get } from "@nestjs/common";
import { Public } from "../auth/auth.decorators";
import { PrismaService } from "../prisma/prisma.service";

@Controller("tariffs")
export class TariffsPublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  listActive() {
    return this.prisma.tariffPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }
}
