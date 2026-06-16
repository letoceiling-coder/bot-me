const { PrismaClient } = require("@prisma/client");
const { createDecipheriv } = require("crypto");

const prisma = new PrismaClient();
const email = process.argv[2] || "letoceiling@gmail.com";

function decryptSecret(payload) {
  const hex = process.env.ENCRYPTION_KEY || "";
  const key = Buffer.from(hex.slice(0, 64), "hex");
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

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { organization: true },
  });
  if (!user) throw new Error("User not found");

  console.log("Before:", user.organization.subscriptionStatus);

  const shopId = await getSetting("yukassa.shop_id");
  const secretKey = await getSetting("yukassa.secret_key");
  if (!shopId || !secretKey) throw new Error("YuKassa not configured");

  const pending = await prisma.payment.findMany({
    where: { organizationId: user.organizationId, status: "pending" },
    orderBy: { createdAt: "desc" },
  });

  const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");

  for (const payment of pending) {
    if (!payment.yukassaId) continue;
    const res = await fetch(
      `https://api.yookassa.ru/v3/payments/${payment.yukassaId}`,
      { headers: { Authorization: `Basic ${auth}` } },
    );
    const data = await res.json();
    console.log(payment.yukassaId, data.status);

    if (data.status === "succeeded") {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "succeeded" },
        }),
        prisma.organization.update({
          where: { id: user.organizationId },
          data: {
            plan: payment.tariffSlug,
            subscriptionStatus: "active",
            subscriptionExpiresAt: expiresAt,
          },
        }),
      ]);
      console.log("Activated");
      break;
    }
  }

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: user.organizationId },
  });
  console.log("After:", org.subscriptionStatus, org.subscriptionExpiresAt);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
