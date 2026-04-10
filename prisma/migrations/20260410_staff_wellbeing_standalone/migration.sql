-- Repair FrameworkQuestion: drop audience, restore student-only constraint
-- Safe: no existing rows had audience="staff" (the build was broken before any were created)
ALTER TABLE "FrameworkQuestion" DROP COLUMN IF EXISTS "audience";

-- The constraint update never applied cleanly. Ensure we're back to the original.
DROP INDEX IF EXISTS "FrameworkQuestion_frameworkId_tier_audience_orderIndex_key";
DROP INDEX IF EXISTS "FrameworkQuestion_frameworkId_tier_orderIndex_key";
CREATE UNIQUE INDEX "FrameworkQuestion_frameworkId_tier_orderIndex_key" ON "FrameworkQuestion"("frameworkId", "tier", "orderIndex");

-- StaffAssessment: drop frameworkId — staff wellbeing is now system-wide
ALTER TABLE "StaffAssessment" DROP COLUMN IF EXISTS "frameworkId";

-- New StaffDomain table
CREATE TABLE "StaffDomain" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "StaffDomain_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffDomain_key_key" ON "StaffDomain"("key");

-- New StaffQuestion table
CREATE TABLE "StaffQuestion" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'core',
    "questionFormat" TEXT NOT NULL DEFAULT 'self-report',
    "answerOptions" TEXT NOT NULL,
    "scoreMap" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isValidation" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "StaffQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffQuestion_orderIndex_key" ON "StaffQuestion"("orderIndex");

ALTER TABLE "StaffQuestion" ADD CONSTRAINT "StaffQuestion_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "StaffDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- New StaffPulseQuestion table
CREATE TABLE "StaffPulseQuestion" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "emoji" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "StaffPulseQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffPulseQuestion_domainId_key" ON "StaffPulseQuestion"("domainId");

ALTER TABLE "StaffPulseQuestion" ADD CONSTRAINT "StaffPulseQuestion_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "StaffDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- New StaffScoringConfig table (single row)
CREATE TABLE "StaffScoringConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'default',
    "thresholds" TEXT NOT NULL,
    "overallThresholds" TEXT NOT NULL,
    "maxDomainScore" DOUBLE PRECISION NOT NULL,
    "maxTotalScore" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "StaffScoringConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffScoringConfig_key_key" ON "StaffScoringConfig"("key");
