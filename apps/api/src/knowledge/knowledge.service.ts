import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import type {
  KnowledgeBaseDto,
  KnowledgeDocumentDto,
} from "@botme/shared";
import { PrismaService } from "../prisma/prisma.service";
import { S3StorageService } from "./s3-storage.service";
import { chunkText, scoreChunk } from "./text-chunk.util";

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3StorageService,
  ) {}

  async listBases(organizationId: string): Promise<KnowledgeBaseDto[]> {
    const rows = await this.prisma.knowledgeBase.findMany({
      where: { organizationId },
      include: { _count: { select: { documents: true } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      documentCount: r._count.documents,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createBase(
    organizationId: string,
    name: string,
    description?: string,
  ): Promise<KnowledgeBaseDto> {
    const row = await this.prisma.knowledgeBase.create({
      data: { organizationId, name, description: description ?? null },
      include: { _count: { select: { documents: true } } },
    });
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      documentCount: row._count.documents,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listDocuments(
    organizationId: string,
    baseId: string,
  ): Promise<KnowledgeDocumentDto[]> {
    await this.assertBase(organizationId, baseId);
    const rows = await this.prisma.knowledgeDocument.findMany({
      where: { knowledgeBaseId: baseId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((d) => this.toDocDto(d));
  }

  async pasteText(
    organizationId: string,
    baseId: string,
    title: string,
    content: string,
  ) {
    await this.assertBase(organizationId, baseId);
    await this.assertDocumentLimit(organizationId);

    const doc = await this.prisma.knowledgeDocument.create({
      data: {
        knowledgeBaseId: baseId,
        title,
        sourceType: "text",
        status: "processing",
      },
    });

    try {
      await this.indexDocument(doc.id, content);
      const updated = await this.prisma.knowledgeDocument.findUniqueOrThrow({
        where: { id: doc.id },
      });
      return this.toDocDto(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка индексации";
      const failed = await this.prisma.knowledgeDocument.update({
        where: { id: doc.id },
        data: { status: "failed", errorMessage: message },
      });
      return this.toDocDto(failed);
    }
  }

  async uploadFile(
    organizationId: string,
    baseId: string,
    file: Express.Multer.File,
    title?: string,
  ) {
    await this.assertBase(organizationId, baseId);
    await this.assertDocumentLimit(organizationId);

    const mime = file.mimetype || "application/octet-stream";
    const isText =
      mime.startsWith("text/") ||
      file.originalname.toLowerCase().endsWith(".txt") ||
      mime === "application/octet-stream";

    if (!isText) {
      throw new BadRequestException(
        "Пока поддерживаются только текстовые файлы (.txt). PDF и DOCX — в следующем обновлении.",
      );
    }

    const maxBytes = await this.maxUploadBytes(organizationId);
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `Файл слишком большой. Лимит: ${Math.round(maxBytes / 1024 / 1024)} МБ`,
      );
    }

    const doc = await this.prisma.knowledgeDocument.create({
      data: {
        knowledgeBaseId: baseId,
        title: title || file.originalname,
        sourceType: "upload",
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: mime,
        status: "processing",
      },
    });

    try {
      const s3Key = `org/${organizationId}/kb/${baseId}/${doc.id}-${file.originalname}`;
      await this.s3.uploadObject(s3Key, file.buffer, mime);
      const text = file.buffer.toString("utf-8");
      await this.prisma.knowledgeDocument.update({
        where: { id: doc.id },
        data: { s3Key },
      });
      await this.indexDocument(doc.id, text);
      const updated = await this.prisma.knowledgeDocument.findUniqueOrThrow({
        where: { id: doc.id },
      });
      return this.toDocDto(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка загрузки";
      const failed = await this.prisma.knowledgeDocument.update({
        where: { id: doc.id },
        data: { status: "failed", errorMessage: message },
      });
      return this.toDocDto(failed);
    }
  }

  async deleteDocument(organizationId: string, documentId: string) {
    const doc = await this.prisma.knowledgeDocument.findFirst({
      where: { id: documentId, knowledgeBase: { organizationId } },
    });
    if (!doc) throw new NotFoundException("Документ не найден");
    await this.prisma.knowledgeDocument.delete({ where: { id: documentId } });
    return { ok: true };
  }

  async search(
    organizationId: string,
    knowledgeBaseId: string | null | undefined,
    query: string,
    limit = 5,
  ) {
    const baseFilter = knowledgeBaseId
      ? { knowledgeBaseId, knowledgeBase: { organizationId } }
      : { knowledgeBase: { organizationId } };

    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: {
        document: {
          ...baseFilter,
          status: "ready",
        },
      },
      include: { document: true },
      take: 500,
    });

    return chunks
      .map((c) => ({
        documentTitle: c.document.title,
        content: c.content,
        score: scoreChunk(c.content, query),
      }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((c) => ({
        documentTitle: c.documentTitle,
        excerpt: c.content.slice(0, 400),
        content: c.content,
      }));
  }

  private async indexDocument(documentId: string, text: string) {
    const pieces = chunkText(text);
    if (!pieces.length) {
      throw new BadRequestException("Текст пустой или не удалось разбить на фрагменты");
    }

    await this.prisma.knowledgeChunk.deleteMany({ where: { documentId } });
    await this.prisma.knowledgeChunk.createMany({
      data: pieces.map((content, chunkIndex) => ({
        id: randomUUID(),
        documentId,
        chunkIndex,
        content,
      })),
    });

    await this.prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        status: "ready",
        chunkCount: pieces.length,
        errorMessage: null,
      },
    });
  }

  private async assertBase(organizationId: string, baseId: string) {
    const base = await this.prisma.knowledgeBase.findFirst({
      where: { id: baseId, organizationId },
    });
    if (!base) throw new NotFoundException("База знаний не найдена");
    return base;
  }

  private async assertDocumentLimit(organizationId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    const tariff = await this.prisma.tariffPlan.findUnique({
      where: { slug: org.plan },
    });
    const limits = (tariff?.limits ?? {}) as { documents?: number };
    const maxDocs = limits.documents ?? 50;
    const count = await this.prisma.knowledgeDocument.count({
      where: { knowledgeBase: { organizationId } },
    });
    if (count >= maxDocs) {
      throw new BadRequestException(
        `Лимит тарифа: максимум ${maxDocs} документов`,
      );
    }
  }

  private async maxUploadBytes(organizationId: string) {
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
    });
    const tariff = await this.prisma.tariffPlan.findUnique({
      where: { slug: org.plan },
    });
    const limits = (tariff?.limits ?? {}) as { kbGb?: number };
    const gb = limits.kbGb ?? 1;
    return Math.max(gb, 1) * 1024 * 1024;
  }

  private toDocDto(d: {
    id: string;
    knowledgeBaseId: string;
    title: string;
    sourceType: string;
    status: string;
    chunkCount: number;
    fileName: string | null;
    fileSize: number | null;
    errorMessage: string | null;
    createdAt: Date;
  }): KnowledgeDocumentDto {
    return {
      id: d.id,
      knowledgeBaseId: d.knowledgeBaseId,
      title: d.title,
      sourceType: d.sourceType,
      status: d.status,
      chunkCount: d.chunkCount,
      fileName: d.fileName,
      fileSize: d.fileSize,
      errorMessage: d.errorMessage,
      createdAt: d.createdAt.toISOString(),
    };
  }
}
