/**
 * Seed platform keys from env (run on server only).
 */
import { PrismaClient } from "@prisma/client";
import { createCipheriv, randomBytes } from "crypto";

const prisma = new PrismaClient();

function encrypt(plain) {
  const hex = process.env.ENCRYPTION_KEY ?? "";
  const key = Buffer.from(hex.slice(0, 64), "hex");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY must be 64 hex chars");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

async function upsertSecret(key, value, category) {
  if (!value?.trim()) return;
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value: encrypt(value.trim()), category, isSecret: true },
    update: { value: encrypt(value.trim()), category, isSecret: true },
  });
}

async function upsertPlain(key, value, category) {
  if (!value?.trim()) return;
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value: value.trim(), category, isSecret: false },
    update: { value: value.trim(), category, isSecret: false },
  });
}

async function main() {
  await upsertSecret("openrouter.api_key", process.env.OPENROUTER_API_KEY, "openrouter");
  await upsertPlain(
    "openrouter.default_model",
    process.env.OPENROUTER_DEFAULT_MODEL ?? "openai/gpt-4o-mini",
    "openrouter",
  );
  await upsertPlain(
    "s3.endpoint",
    process.env.S3_ENDPOINT ?? "https://s3.ru-3.storage.selcloud.ru",
    "s3",
  );
  await upsertPlain("s3.region", process.env.S3_REGION ?? "ru-3", "s3");
  await upsertPlain("s3.bucket", process.env.S3_BUCKET ?? "botme", "s3");
  await upsertPlain("s3.access_key", process.env.S3_ACCESS_KEY, "s3");
  await upsertSecret("s3.secret_key", process.env.S3_SECRET_KEY, "s3");
  console.log("Platform keys seeded (only non-empty env vars)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
