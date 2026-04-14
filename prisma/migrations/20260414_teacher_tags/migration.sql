-- Role tags for teachers (e.g. Class Teacher, Inclusion, Specialist, Assistant, PLT)
-- Stored as a JSON array of strings; multiple tags allowed per teacher.
ALTER TABLE "Teacher" ADD COLUMN "tags" TEXT NOT NULL DEFAULT '[]';
