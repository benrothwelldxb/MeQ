-- Calendar / scheduling system. Replaces the implicit single-term model with
-- explicit Term ranges, half-term exclusion windows, AssessmentWindow per
-- term (1-3/year), and PulseSchedule that materialises into PulseOccurrence
-- rows so individual dates can be skipped or moved.
--
-- Backfill at the end seeds every existing school with a sensible UK-style
-- default calendar so the app keeps working with no admin intervention.

CREATE TABLE "Term" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "schoolId"     TEXT NOT NULL,
  "academicYear" TEXT NOT NULL,
  "key"          TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "startDate"    DATE NOT NULL,
  "endDate"      DATE NOT NULL,
  "sortOrder"    INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Term_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "Term_schoolId_academicYear_key_key" ON "Term"("schoolId", "academicYear", "key");
CREATE INDEX "Term_schoolId_academicYear_startDate_idx" ON "Term"("schoolId", "academicYear", "startDate");

CREATE TABLE "HalfTermBreak" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "termId"    TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate"   DATE NOT NULL,
  "label"     TEXT,
  CONSTRAINT "HalfTermBreak_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE
);

CREATE INDEX "HalfTermBreak_termId_idx" ON "HalfTermBreak"("termId");

CREATE TABLE "AssessmentWindow" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "schoolId"     TEXT NOT NULL,
  "academicYear" TEXT NOT NULL,
  "termKey"      TEXT NOT NULL,
  "openAt"       TIMESTAMP(3) NOT NULL,
  "closeAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentWindow_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "AssessmentWindow_schoolId_academicYear_termKey_key" ON "AssessmentWindow"("schoolId", "academicYear", "termKey");
CREATE INDEX "AssessmentWindow_schoolId_openAt_closeAt_idx" ON "AssessmentWindow"("schoolId", "openAt", "closeAt");

CREATE TABLE "PulseSchedule" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "schoolId"     TEXT NOT NULL,
  "academicYear" TEXT NOT NULL,
  "cadence"      TEXT NOT NULL,
  "dayOfWeek"    INTEGER NOT NULL DEFAULT 1,
  "startDate"    DATE NOT NULL,
  "endDate"      DATE,
  "active"       BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PulseSchedule_cadence_check" CHECK ("cadence" IN ('weekly', 'biweekly', 'monthly', 'custom')),
  CONSTRAINT "PulseSchedule_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "PulseSchedule_schoolId_academicYear_key" ON "PulseSchedule"("schoolId", "academicYear");
CREATE INDEX "PulseSchedule_schoolId_active_idx" ON "PulseSchedule"("schoolId", "active");

CREATE TABLE "PulseOccurrence" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "scheduleId" TEXT NOT NULL,
  "date"       DATE NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'scheduled',
  "skipReason" TEXT,
  CONSTRAINT "PulseOccurrence_status_check" CHECK ("status" IN ('scheduled', 'skipped', 'ad_hoc')),
  CONSTRAINT "PulseOccurrence_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "PulseSchedule"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "PulseOccurrence_scheduleId_date_key" ON "PulseOccurrence"("scheduleId", "date");
CREATE INDEX "PulseOccurrence_date_status_idx" ON "PulseOccurrence"("date", "status");

-- =====================================================================
-- BACKFILL: give every existing school a default UK-style calendar so the
-- app continues to work without admin intervention.
-- =====================================================================
-- We use the school's existing academicYear (defaults to "2025-2026") and
-- generate three terms following typical UK term dates. Half-terms inserted
-- at the standard mid-points. Assessment windows are created only for the
-- terms listed in the school's framework.activeTerms (defaults to all 3),
-- spanning the first 4 weeks of each term. A weekly Monday pulse schedule
-- is created if school.pulseEnabled is true.

DO $$
DECLARE
  s RECORD;
  fw_active_terms JSON;
  is_term1_active BOOLEAN;
  is_term2_active BOOLEAN;
  is_term3_active BOOLEAN;
  ay TEXT;
  yr_start INT;
  term1_id TEXT; term2_id TEXT; term3_id TEXT;
  schedule_id TEXT;
