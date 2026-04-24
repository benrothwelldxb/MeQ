-- Drop legacy per-domain columns from Assessment and TeacherAssessment.
-- domainScoresJson + domainLevelsJson + AssessmentDomainScore table are
-- the source of truth. These columns are no longer written or read.

ALTER TABLE "Assessment"
  DROP COLUMN IF EXISTS "knowMeScore",
  DROP COLUMN IF EXISTS "manageMeScore",
  DROP COLUMN IF EXISTS "understandOthersScore",
  DROP COLUMN IF EXISTS "workWithOthersScore",
  DROP COLUMN IF EXISTS "chooseWellScore",
  DROP COLUMN IF EXISTS "knowMeLevel",
  DROP COLUMN IF EXISTS "manageMeLevel",
  DROP COLUMN IF EXISTS "understandOthersLevel",
  DROP COLUMN IF EXISTS "workWithOthersLevel",
  DROP COLUMN IF EXISTS "chooseWellLevel";

ALTER TABLE "TeacherAssessment"
  DROP COLUMN IF EXISTS "knowMeScore",
  DROP COLUMN IF EXISTS "manageMeScore",
  DROP COLUMN IF EXISTS "understandOthersScore",
  DROP COLUMN IF EXISTS "workWithOthersScore",
  DROP COLUMN IF EXISTS "chooseWellScore",
  DROP COLUMN IF EXISTS "knowMeLevel",
  DROP COLUMN IF EXISTS "manageMeLevel",
  DROP COLUMN IF EXISTS "understandOthersLevel",
  DROP COLUMN IF EXISTS "workWithOthersLevel",
  DROP COLUMN IF EXISTS "chooseWellLevel";
