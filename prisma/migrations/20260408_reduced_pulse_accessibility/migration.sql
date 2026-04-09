-- School settings
ALTER TABLE "School" ADD COLUMN "reducedQuestions" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "School" ADD COLUMN "pulseEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "School" ADD COLUMN "readAloudEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Assessment reduced flag
ALTER TABLE "Assessment" ADD COLUMN "isReduced" BOOLEAN NOT NULL DEFAULT false;

-- Question accessibility fields
ALTER TABLE "Question" ADD COLUMN "audioUrl" TEXT;
ALTER TABLE "Question" ADD COLUMN "symbolImageUrl" TEXT;

-- Pulse Questions
CREATE TABLE "PulseQuestion" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "emoji" TEXT,
    "orderIndex" INTEGER NOT NULL,
    CONSTRAINT "PulseQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PulseQuestion_tier_domain_key" ON "PulseQuestion"("tier", "domain");

-- Pulse Checks
CREATE TABLE "PulseCheck" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PulseCheck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PulseCheck_studentId_weekOf_key" ON "PulseCheck"("studentId", "weekOf");

ALTER TABLE "PulseCheck" ADD CONSTRAINT "PulseCheck_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
