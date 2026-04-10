-- FrameworkAssignment: explicit per-school assignment for private frameworks
-- A framework with no assignments is "public" (available to all schools)
-- A framework with 1+ assignments is "private" (only available to those schools)
CREATE TABLE "FrameworkAssignment" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FrameworkAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FrameworkAssignment_frameworkId_schoolId_key" ON "FrameworkAssignment"("frameworkId", "schoolId");

ALTER TABLE "FrameworkAssignment" ADD CONSTRAINT "FrameworkAssignment_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FrameworkAssignment" ADD CONSTRAINT "FrameworkAssignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
