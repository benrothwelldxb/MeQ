-- Curated bank of pre-written survey questions. Admins pick from this when
-- building a survey instead of writing each prompt from scratch.
-- Platform-seeded rows: schoolId NULL, isDefault TRUE.
-- School-custom rows: schoolId set, isDefault FALSE.

CREATE TABLE "SurveyBankQuestion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "prompt" TEXT NOT NULL,
  "description" TEXT,
  "questionType" TEXT NOT NULL,
  "defaultOptions" TEXT,
  "category" TEXT NOT NULL,
  "subcategory" TEXT,
  "domainKey" TEXT,
  "ageTags" TEXT NOT NULL DEFAULT '["junior","standard"]',
  "source" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT true,
  "schoolId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "SurveyBankQuestion_category_idx" ON "SurveyBankQuestion"("category");
CREATE INDEX "SurveyBankQuestion_schoolId_isDefault_idx" ON "SurveyBankQuestion"("schoolId", "isDefault");
