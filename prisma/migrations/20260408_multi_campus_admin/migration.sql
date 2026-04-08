-- DropIndex
DROP INDEX IF EXISTS "Admin_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_schoolId_key" ON "Admin"("email", "schoolId");
