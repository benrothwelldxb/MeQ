-- Actionable safeguarding alerts: one row per flagged pulse or survey
-- response. Admins can review, dismiss, or mark resolved in the admin UI.
CREATE TABLE "SafeguardingAlert" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "studentId" TEXT,
    "pulseCheckId" TEXT,
    "surveyResponseId" TEXT,
    "flagReason" TEXT NOT NULL,
    "flaggedText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SafeguardingAlert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SafeguardingAlert_schoolId_status_createdAt_idx"
  ON "SafeguardingAlert"("schoolId", "status", "createdAt");
