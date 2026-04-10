ALTER TABLE "Framework" ADD COLUMN "assessmentFrequency" TEXT NOT NULL DEFAULT 'termly';
ALTER TABLE "Framework" ADD COLUMN "activeTerms" TEXT NOT NULL DEFAULT '["term1","term2","term3"]';
