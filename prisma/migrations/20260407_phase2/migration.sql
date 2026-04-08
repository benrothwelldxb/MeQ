-- ============ NEW TABLES ============

-- School settings
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My School',
    "currentTerm" TEXT NOT NULL DEFAULT 'term1',
    "academicYear" TEXT NOT NULL DEFAULT '2025-2026',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- Year groups
CREATE TABLE "YearGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "YearGroup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "YearGroup_name_key" ON "YearGroup"("name");

-- Class groups
CREATE TABLE "ClassGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "yearGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassGroup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ClassGroup_yearGroupId_name_key" ON "ClassGroup"("yearGroupId", "name");
ALTER TABLE "ClassGroup" ADD CONSTRAINT "ClassGroup_yearGroupId_fkey"
    FOREIGN KEY ("yearGroupId") REFERENCES "YearGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Teachers
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Teacher_email_key" ON "Teacher"("email");

-- Teacher-ClassGroup many-to-many
CREATE TABLE "_ClassGroupToTeacher" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ClassGroupToTeacher_AB_pkey" PRIMARY KEY ("A", "B")
);
CREATE INDEX "_ClassGroupToTeacher_B_index" ON "_ClassGroupToTeacher"("B");
ALTER TABLE "_ClassGroupToTeacher" ADD CONSTRAINT "_ClassGroupToTeacher_A_fkey"
    FOREIGN KEY ("A") REFERENCES "ClassGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ClassGroupToTeacher" ADD CONSTRAINT "_ClassGroupToTeacher_B_fkey"
    FOREIGN KEY ("B") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Teacher questions
CREATE TABLE "TeacherQuestion" (
    "id" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "answerOptions" TEXT NOT NULL,
    "scoreMap" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    CONSTRAINT "TeacherQuestion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TeacherQuestion_orderIndex_key" ON "TeacherQuestion"("orderIndex");

-- Teacher assessments
CREATE TABLE "TeacherAssessment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL DEFAULT '2025-2026',
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "answers" TEXT NOT NULL DEFAULT '{}',
    "knowMeScore" DOUBLE PRECISION,
    "manageMeScore" DOUBLE PRECISION,
    "understandOthersScore" DOUBLE PRECISION,
    "workWithOthersScore" DOUBLE PRECISION,
    "chooseWellScore" DOUBLE PRECISION,
    "knowMeLevel" TEXT,
    "manageMeLevel" TEXT,
    "understandOthersLevel" TEXT,
    "workWithOthersLevel" TEXT,
    "chooseWellLevel" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherAssessment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TeacherAssessment_teacherId_studentId_term_academicYear_key"
    ON "TeacherAssessment"("teacherId", "studentId", "term", "academicYear");
ALTER TABLE "TeacherAssessment" ADD CONSTRAINT "TeacherAssessment_teacherId_fkey"
    FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherAssessment" ADD CONSTRAINT "TeacherAssessment_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Interventions
CREATE TABLE "Intervention" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "audience" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
);

-- ============ MODIFY EXISTING TABLES ============

-- Student: add structured FK fields + schoolUuid
ALTER TABLE "Student" ADD COLUMN "yearGroupId" TEXT;
ALTER TABLE "Student" ADD COLUMN "classGroupId" TEXT;
ALTER TABLE "Student" ADD COLUMN "schoolUuid" TEXT;
ALTER TABLE "Student" ADD CONSTRAINT "Student_yearGroupId_fkey"
    FOREIGN KEY ("yearGroupId") REFERENCES "YearGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_classGroupId_fkey"
    FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Assessment: add term + academicYear
ALTER TABLE "Assessment" ADD COLUMN "term" TEXT NOT NULL DEFAULT 'term1';
ALTER TABLE "Assessment" ADD COLUMN "academicYear" TEXT NOT NULL DEFAULT '2025-2026';
CREATE UNIQUE INDEX "Assessment_studentId_term_academicYear_key"
    ON "Assessment"("studentId", "term", "academicYear");
