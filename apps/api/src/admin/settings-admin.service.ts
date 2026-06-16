import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CryptoService } from "../common/crypto.service";
import { NeekloSettingsDto, YukassaSettingsDto } from "./tariffs-admin.dto";
import { OpenRouterSettingsDto, S3SettingsDto } from "./settings.dto";

const KEYS = {
  yukassaShopId: "yukassa.shop_id",
  yukassaSecret: "yukassa.secret_key",
  yukassaSandbox: "yukassa.sandbox",
  neekloApiKey: "neeklo.api_key",
  neekloBaseUrl: "neeklo.base_url",
  openrouterApiKey: "openrouter.api_key",
  openrouterDefaultModel: "openrouter.default_model",
  s3Endpoint: "s3.endpoint",
  s3Region: "s3.region",
  s3Bucket: "s3.bucket",
  s3AccessKey: "s3.access_key",
  s3SecretKey: "s3.secret_key",
} as const;

@Injectable()
export class SettingsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async getYukassaPublic() {
    const shopId = await this.getPlain(KEYS.yukassaShopId);
    const secret = await this.getSecret(KEYS.yukassaSecret);
    const sandbox = await this.getPlain(KEYS.yukassaSandbox);
    return {
      shopId: shopId ?? "",
      secretKeyMasked: secret ? this.crypto.maskSecret(secret) : "",
      hasSecret: Boolean(secret),
      sandbox: sandbox === "true",
    };
  }

  async setYukassa(dto: YukassaSettingsDto) {
    await this.setPlain(KEYS.yukassaShopId, dto.shopId, "yukassa");
    if (dto.secretKey?.trim()) {
      await this.setSecret(KEYS.yukassaSecret, dto.secretKey.trim(), "yukassa");
    }
    await this.setPlain(
      KEYS.yukassaSandbox,
      String(dto.sandbox ?? true),
      "yukassa",
    );
    return this.getYukassaPublic();
  }

  async getNeekloPublic() {
    const apiKey = await this.getSecret(KEYS.neekloApiKey);
    const baseUrl =
      (await this.getPlain(KEYS.neekloBaseUrl)) ?? "https://api.neeklo.ru";
    return {
      baseUrl,
      apiKeyMasked: apiKey ? this.crypto.maskSecret(apiKey) : "",
      hasApiKey: Boolean(apiKey),
    };
  }

  async setNeeklo(dto: NeekloSettingsDto) {
    if (dto.apiKey?.trim()) {
      await this.setSecret(KEYS.neekloApiKey, dto.apiKey.trim(), "neeklo");
    }
    if (dto.baseUrl) {
      await this.setPlain(KEYS.neekloBaseUrl, dto.baseUrl, "neeklo");
    }
    return this.getNeekloPublic();
  }

  /** Internal use for payment / external services */
  async getYukassaCredentials() {
    return {
      shopId: await this.getPlain(KEYS.yukassaShopId),
      secretKey: await this.getSecret(KEYS.yukassaSecret),
      sandbox: (await this.getPlain(KEYS.yukassaSandbox)) !== "false",
    };
  }

  async getNeekloApiKey(): Promise<string | null> {
    return this.getSecret(KEYS.neekloApiKey);
  }

  async getNeekloBaseUrl(): Promise<string> {
    return (await this.getPlain(KEYS.neekloBaseUrl)) ?? "https://api.neeklo.ru";
  }

  async getOpenRouterPublic() {
    const apiKey = await this.getSecret(KEYS.openrouterApiKey);
    const defaultModel =
      (await this.getPlain(KEYS.openrouterDefaultModel)) ??
      "openai/gpt-4o-mini";
    return {
      defaultModel,
      apiKeyMasked: apiKey ? this.crypto.maskSecret(apiKey) : "",
      hasApiKey: Boolean(apiKey),
    };
  }

  async setOpenRouter(dto: OpenRouterSettingsDto) {
    if (dto.apiKey?.trim()) {
      await this.setSecret(KEYS.openrouterApiKey, dto.apiKey.trim(), "openrouter");
    }
    if (dto.defaultModel) {
      await this.setPlain(
        KEYS.openrouterDefaultModel,
        dto.defaultModel,
        "openrouter",
      );
    }
    return this.getOpenRouterPublic();
  }

  async getOpenRouterApiKey(): Promise<string | null> {
    return this.getSecret(KEYS.openrouterApiKey);
  }

  async getOpenRouterDefaultModel(): Promise<string> {
    return (
      (await this.getPlain(KEYS.openrouterDefaultModel)) ?? "openai/gpt-4o-mini"
    );
  }

  async getS3Public() {
    const secret = await this.getSecret(KEYS.s3SecretKey);
    const accessKey = await this.getPlain(KEYS.s3AccessKey);
    return {
      endpoint:
        (await this.getPlain(KEYS.s3Endpoint)) ??
        "https://s3.ru-3.storage.selcloud.ru",
      region: (await this.getPlain(KEYS.s3Region)) ?? "ru-3",
      bucket: (await this.getPlain(KEYS.s3Bucket)) ?? "botme",
      accessKey: accessKey ?? "",
      hasSecret: Boolean(secret),
      secretKeyMasked: secret ? this.crypto.maskSecret(secret) : "",
    };
  }

  async setS3(dto: S3SettingsDto) {
    if (dto.endpoint) await this.setPlain(KEYS.s3Endpoint, dto.endpoint, "s3");
    if (dto.region) await this.setPlain(KEYS.s3Region, dto.region, "s3");
    if (dto.bucket) await this.setPlain(KEYS.s3Bucket, dto.bucket, "s3");
    if (dto.accessKey) await this.setPlain(KEYS.s3AccessKey, dto.accessKey, "s3");
    if (dto.secretKey?.trim()) {
      await this.setSecret(KEYS.s3SecretKey, dto.secretKey.trim(), "s3");
    }
    return this.getS3Public();
  }

  async getS3Config() {
    return {
      endpoint:
        (await this.getPlain(KEYS.s3Endpoint)) ??
        "https://s3.ru-3.storage.selcloud.ru",
      region: (await this.getPlain(KEYS.s3Region)) ?? "ru-3",
      bucket: (await this.getPlain(KEYS.s3Bucket)) ?? "botme",
      accessKey: await this.getPlain(KEYS.s3AccessKey),
      secretKey: await this.getSecret(KEYS.s3SecretKey),
    };
  }

  async testConnections() {
    const [yukassa, neekloKey, neekloBase, openrouterKey, s3] = await Promise.all([
      this.getYukassaCredentials(),
      this.getNeekloApiKey(),
      this.getNeekloBaseUrl(),
      this.getOpenRouterApiKey(),
      this.getS3Config(),
    ]);

    const results = {
      yukassa: { ok: false, message: "Не настроено" },
      neeklo: { ok: false, message: "Не настроено" },
      openrouter: { ok: false, message: "Не настроено" },
      s3: { ok: false, message: "Не настроено" },
    };

    if (yukassa.shopId && yukassa.secretKey) {
      try {
        const auth = Buffer.from(`${yukassa.shopId}:${yukassa.secretKey}`).toString("base64");
        const res = await fetch("https://api.yookassa.ru/v3/me", {
          headers: { Authorization: `Basic ${auth}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { account_id?: string };
          results.yukassa = {
            ok: true,
            message: `Подключено (shop ${data.account_id ?? yukassa.shopId}${yukassa.sandbox ? ", sandbox" : ""})`,
          };
        } else {
          results.yukassa = {
            ok: false,
            message: `Ошибка ЮKassa: HTTP ${res.status}`,
          };
        }
      } catch (err) {
        results.yukassa = {
          ok: false,
          message: err instanceof Error ? err.message : "Ошибка ЮKassa",
        };
      }
    }

    if (neekloKey) {
      try {
        const base = neekloBase.replace(/\/$/, "");
        const res = await fetch(`${base}/v1/models`, {
          headers: { "x-api-key": neekloKey },
        });
        if (res.ok) {
          results.neeklo = { ok: true, message: "API-ключ принят, /v1/models доступен" };
        } else if (res.status === 401) {
          results.neeklo = { ok: false, message: "Neeklo: неверный API-ключ (401)" };
        } else {
          results.neeklo = { ok: false, message: `Neeklo: HTTP ${res.status}` };
        }
      } catch (err) {
        results.neeklo = {
          ok: false,
          message: err instanceof Error ? err.message : "Ошибка Neeklo",
        };
      }
    }

    if (openrouterKey) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/models", {
          headers: { Authorization: `Bearer ${openrouterKey}` },
        });
        if (res.ok) {
          results.openrouter = {
            ok: true,
            message: "OpenRouter API доступен",
          };
        } else {
          results.openrouter = {
            ok: false,
            message: `OpenRouter: HTTP ${res.status}`,
          };
        }
      } catch (err) {
        results.openrouter = {
          ok: false,
          message: err instanceof Error ? err.message : "Ошибка OpenRouter",
        };
      }
    }

    if (s3.accessKey && s3.secretKey && s3.bucket) {
      try {
        const { S3Client, HeadBucketCommand } = await import("@aws-sdk/client-s3");
        const endpoint = s3.endpoint?.startsWith("http")
          ? s3.endpoint
          : `https://${s3.endpoint}`;
        const client = new S3Client({
          region: s3.region ?? "ru-3",
          endpoint,
          credentials: {
            accessKeyId: s3.accessKey,
            secretAccessKey: s3.secretKey,
          },
          forcePathStyle: true,
        });
        await client.send(new HeadBucketCommand({ Bucket: s3.bucket }));
        results.s3 = {
          ok: true,
          message: `Бакет «${s3.bucket}» доступен (${s3.region})`,
        };
      } catch (err) {
        results.s3 = {
          ok: false,
          message: err instanceof Error ? err.message : "Ошибка S3",
        };
      }
    }

    return results;
  }

  private async getPlain(key: string) {
    const row = await this.prisma.systemSetting.findUnique({ where: { key } });
    return row?.value ?? null;
  }

  private async getSecret(key: string) {
    const row = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (!row?.value) return null;
    return this.crypto.decrypt(row.value);
  }

  private async setPlain(key: string, value: string, category: string) {
    await this.prisma.systemSetting.upsert({
      where: { key },
      create: { key, value, category, isSecret: false },
      update: { value, category, isSecret: false },
    });
  }

  private async setSecret(key: string, value: string, category: string) {
    await this.prisma.systemSetting.upsert({
      where: { key },
      create: {
        key,
        value: this.crypto.encrypt(value),
        category,
        isSecret: true,
      },
      update: {
        value: this.crypto.encrypt(value),
        category,
        isSecret: true,
      },
    });
  }
}
