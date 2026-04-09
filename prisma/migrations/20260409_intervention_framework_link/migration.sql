-- Add frameworkId to Intervention
ALTER TABLE "Intervention" ADD COLUMN "frameworkId" TEXT;
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE SET NULL ON UPDATE CASCADE;
