-- School toggle
ALTER TABLE "School" ADD COLUMN "staffWellbeingEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Audience on framework questions
ALTER TABLE "FrameworkQuestion" ADD COLUMN "audience" TEXT NOT NULL DEFAULT 'student';

-- StaffAssessment
CREATE TABLE "StaffAssessment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "frameworkId" TEXT,
    "term" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "answers" TEXT NOT NULL DEFAULT '{}',
    "totalScore" DOUBLE PRECISION,
    "overallLevel" TEXT,
    "domainScoresJson" TEXT,
    "domainLevelsJson" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "StaffAssessment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffAssessment_teacherId_term_academicYear_key" ON "StaffAssessment"("teacherId", "term", "academicYear");

ALTER TABLE "StaffAssessment" ADD CONSTRAINT "StaffAssessment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- StaffPulseCheck
CREATE TABLE "StaffPulseCheck" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "freeText" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffPulseCheck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffPulseCheck_teacherId_weekOf_key" ON "StaffPulseCheck"("teacherId", "weekOf");

ALTER TABLE "StaffPulseCheck" ADD CONSTRAINT "StaffPulseCheck_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
