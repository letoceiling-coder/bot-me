import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsAdminService } from "../admin/settings-admin.service";

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsAdminService,
    private readonly config: ConfigService,
  ) {}

  async getStatus(organizationId: string) {
    let org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });

    // Webhook может не дойти — подтягиваем статус из ЮKassa при каждом запросе
    if (org.subscriptionStatus !== "active") {
      await this.syncPayment(organizationId);
      org = await this.prisma.organization.findUniqueOrThrow({
        where: { id: organizationId },
      });
    }

    const tariff = await this.prisma.tariffPlan.findUnique({
      where: { slug: org.plan },
    });

    const pending = await this.prisma.payment.findFirst({
      where: { organizationId, status: "pending" },
      orderBy: { createdAt: "desc" },
    });

    return {
      subscriptionStatus: org.subscriptionStatus,
      plan: org.plan,
      expiresAt: org.subscriptionExpiresAt?.toISOString() ?? null,
      tariff: tariff
        ? {
            slug: tariff.slug,
            name: tariff.name,
            priceMonthly: tariff.priceMonthly,
            currency: tariff.currency,
          }
        : null,
      pendingPaymentUrl: pending?.confirmationUrl ?? null,
    };
  }

  async createCheckout(organizationId: string, tariffSlug: string) {
    await this.syncPayment(organizationId);
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    if (org.subscriptionStatus === "active") {
      throw new BadRequestException("Подписка уже активна");
    }

    const tariff = await this.prisma.tariffPlan.findFirst({
      where: { slug: tariffSlug, isActive: true },
    });
    if (!tariff) {
      throw new NotFoundException("Тариф не найден");
    }

    const creds = await this.settings.getYukassaCredentials();
    if (!creds.shopId || !creds.secretKey) {
      throw new BadRequestException("ЮKassa не настроена администратором");
    }

    const webOrigin =
      this.config.get<string>("WEB_ORIGIN") ?? "https://bot-me.neeklo.ru";
    const paymentId = randomUUID();
    const amountValue = (tariff.priceMonthly / 100).toFixed(2);

    const body = {
      amount: { value: amountValue, currency: tariff.currency },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: `${webOrigin}/onboarding?step=done`,
      },
      description: `Подписка botme — ${tariff.name}`,
      metadata: { organizationId, tariffSlug },
    };

    const auth = Buffer.from(`${creds.shopId}:${creds.secretKey}`).toString(
      "base64",
    );
    const res = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        "Idempotence-Key": paymentId,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`ЮKassa: ${err.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      id: string;
      status: string;
      confirmation?: { confirmation_url?: string };
    };

    await this.prisma.payment.create({
      data: {
        id: paymentId,
        organizationId,
        tariffSlug,
        amount: tariff.priceMonthly,
        currency: tariff.currency,
        yukassaId: data.id,
        status: "pending",
        confirmationUrl: data.confirmation?.confirmation_url ?? null,
      },
    });

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { subscriptionStatus: "pending", plan: tariffSlug },
    });

    return {
      paymentId,
      confirmationUrl: data.confirmation?.confirmation_url,
    };
  }

  async handleYukassaWebhook(payload: {
    event?: string;
    object?: {
      id?: string;
      status?: string;
      metadata?: { organizationId?: string; tariffSlug?: string };
    };
  }) {
    if (payload.event !== "payment.succeeded" || !payload.object?.id) {
      return { ok: true, skipped: true };
    }

    await this.activateByYukassaId(payload.object.id);
    return { ok: true };
  }

  private async activateByYukassaId(yukassaId: string) {
    let payment = await this.prisma.payment.findUnique({
      where: { yukassaId },
    });

    if (!payment) {
      const creds = await this.settings.getYukassaCredentials();
      if (!creds.shopId || !creds.secretKey) return;
      const auth = Buffer.from(`${creds.shopId}:${creds.secretKey}`).toString(
        "base64",
      );
      const res = await fetch(
        `https://api.yookassa.ru/v3/payments/${yukassaId}`,
        { headers: { Authorization: `Basic ${auth}` } },
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        status?: string;
        amount?: { value?: string; currency?: string };
        metadata?: { organizationId?: string; tariffSlug?: string };
      };
      if (data.status !== "succeeded" || !data.metadata?.organizationId) return;

      payment = await this.prisma.payment.create({
        data: {
          organizationId: data.metadata.organizationId,
          tariffSlug: data.metadata.tariffSlug ?? "start",
          amount: Math.round(Number(data.amount?.value ?? 0) * 100),
          currency: data.amount?.currency ?? "RUB",
          yukassaId,
          status: "pending",
        },
      });
    }

    if (payment.status === "succeeded") return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: "succeeded" },
      }),
      this.prisma.organization.update({
        where: { id: payment.organizationId },
        data: {
          plan: payment.tariffSlug,
          subscriptionStatus: "active",
          subscriptionExpiresAt: expiresAt,
        },
      }),
    ]);
  }

  async syncPayment(organizationId: string) {
    const creds = await this.settings.getYukassaCredentials();
    if (!creds.shopId || !creds.secretKey) return { synced: false };

    const auth = Buffer.from(`${creds.shopId}:${creds.secretKey}`).toString(
      "base64",
    );

    const pendingList = await this.prisma.payment.findMany({
      where: { organizationId, status: "pending" },
      orderBy: { createdAt: "desc" },
    });

    for (const pending of pendingList) {
      if (!pending.yukassaId) continue;
      const res = await fetch(
        `https://api.yookassa.ru/v3/payments/${pending.yukassaId}`,
        { headers: { Authorization: `Basic ${auth}` } },
      );
      if (!res.ok) continue;

      const data = (await res.json()) as { status?: string };
      if (data.status === "succeeded") {
        await this.activateByYukassaId(pending.yukassaId);
        return { synced: true, status: "active" };
      }
      if (data.status === "canceled") {
        await this.prisma.payment.update({
          where: { id: pending.id },
          data: { status: "canceled" },
        });
        const org = await this.prisma.organization.findUnique({
          where: { id: organizationId },
        });
        if (org?.subscriptionStatus === "pending") {
          await this.prisma.organization.update({
            where: { id: organizationId },
            data: { subscriptionStatus: "none" },
          });
        }
      }
    }

    const listRes = await fetch(
      "https://api.yookassa.ru/v3/payments?limit=100",
      { headers: { Authorization: `Basic ${auth}` } },
    );
    if (listRes.ok) {
      const list = (await listRes.json()) as {
        items?: Array<{
          id: string;
          status?: string;
          metadata?: { organizationId?: string };
        }>;
      };
      for (const item of list.items ?? []) {
        if (
          item.status === "succeeded" &&
          item.metadata?.organizationId === organizationId
        ) {
          await this.activateByYukassaId(item.id);
          return { synced: true, status: "active" };
        }
      }
    }

    return { synced: true, status: "none" };
  }
}
