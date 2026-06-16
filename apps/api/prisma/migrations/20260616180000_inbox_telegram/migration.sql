-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "peerName" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Conversation_organizationId_lastMessageAt_idx" ON "Conversation"("organizationId", "lastMessageAt");

-- CreateIndex (unique for telegram chat per org)
CREATE UNIQUE INDEX "Conversation_organizationId_channel_externalId_key" ON "Conversation"("organizationId", "channel", "externalId");
