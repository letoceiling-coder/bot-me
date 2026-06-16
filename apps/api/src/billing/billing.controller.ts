import { Body, Controller, Get, Headers, Post, UseGuards, ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Public, CurrentUser } from "../auth/auth.decorators";
import { PrismaService } from "../prisma/prisma.service";
import { BillingService } from "./billing.service";
import { UsageService } from "./usage.service";
import { CheckoutDto } from "./billing.dto";

@Controller("billing")
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly usage: UsageService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("status")
  status(@CurrentUser() user: { organizationId: string }) {
    return this.billing.getStatus(user.organizationId);
  }

  @Get("usage")
  getUsage(@CurrentUser() user: { organizationId: string }) {
    return this.usage.getUsageSummary(user.organizationId);
  }

  @Post("checkout")
  checkout(
    @CurrentUser() user: { organizationId: string },
    @Body() body: CheckoutDto,
  ) {
    return this.billing.createCheckout(user.organizationId, body.tariffSlug);
  }

  @Post("sync")
  sync(@CurrentUser() user: { organizationId: string }) {
    return this.billing.syncPayment(user.organizationId);
  }

  @Post("e2e/activate")
  async e2eActivate(
    @CurrentUser() user: { userId: string; organizationId: string },
    @Headers("x-e2e-secret") secret: string | undefined,
  ) {
    const expected = this.config.get<string>("E2E_TEST_SECRET");
    if (!expected || secret !== expected) {
      throw new ForbiddenException();
    }

    const dbUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.userId },
      select: { email: true },
    });

    return this.billing.e2eActivateSubscription(
      user.organizationId,
      dbUser.email,
    );
  }

  @Public()
  @Post("webhook/yukassa")
  webhook(@Body() body: Record<string, unknown>) {
    return this.billing.handleYukassaWebhook(
      body as Parameters<BillingService["handleYukassaWebhook"]>[0],
    );
  }
}
