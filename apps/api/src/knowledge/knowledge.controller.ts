import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/auth.decorators";
import { KnowledgeService } from "./knowledge.service";
import { CreateKnowledgeBaseDto, PasteTextDocumentDto } from "./knowledge.dto";

@Controller("knowledge")
@UseGuards(JwtAuthGuard)
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get("bases")
  listBases(@CurrentUser() user: { organizationId: string }) {
    return this.knowledge.listBases(user.organizationId);
  }

  @Post("bases")
  createBase(
    @CurrentUser() user: { organizationId: string },
    @Body() body: CreateKnowledgeBaseDto,
  ) {
    return this.knowledge.createBase(
      user.organizationId,
      body.name,
      body.description,
    );
  }

  @Get("bases/:baseId/documents")
  listDocuments(
    @CurrentUser() user: { organizationId: string },
    @Param("baseId") baseId: string,
  ) {
    return this.knowledge.listDocuments(user.organizationId, baseId);
  }

  @Post("bases/:baseId/documents/text")
  pasteText(
    @CurrentUser() user: { organizationId: string },
    @Param("baseId") baseId: string,
    @Body() body: PasteTextDocumentDto,
  ) {
    return this.knowledge.pasteText(
      user.organizationId,
      baseId,
      body.title,
      body.content,
    );
  }

  @Post("bases/:baseId/documents/upload")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  upload(
    @CurrentUser() user: { organizationId: string },
    @Param("baseId") baseId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body("title") title?: string,
  ) {
    if (!file) {
      throw new BadRequestException("Файл не передан");
    }
    return this.knowledge.uploadFile(user.organizationId, baseId, file, title);
  }

  @Delete("documents/:documentId")
  removeDocument(
    @CurrentUser() user: { organizationId: string },
    @Param("documentId") documentId: string,
  ) {
    return this.knowledge.deleteDocument(user.organizationId, documentId);
  }
}
