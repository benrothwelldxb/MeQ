-- Reduced-question mode is now set per tier. Schools commonly want the full
-- assessment for older (standard) students but a shorter version for juniors
-- who fatigue faster. Previously a single boolean applied to both.
--
-- Rollout: add the new columns, copy the existing value into both so current
-- school behaviour is preserved, then drop the old column.

ALTER TABLE "School" ADD COLUMN "reducedJunior" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "School" ADD COLUMN "reducedStandard" BOOLEAN NOT NULL DEFAULT false;

UPDATE "School"
  SET "reducedJunior" = "reducedQuestions",
      "reducedStandard" = "reducedQuestions";

ALTER TABLE "School" DROP COLUMN "reducedQuestions";
