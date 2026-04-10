-- Drop old unique constraint, add framework support
DROP INDEX IF EXISTS "PulseQuestion_tier_domain_key";

ALTER TABLE "PulseQuestion" ADD COLUMN "frameworkId" TEXT;
ALTER TABLE "PulseQuestion" ADD CONSTRAINT "PulseQuestion_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "PulseQuestion_frameworkId_tier_domain_key" ON "PulseQuestion"("frameworkId", "tier", "domain");

-- Add free text to pulse check
ALTER TABLE "PulseCheck" ADD COLUMN "freeText" TEXT;
