-- Add tier to Student
ALTER TABLE "Student" ADD COLUMN "tier" TEXT NOT NULL DEFAULT 'standard';

-- Add tier to Question
ALTER TABLE "Question" ADD COLUMN "tier" TEXT NOT NULL DEFAULT 'standard';

-- Add tier to Assessment
ALTER TABLE "Assessment" ADD COLUMN "tier" TEXT NOT NULL DEFAULT 'standard';

-- Drop the old unique index on orderIndex alone
DROP INDEX "Question_orderIndex_key";

-- Create compound unique index on (tier, orderIndex)
CREATE UNIQUE INDEX "Question_tier_orderIndex_key" ON "Question"("tier", "orderIndex");
