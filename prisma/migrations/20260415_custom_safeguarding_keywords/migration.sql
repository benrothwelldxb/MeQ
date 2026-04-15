-- Per-school custom safeguarding keywords. Supplement the platform-level
-- MODERATION_KEYWORDS list with phrases a school wants to monitor for
-- their specific context.
CREATE TABLE "SchoolSafeguardingKeyword" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedByAdminId" TEXT,
    CONSTRAINT "SchoolSafeguardingKeyword_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SchoolSafeguardingKeyword_schoolId_keyword_key"
  ON "SchoolSafeguardingKeyword"("schoolId", "keyword");
CREATE INDEX "SchoolSafeguardingKeyword_schoolId_idx"
  ON "SchoolSafeguardingKeyword"("schoolId");
