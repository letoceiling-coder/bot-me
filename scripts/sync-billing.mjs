#!/usr/bin/env node
/**
 * Sync pending YuKassa payments for an organization (maintenance / recovery).
 * Usage: node scripts/sync-billing.mjs [email]
 */
import { PrismaClient } from "@prisma/client";
import { createDecipheriv } from "crypto";

const prisma = new PrismaClient();

const KEYS = {
  yukassaShopId: "yukassa.shop_id",
  yukassaSecret: "yukassa.secret_key",
};

function decryptSecret(payload) {
  const hex = process.env.ENCRYPTION_KEY ?? "";
  const key = Buffer.from(hex.slice(0, 64), "hex");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY must be 64 hex chars");
  const [ivHex, tagHex, dataHex] = payload.split(":");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

async function getSetting(key) {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  if (!row) return null;
  return row.isSecret ? decryptSecret(row.value) : row.value;
}

async function syncOrg(orgId) {
  const shopId = await getSetting(KEYS.yukassaShopId);
  const secretKey = await getSetting(KEYS.yukassaSecret);
  if (!shopId || !secretKey) {
    console.error("YuKassa credentials not configured");
    process.exit(1);
  }

  const pending = await prisma.payment.findMany({
    where: { organizationId: orgId, status: "pending" },
    orderBy: { createdAt: "desc" },
  });

  if (!pending.length) {
    console.log("No pending payments");
    return;
  }

  const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");

  for (const payment of pending) {
    if (!payment.yukassaId) continue;
    const res = await fetch(
      `https://api.yookassa.ru/v3/payments/${payment.yukassaId}`,
      { headers: { Authorization: `Basic ${auth}` } },
    );
    const data = await res.json();
    console.log(`Payment ${payment.yukassaId}: ${data.status}`);

    if (data.status === "succeeded") {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "succeeded" },
        }),
        prisma.organization.update({
          where: { id: orgId },
          data: {
            plan: payment.tariffSlug,
            subscriptionStatus: "active",
            subscriptionExpiresAt: expiresAt,
          },
        }),
      ]);
      console.log("Activated subscription for org", orgId);
      return;
    }
  }
}

const email = process.argv[2] ?? "letoceiling@gmail.com";

const user = await prisma.user.findUnique({
  where: { email: email.toLowerCase() },
  include: { organization: true },
});

if (!user) {
  console.error("User not found:", email);
  process.exit(1);
}

console.log("Before:", user.organization.subscriptionStatus);
await syncOrg(user.organizationId);

const org = await prisma.organization.findUniqueOrThrow({
  where: { id: user.organizationId },
});
console.log("After:", org.subscriptionStatus, org.subscriptionExpiresAt);

await prisma.$disconnect();
