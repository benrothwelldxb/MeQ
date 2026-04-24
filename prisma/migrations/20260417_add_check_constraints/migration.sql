-- Add CHECK constraints to string-union fields to prevent invalid data
-- at the database level. Using CHECK rather than Postgres enums so
-- Prisma 5 stays compatible and adding new values is a single ALTER.

-- Assessment.status
ALTER TABLE "Assessment"
  ADD CONSTRAINT "Assessment_status_check"
  CHECK ("status" IN ('in_progress', 'completed'));

-- Survey.status
ALTER TABLE "Survey"
  ADD CONSTRAINT "Survey_status_check"
  CHECK ("status" IN ('draft', 'active', 'closed'));

-- Survey.targetType
ALTER TABLE "Survey"
  ADD CONSTRAINT "Survey_targetType_check"
  CHECK ("targetType" IN ('school', 'year_group', 'class'));

-- Intervention.tier
ALTER TABLE "Intervention"
  ADD CONSTRAINT "Intervention_tier_check"
  CHECK ("tier" IN ('standard', 'junior', 'staff'));

-- Intervention.audience
ALTER TABLE "Intervention"
  ADD CONSTRAINT "Intervention_audience_check"
  CHECK ("audience" IN ('student', 'teacher'));

-- Intervention.level
ALTER TABLE "Intervention"
  ADD CONSTRAINT "Intervention_level_check"
  CHECK ("level" IN ('Emerging', 'Developing', 'Secure', 'Advanced'));

-- StaffIntervention.level
ALTER TABLE "StaffIntervention"
  ADD CONSTRAINT "StaffIntervention_level_check"
  CHECK ("level" IN ('Emerging', 'Developing', 'Secure', 'Advanced'));

-- StaffAssessment.status
ALTER TABLE "StaffAssessment"
  ADD CONSTRAINT "StaffAssessment_status_check"
  CHECK ("status" IN ('in_progress', 'completed'));

-- TeacherAssessment.status
ALTER TABLE "TeacherAssessment"
  ADD CONSTRAINT "TeacherAssessment_status_check"
  CHECK ("status" IN ('in_progress', 'completed'));

-- SafeguardingAlert.status
ALTER TABLE "SafeguardingAlert"
  ADD CONSTRAINT "SafeguardingAlert_status_check"
  CHECK ("status" IN ('open', 'resolved', 'dismissed'));

-- SafeguardingAlert.type
ALTER TABLE "SafeguardingAlert"
  ADD CONSTRAINT "SafeguardingAlert_type_check"
  CHECK ("type" IN ('pulse', 'survey'));

-- School.authMode
ALTER TABLE "School"
  ADD CONSTRAINT "School_authMode_check"
  CHECK ("authMode" IN ('password', 'sso', 'both'));

-- School.inspectorate
ALTER TABLE "School"
  ADD CONSTRAINT "School_inspectorate_check"
  CHECK ("inspectorate" IN ('ofsted', 'khda', 'adek', 'estyn', 'generic'));

-- YearGroup.tier
ALTER TABLE "YearGroup"
  ADD CONSTRAINT "YearGroup_tier_check"
  CHECK ("tier" IN ('standard', 'junior'));

-- Student.tier
ALTER TABLE "Student"
  ADD CONSTRAINT "Student_tier_check"
  CHECK ("tier" IN ('standard', 'junior'));

-- FrameworkQuestion.type
ALTER TABLE "FrameworkQuestion"
  ADD CONSTRAINT "FrameworkQuestion_type_check"
  CHECK ("type" IN ('core', 'validation', 'trap'));
