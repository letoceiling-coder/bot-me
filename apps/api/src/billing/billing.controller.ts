import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Public, CurrentUser } from "../auth/auth.decorators";
import { BillingService } from "./billing.service";
import { CheckoutDto } from "./billing.dto";

@Controller("billing")
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get("status")
  status(@CurrentUser() user: { organizationId: string }) {
    return this.billing.getStatus(user.organizationId);
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

  @Public()
  @Post("webhook/yukassa")
  webhook(@Body() body: Record<string, unknown>) {
    return this.billing.handleYukassaWebhook(
      body as Parameters<BillingService["handleYukassaWebhook"]>[0],
    );
  }
}
