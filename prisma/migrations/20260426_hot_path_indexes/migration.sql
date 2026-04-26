-- Composite indexes on hot paths flagged by the database performance review.
-- All are pure additions; no data migration. Runs in a transaction (Prisma
-- default) — at current school data sizes this completes in well under a
-- second per index, brief write lock acceptable. If a table grows past ~1M
-- rows, switch the relevant CREATE INDEX to a separate file marked
-- `migration_name.no-transaction.sql` so we can use CONCURRENTLY.

CREATE INDEX IF NOT EXISTS "Assessment_studentId_status_idx"
  ON "Assessment"("studentId", "status");

CREATE INDEX IF NOT EXISTS "Assessment_status_academicYear_idx"
  ON "Assessment"("status", "academicYear");

CREATE INDEX IF NOT EXISTS "TeacherAssessment_teacherId_term_academicYear_idx"
  ON "TeacherAssessment"("teacherId", "term", "academicYear");

CREATE INDEX IF NOT EXISTS "TeacherAssessment_studentId_status_idx"
  ON "TeacherAssessment"("studentId", "status");

CREATE INDEX IF NOT EXISTS "PulseCheck_weekOf_completedAt_idx"
  ON "PulseCheck"("weekOf", "completedAt");

CREATE INDEX IF NOT EXISTS "PulseCheck_studentId_completedAt_idx"
  ON "PulseCheck"("studentId", "completedAt");

CREATE INDEX IF NOT EXISTS "Survey_schoolId_status_idx"
  ON "Survey"("schoolId", "status");

CREATE INDEX IF NOT EXISTS "Survey_schoolId_openAt_closeAt_idx"
  ON "Survey"("schoolId", "openAt", "closeAt");
