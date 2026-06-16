import { Controller, Get } from "@nestjs/common";
import { Public } from "../auth/auth.decorators";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    const checks: Record<string, string> = { api: "ok" };
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = "ok";
    } catch {
      checks.database = "error";
    }
    const ok = checks.database === "ok";
    return {
      status: ok ? "ok" : "degraded",
      service: "botme-api",
      checks,
      version: process.env.npm_package_version ?? "0.0.1",
    };
  }
}
