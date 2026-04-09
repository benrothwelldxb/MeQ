-- FrameworkScoringModel
CREATE TABLE "FrameworkScoringModel" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "thresholds" TEXT NOT NULL,
    "overallThresholds" TEXT NOT NULL,
    "maxDomainScore" DOUBLE PRECISION NOT NULL,
    "maxTotalScore" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "FrameworkScoringModel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FrameworkScoringModel_frameworkId_key_key" ON "FrameworkScoringModel"("frameworkId", "key");
ALTER TABLE "FrameworkScoringModel" ADD CONSTRAINT "FrameworkScoringModel_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FrameworkDomainMessage
CREATE TABLE "FrameworkDomainMessage" (
    "id" TEXT NOT NULL,
    "frameworkDomainId" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FrameworkDomainMessage_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FrameworkDomainMessage" ADD CONSTRAINT "FrameworkDomainMessage_frameworkDomainId_fkey" FOREIGN KEY ("frameworkDomainId") REFERENCES "FrameworkDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AssessmentDomainScore
CREATE TABLE "AssessmentDomainScore" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "domainKey" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "level" TEXT NOT NULL,
    CONSTRAINT "AssessmentDomainScore_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssessmentDomainScore_assessmentId_domainKey_key" ON "AssessmentDomainScore"("assessmentId", "domainKey");
ALTER TABLE "AssessmentDomainScore" ADD CONSTRAINT "AssessmentDomainScore_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TeacherAssessmentDomainScore
CREATE TABLE "TeacherAssessmentDomainScore" (
    "id" TEXT NOT NULL,
    "teacherAssessmentId" TEXT NOT NULL,
    "domainKey" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "level" TEXT NOT NULL,
    CONSTRAINT "TeacherAssessmentDomainScore_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeacherAssessmentDomainScore_teacherAssessmentId_domainKey_key" ON "TeacherAssessmentDomainScore"("teacherAssessmentId", "domainKey");
ALTER TABLE "TeacherAssessmentDomainScore" ADD CONSTRAINT "TeacherAssessmentDomainScore_teacherAssessmentId_fkey" FOREIGN KEY ("teacherAssessmentId") REFERENCES "TeacherAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