BEGIN
  FOR s IN SELECT "id", "academicYear", "pulseEnabled", "frameworkId" FROM "School" LOOP
    ay := COALESCE(s."academicYear", '2025-2026');
    -- Parse the start year from "2025-2026" → 2025.
    yr_start := CAST(SPLIT_PART(ay, '-', 1) AS INT);

    -- Term 1: Autumn (Sep–Dec)
    term1_id := gen_random_uuid()::text;
    INSERT INTO "Term" ("id", "schoolId", "academicYear", "key", "name", "startDate", "endDate", "sortOrder")
    VALUES (
      term1_id, s."id", ay, 'term1', 'Autumn',
      MAKE_DATE(yr_start, 9, 1),
      MAKE_DATE(yr_start, 12, 19),
      1
    );
    INSERT INTO "HalfTermBreak" ("id", "termId", "startDate", "endDate", "label")
    VALUES (
      gen_random_uuid()::text, term1_id,
      MAKE_DATE(yr_start, 10, 21),
      MAKE_DATE(yr_start, 10, 27),
      'October half-term'
    );

    -- Term 2: Spring (Jan–Mar)
    term2_id := gen_random_uuid()::text;
    INSERT INTO "Term" ("id", "schoolId", "academicYear", "key", "name", "startDate", "endDate", "sortOrder")
    VALUES (
      term2_id, s."id", ay, 'term2', 'Spring',
      MAKE_DATE(yr_start + 1, 1, 6),
      MAKE_DATE(yr_start + 1, 3, 28),
      2
    );
    INSERT INTO "HalfTermBreak" ("id", "termId", "startDate", "endDate", "label")
    VALUES (
      gen_random_uuid()::text, term2_id,
      MAKE_DATE(yr_start + 1, 2, 17),
      MAKE_DATE(yr_start + 1, 2, 23),
      'February half-term'
    );

    -- Term 3: Summer (Apr–Jul)
    term3_id := gen_random_uuid()::text;
    INSERT INTO "Term" ("id", "schoolId", "academicYear", "key", "name", "startDate", "endDate", "sortOrder")
    VALUES (
      term3_id, s."id", ay, 'term3', 'Summer',
      MAKE_DATE(yr_start + 1, 4, 14),
      MAKE_DATE(yr_start + 1, 7, 18),
      3
    );
    INSERT INTO "HalfTermBreak" ("id", "termId", "startDate", "endDate", "label")
    VALUES (
      gen_random_uuid()::text, term3_id,
      MAKE_DATE(yr_start + 1, 5, 26),
      MAKE_DATE(yr_start + 1, 5, 30),
      'May half-term'
    );

    -- Assessment windows: read framework.activeTerms (JSON array of term keys).
    -- If no framework or unparseable, default to all three terms.
    fw_active_terms := NULL;
    IF s."frameworkId" IS NOT NULL THEN
      SELECT "activeTerms"::json INTO fw_active_terms FROM "Framework" WHERE "id" = s."frameworkId";
    END IF;

    is_term1_active := fw_active_terms IS NULL OR fw_active_terms::jsonb @> '"term1"'::jsonb;
    is_term2_active := fw_active_terms IS NULL OR fw_active_terms::jsonb @> '"term2"'::jsonb;
    is_term3_active := fw_active_terms IS NULL OR fw_active_terms::jsonb @> '"term3"'::jsonb;

    IF is_term1_active THEN
      INSERT INTO "AssessmentWindow" ("id", "schoolId", "academicYear", "termKey", "openAt", "closeAt")
      VALUES (gen_random_uuid()::text, s."id", ay, 'term1',
              MAKE_DATE(yr_start, 9, 1)::timestamp,
              MAKE_DATE(yr_start, 9, 30)::timestamp);
    END IF;
    IF is_term2_active THEN
      INSERT INTO "AssessmentWindow" ("id", "schoolId", "academicYear", "termKey", "openAt", "closeAt")
      VALUES (gen_random_uuid()::text, s."id", ay, 'term2',
              MAKE_DATE(yr_start + 1, 1, 6)::timestamp,
              MAKE_DATE(yr_start + 1, 2, 3)::timestamp);
    END IF;
    IF is_term3_active THEN
      INSERT INTO "AssessmentWindow" ("id", "schoolId", "academicYear", "termKey", "openAt", "closeAt")
      VALUES (gen_random_uuid()::text, s."id", ay, 'term3',
              MAKE_DATE(yr_start + 1, 4, 14)::timestamp,
              MAKE_DATE(yr_start + 1, 5, 12)::timestamp);
    END IF;

    -- Weekly Monday pulse schedule for schools that had pulse enabled. We
    -- DO NOT materialise occurrences here — that's done lazily by the
    -- scheduling lib on first calendar view, so we don't have to teach the
    -- migration the half-term skip logic.
    IF s."pulseEnabled" THEN
      schedule_id := gen_random_uuid()::text;
      INSERT INTO "PulseSchedule" ("id", "schoolId", "academicYear", "cadence", "dayOfWeek", "startDate", "endDate", "active", "updatedAt")
      VALUES (
        schedule_id, s."id", ay, 'weekly', 1,
        MAKE_DATE(yr_start, 9, 8), -- start a week after the first assessment window opens
        MAKE_DATE(yr_start + 1, 7, 18),
        TRUE,
        CURRENT_TIMESTAMP
      );
    END IF;
  END LOOP;
END $$;
