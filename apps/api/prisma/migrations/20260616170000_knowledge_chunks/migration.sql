-- AlterTable
ALTER TABLE "KnowledgeDocument" ADD COLUMN "fileName" TEXT;
ALTER TABLE "KnowledgeDocument" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "KnowledgeDocument" ADD COLUMN "mimeType" TEXT;
ALTER TABLE "KnowledgeDocument" ADD COLUMN "errorMessage" TEXT;
ALTER TABLE "KnowledgeDocument" ADD COLUMN "chunkCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeChunk_documentId_idx" ON "KnowledgeChunk"("documentId");

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
