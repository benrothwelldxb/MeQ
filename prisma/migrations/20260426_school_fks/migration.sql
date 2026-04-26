-- Adds missing foreign-key constraints from new tables to School. Without
-- these, deleting a school left orphan rows in CheckInRequest, SmartGroup,
-- and SurveyBankQuestion. Cascade matches the established pattern on the
-- other school-scoped tables (Student, Teacher, etc.).
--
-- Defensive cleanup before adding the constraint: any orphan rows whose
-- schoolId no longer matches a real School would block the FK install. We
-- delete them first so the migration is idempotent.

DELETE FROM "CheckInRequest"
  WHERE "schoolId" NOT IN (SELECT "id" FROM "School");

DELETE FROM "SmartGroup"
  WHERE "schoolId" NOT IN (SELECT "id" FROM "School");

DELETE FROM "SurveyBankQuestion"
  WHERE "schoolId" IS NOT NULL
    AND "schoolId" NOT IN (SELECT "id" FROM "School");

ALTER TABLE "CheckInRequest"
  ADD CONSTRAINT "CheckInRequest_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SmartGroup"
  ADD CONSTRAINT "SmartGroup_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SurveyBankQuestion"
  ADD CONSTRAINT "SurveyBankQuestion_schoolId_fkey"
  FOREIGN KEY ("schoolId") REFERENCES "School"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Helpful index for the new student-scoped check-in lookup (rate-limit
-- query in createCheckInRequest counts per-student over a window).
CREATE INDEX IF NOT EXISTS "CheckInRequest_studentId_createdAt_idx"
  ON "CheckInRequest"("studentId", "createdAt");
