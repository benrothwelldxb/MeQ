-- Per-student intervention application log.
-- Records when a teacher / admin applied a strategy to a student.
-- Snapshots title/level/domain so reports stay stable even if the
-- underlying intervention is edited or deleted.
CREATE TABLE "InterventionLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT,
    "adminId" TEXT,
    "schoolId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'intervention',
    "interventionId" TEXT,
    "domainKey" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterventionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InterventionLog_studentId_appliedAt_idx"
  ON "InterventionLog"("studentId", "appliedAt");
CREATE INDEX "InterventionLog_schoolId_appliedAt_idx"
  ON "InterventionLog"("schoolId", "appliedAt");
