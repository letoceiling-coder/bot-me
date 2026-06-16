import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { createCipheriv, randomBytes } from "crypto";

const prisma = new PrismaClient();

function encryptSetting(plain: string): string {
  const hex = process.env.ENCRYPTION_KEY ?? "";
  const key = Buffer.from(hex.slice(0, 64), "hex");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 64 hex chars");
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "dsc-23@yandex.ru").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "123123123";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Джон Уик";

  let org = await prisma.organization.findUnique({ where: { slug: "platform" } });
  if (!org) {
    org = await prisma.organization.create({
      data: { name: "Botme Platform", slug: "platform", plan: "business" },
    });
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      name: adminName,
      role: "ADMIN",
      isPlatformAdmin: true,
      organizationId: org.id,
    },
    update: {
      passwordHash,
      name: adminName,
      role: "ADMIN",
      isPlatformAdmin: true,
    },
  });

  const tariffs = [
    {
      slug: "start",
      name: "Старт",
      description: "Для начала работы с одним каналом",
      priceMonthly: 1000,
      features: ["1 ассистент", "1 канал", "500 сообщений/мес"],
      limits: { assistants: 1, channels: 1, messages: 500 },
      sortOrder: 1,
    },
    {
      slug: "pro",
      name: "Pro",
      description: "Для растущего бизнеса",
      priceMonthly: 299000,
      features: ["3 ассистента", "2 канала", "Coach agent", "5 ГБ KB"],
      limits: { assistants: 3, channels: 2, messages: 5000, kbGb: 5 },
      isFeatured: true,
      sortOrder: 2,
    },
    {
      slug: "business",
      name: "Business",
      description: "Максимум возможностей",
      priceMonthly: 799000,
      features: ["Безлимит каналов", "Операторы", "Webhooks", "Приоритет"],
      limits: { assistants: 10, channels: 99, messages: 50000, kbGb: 50 },
      sortOrder: 3,
    },
  ];

  for (const t of tariffs) {
    await prisma.tariffPlan.upsert({
      where: { slug: t.slug },
      create: { ...t, currency: "RUB", isActive: true },
      update: {
        name: t.name,
        description: t.description,
        priceMonthly: t.priceMonthly,
        features: t.features,
        limits: t.limits,
        isFeatured: t.isFeatured ?? false,
        sortOrder: t.sortOrder,
      },
    });
  }

  const neekloKey = process.env.NEEKLO_API_KEY?.trim();
  if (neekloKey) {
    await prisma.systemSetting.upsert({
      where: { key: "neeklo.api_key" },
      create: {
        key: "neeklo.api_key",
        value: encryptSetting(neekloKey),
        category: "neeklo",
        isSecret: true,
      },
      update: {
        value: encryptSetting(neekloKey),
        category: "neeklo",
        isSecret: true,
      },
    });
    await prisma.systemSetting.upsert({
      where: { key: "neeklo.base_url" },
      create: {
        key: "neeklo.base_url",
        value: "https://api.neeklo.ru",
        category: "neeklo",
        isSecret: false,
      },
      update: { value: "https://api.neeklo.ru" },
    });
  }

  console.log(`Seed OK: admin ${adminEmail}, tariffs ${tariffs.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
