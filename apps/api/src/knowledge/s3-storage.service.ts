import { Injectable } from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SettingsAdminService } from "../admin/settings-admin.service";

@Injectable()
export class S3StorageService {
  constructor(private readonly settings: SettingsAdminService) {}

  private async client() {
    const cfg = await this.settings.getS3Config();
    if (!cfg.accessKey || !cfg.secretKey || !cfg.bucket) {
      throw new Error("S3 не настроен администратором");
    }
    return {
      client: new S3Client({
        region: cfg.region,
        endpoint: cfg.endpoint,
        credentials: {
          accessKeyId: cfg.accessKey,
          secretAccessKey: cfg.secretKey,
        },
        forcePathStyle: true,
      }),
      bucket: cfg.bucket,
    };
  }

  async uploadObject(key: string, body: Buffer, contentType: string) {
    const { client, bucket } = await this.client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return key;
  }
}
