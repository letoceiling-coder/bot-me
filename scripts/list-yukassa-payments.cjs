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

  const shopId = await getSetting("yukassa.shop_id");
  const secretKey = await getSetting("yukassa.secret_key");
  const sandbox = (await getSetting("yukassa.sandbox")) !== "false";
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");

  console.log("org:", user.organizationId, "sandbox:", sandbox);

  const res = await fetch("https://api.yookassa.ru/v3/payments?limit=20", {
    headers: { Authorization: `Basic ${auth}` },
  });
  const data = await res.json();
  if (!data.items) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  for (const p of data.items) {
    const meta = p.metadata || {};
    if (
      meta.organizationId === user.organizationId ||
      p.description?.includes("botme")
    ) {
      console.log(
        p.id,
        p.status,
        p.amount?.value,
        p.created_at,
        JSON.stringify(meta),
      );
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
