-- Student tags: MAGT (More Able, Gifted & Talented) and EAL (English as an Additional Language).
-- Kept as booleans for fast filtering alongside existing `sen`.
ALTER TABLE "Student" ADD COLUMN "magt" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Student" ADD COLUMN "eal" BOOLEAN NOT NULL DEFAULT false;

-- Smart Groups: cross-class cohorts (nurture, social skills, MAGT monitoring).
CREATE TABLE "SmartGroup" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "schoolId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "purpose" TEXT,
  "createdByType" TEXT NOT NULL,
  "createdByTeacherId" TEXT,
  "createdByAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SmartGroup_createdByType_check" CHECK ("createdByType" IN ('admin', 'teacher')),
  CONSTRAINT "SmartGroup_createdByTeacherId_fkey" FOREIGN KEY ("createdByTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "SmartGroup_schoolId_idx" ON "SmartGroup"("schoolId");

CREATE TABLE "SmartGroupStudent" (
  "smartGroupId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("smartGroupId", "studentId"),
  CONSTRAINT "SmartGroupStudent_smartGroupId_fkey" FOREIGN KEY ("smartGroupId") REFERENCES "SmartGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SmartGroupStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SmartGroupStudent_studentId_idx" ON "SmartGroupStudent"("studentId");

CREATE TABLE "SmartGroupTeacher" (
  "smartGroupId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("smartGroupId", "teacherId"),
  CONSTRAINT "SmartGroupTeacher_smartGroupId_fkey" FOREIGN KEY ("smartGroupId") REFERENCES "SmartGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SmartGroupTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SmartGroupTeacher_teacherId_idx" ON "SmartGroupTeacher"("teacherId");
