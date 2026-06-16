-- CreateTable
CREATE TABLE "OrgUsagePeriod" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "llmCalls" INTEGER NOT NULL DEFAULT 0,
    "usageWarningSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgUsagePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDedup" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDedup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgUsagePeriod_organizationId_period_key" ON "OrgUsagePeriod"("organizationId", "period");

-- CreateIndex
CREATE INDEX "OrgUsagePeriod_organizationId_idx" ON "OrgUsagePeriod"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookDedup_source_dedupeKey_key" ON "WebhookDedup"("source", "dedupeKey");

-- CreateIndex
CREATE INDEX "WebhookDedup_organizationId_idx" ON "WebhookDedup"("organizationId");
