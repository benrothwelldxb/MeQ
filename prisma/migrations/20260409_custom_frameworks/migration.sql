-- Framework tables
CREATE TABLE "Framework" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "config" TEXT NOT NULL DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Framework_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Framework_slug_key" ON "Framework"("slug");

CREATE TABLE "FrameworkDomain" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FrameworkDomain_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FrameworkDomain_frameworkId_key_key" ON "FrameworkDomain"("frameworkId", "key");

ALTER TABLE "FrameworkDomain" ADD CONSTRAINT "FrameworkDomain_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "FrameworkQuestion" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "domainKey" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "orderIndex" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'core',
    "questionFormat" TEXT NOT NULL DEFAULT 'self-report',
    "answerOptions" TEXT NOT NULL,
    "scoreMap" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isValidation" BOOLEAN NOT NULL DEFAULT false,
    "isTrap" BOOLEAN NOT NULL DEFAULT false,
    "validationPair" INTEGER,
    "audioUrl" TEXT,
    "symbolImageUrl" TEXT,
    CONSTRAINT "FrameworkQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FrameworkQuestion_frameworkId_tier_orderIndex_key" ON "FrameworkQuestion"("frameworkId", "tier", "orderIndex");

ALTER TABLE "FrameworkQuestion" ADD CONSTRAINT "FrameworkQuestion_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- School framework link
ALTER TABLE "School" ADD COLUMN "frameworkId" TEXT;
ALTER TABLE "School" ADD CONSTRAINT "School_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Assessment framework fields
ALTER TABLE "Assessment" ADD COLUMN "domainScoresJson" TEXT;
ALTER TABLE "Assessment" ADD COLUMN "domainLevelsJson" TEXT;
ALTER TABLE "Assessment" ADD COLUMN "frameworkId" TEXT;

-- TeacherAssessment framework fields
ALTER TABLE "TeacherAssessment" ADD COLUMN "domainScoresJson" TEXT;
ALTER TABLE "TeacherAssessment" ADD COLUMN "domainLevelsJson" TEXT;
ALTER TABLE "TeacherAssessment" ADD COLUMN "frameworkId" TEXT;
