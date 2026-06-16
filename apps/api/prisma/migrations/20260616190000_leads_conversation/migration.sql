-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "conversationId" TEXT;

-- CreateIndex
CREATE INDEX "Lead_conversationId_idx" ON "Lead"("conversationId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
