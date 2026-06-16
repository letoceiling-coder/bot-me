import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CryptoService } from "../common/crypto.service";
import { NeekloSettingsDto, YukassaSettingsDto } from "./tariffs-admin.dto";

const KEYS = {
  yukassaShopId: "yukassa.shop_id",
  yukassaSecret: "yukassa.secret_key",
  yukassaSandbox: "yukassa.sandbox",
  neekloApiKey: "neeklo.api_key",
  neekloBaseUrl: "neeklo.base_url",
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
