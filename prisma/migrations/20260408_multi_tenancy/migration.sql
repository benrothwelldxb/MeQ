-- ============ SUPER ADMIN ============
CREATE TABLE "SuperAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SuperAdmin_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SuperAdmin_email_key" ON "SuperAdmin"("email");

-- ============ SCHOOL: add slug, isActive ============
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
-- Backfill slug from id for existing rows
UPDATE "School" SET "slug" = "id" WHERE "slug" IS NULL;
ALTER TABLE "School" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "School_slug_key" ON "School"("slug");

-- ============ ADMIN: switch to email, add schoolId ============
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
-- Backfill email from username for existing rows
UPDATE "Admin" SET "email" = "username" || '@school.local' WHERE "email" IS NULL;
ALTER TABLE "Admin" ALTER COLUMN "email" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Admin_email_key" ON "Admin"("email");
-- Drop old username unique constraint if exists
DROP INDEX IF EXISTS "Admin_username_key";
ALTER TABLE "Admin" DROP COLUMN IF EXISTS "username";

-- ============ TEACHER: add schoolId ============
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;

-- ============ YEAR GROUP: add schoolId, update unique ============
ALTER TABLE "YearGroup" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
DROP INDEX IF EXISTS "YearGroup_name_key";
-- Will create compound unique after backfill

-- ============ CLASS GROUP: add schoolId ============
ALTER TABLE "ClassGroup" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;

-- ============ STUDENT: add schoolId ============
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;

-- ============ INTERVENTION: add schoolId ============
-- Already has schoolId concept, just ensure column exists
ALTER TABLE "Intervention" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;

-- ============ BACKFILL: link everything to first school ============
-- For existing data, link to the first school
DO $$
DECLARE first_school_id TEXT;
BEGIN
  SELECT "id" INTO first_school_id FROM "School" LIMIT 1;
  IF first_school_id IS NOT NULL THEN
    UPDATE "Admin" SET "schoolId" = first_school_id WHERE "schoolId" IS NULL;
    UPDATE "Teacher" SET "schoolId" = first_school_id WHERE "schoolId" IS NULL;
    UPDATE "YearGroup" SET "schoolId" = first_school_id WHERE "schoolId" IS NULL;
    UPDATE "ClassGroup" SET "schoolId" = first_school_id WHERE "schoolId" IS NULL;
    UPDATE "Student" SET "schoolId" = first_school_id WHERE "schoolId" IS NULL;
  END IF;
END $$;

-- ============ SET NOT NULL after backfill ============
-- Only set NOT NULL if there are rows (avoid issues on fresh DB)
ALTER TABLE "Admin" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Teacher" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "YearGroup" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "ClassGroup" ALTER COLUMN "schoolId" SET NOT NULL;
ALTER TABLE "Student" ALTER COLUMN "schoolId" SET NOT NULL;

-- ============ FOREIGN KEYS ============
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "YearGroup" ADD CONSTRAINT "YearGroup_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassGroup" ADD CONSTRAINT "ClassGroup_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============ COMPOUND UNIQUE for YearGroup ============
CREATE UNIQUE INDEX "YearGroup_schoolId_name_key" ON "YearGroup"("schoolId", "name");
