import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { KnowledgeController } from "./knowledge.controller";
import { KnowledgeService } from "./knowledge.service";
import { S3StorageService } from "./s3-storage.service";

@Module({
  imports: [AdminModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, S3StorageService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
