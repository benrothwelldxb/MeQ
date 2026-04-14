-- Track last login timestamp for teachers
ALTER TABLE "Teacher" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
