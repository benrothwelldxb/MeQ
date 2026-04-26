// Pure scheduling logic. No database calls — takes loaded entities and
// produces materialised dates / validation results. Pure functions are
// trivially testable and the calendar UI calls them as needed.

export type Cadence = "weekly" | "biweekly" | "monthly" | "custom";

export interface TermLike {
  key: string;
  name: string;
  startDate: Date;
  endDate: Date;
  halfTerms: Array<{ startDate: Date; endDate: Date; label?: string | null }>;
}

export interface AssessmentWindowLike {
  termKey: string;
  openAt: Date;
  closeAt: Date;
}

export interface PulseScheduleLike {
  cadence: Cadence;
  dayOfWeek: number; // 1=Mon..5=Fri
  startDate: Date;
  endDate: Date | null;
}

export interface PulseOverrideLike {
  date: Date;
  status: "scheduled" | "skipped" | "ad_hoc";
  skipReason?: string | null;
}

/** Number of days a pulse must be after an assessment window closes. */
export const PULSE_POST_ASSESSMENT_GAP_DAYS = 7;

// All date arithmetic uses UTC so the materialisation is deterministic
// regardless of where the server (or a test runner) lives. School calendar
// dates don't carry a timezone — a "Monday pulse" means a row in the grid,
// not a wall-clock instant in any particular zone.

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(d: Date, n: number): Date {
  const x = startOfDay(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function isWithin(d: Date, start: Date, end: Date): boolean {
  const t = startOfDay(d).getTime();
  return t >= startOfDay(start).getTime() && t <= startOfDay(end).getTime();
}

/** Move `d` forward to the next instance of `targetDayOfWeek` (1=Mon..7=Sun, or 0/7 for Sunday). */
function nextDayOfWeek(d: Date, targetDayOfWeek: number): Date {
  const x = startOfDay(d);
  // JS getUTCDay returns 0..6 with 0=Sun. Convert to 1..7 with 1=Mon, 7=Sun.
  const current = x.getUTCDay() === 0 ? 7 : x.getUTCDay();
  const target = targetDayOfWeek === 0 ? 7 : targetDayOfWeek;
  const diff = (target - current + 7) % 7;
  return addDays(x, diff);
}

function cadenceStepDays(cadence: Cadence): number {
  switch (cadence) {
    case "weekly": return 7;
    case "biweekly": return 14;
    case "monthly": return 28; // approximate; close enough for school-term scheduling
    case "custom": return 7;   // custom = weekly default; explicit overrides handle the rest
  }
}

/**
 * Generate the dates a pulse schedule would fire on within the academic year.
 * Skips dates inside half-term breaks, on or within `PULSE_POST_ASSESSMENT_GAP_DAYS`
 * days of an assessment window's close, and within an assessment window.
 *
 * Returns dates ordered earliest-first.
 */
export function materialisePulseDates(
  schedule: PulseScheduleLike,
  terms: TermLike[],
  assessmentWindows: AssessmentWindowLike[]
): Date[] {
  const out: Date[] = [];
  if (!schedule.endDate) return out;

  const stepDays = cadenceStepDays(schedule.cadence);
  let cursor = nextDayOfWeek(startOfDay(schedule.startDate), schedule.dayOfWeek);
  const limit = startOfDay(schedule.endDate);

  // Pre-compute exclusion windows so the loop is O(n*m) where m is small.
  const halfTerms = terms.flatMap((t) => t.halfTerms.map((h) => ({ start: h.startDate, end: h.endDate })));
  const assessmentExclusions = assessmentWindows.map((aw) => ({
    start: startOfDay(aw.openAt),
    end: addDays(startOfDay(aw.closeAt), PULSE_POST_ASSESSMENT_GAP_DAYS),
  }));

  while (cursor.getTime() <= limit.getTime()) {
    const inHalfTerm = halfTerms.some((h) => isWithin(cursor, h.start, h.end));
    const inAssessmentBlock = assessmentExclusions.some((a) => isWithin(cursor, a.start, a.end));
    const inAnyTerm = terms.some((t) => isWithin(cursor, t.startDate, t.endDate));

    if (inAnyTerm && !inHalfTerm && !inAssessmentBlock) {
      out.push(new Date(cursor));
    }

    cursor = addDays(cursor, stepDays);
  }
  return out;
}

/**
 * Apply persisted overrides to a freshly-materialised list. `skipped` dates
 * are removed; `ad_hoc` dates are added (de-duplicated). Returns sorted.
 */
export function applyPulseOverrides(dates: Date[], overrides: PulseOverrideLike[]): Date[] {
  const skipKeys = new Set(
    overrides.filter((o) => o.status === "skipped").map((o) => startOfDay(o.date).toISOString())
  );
  const adHocDates = overrides
    .filter((o) => o.status === "ad_hoc")
    .map((o) => startOfDay(o.date));

  const filtered = dates.filter((d) => !skipKeys.has(startOfDay(d).toISOString()));
  const merged = [...filtered, ...adHocDates];

  // Dedupe + sort
  const seen = new Set<string>();
  const out: Date[] = [];
  for (const d of merged.sort((a, b) => a.getTime() - b.getTime())) {
    const key = startOfDay(d).toISOString();
    if (!seen.has(key)) { seen.add(key); out.push(d); }
  }
  return out;
}

// ============================================================================
// Validation — the hard-block rules
// ============================================================================

export type ScheduleViolation =
  | { kind: "pulse_on_assessment_day"; date: Date; conflictTerm: string }
  | { kind: "pulse_too_soon_after_assessment"; date: Date; assessmentClose: Date; daysShort: number }
  | { kind: "assessment_outside_term"; termKey: string; openAt: Date; closeAt: Date }
  | { kind: "pulse_outside_any_term"; date: Date };

/**
 * Validate that proposing `dates` for a pulse would not conflict with any
 * assessment window. Returns the list of violations (empty = OK).
 */
export function validatePulseDates(
  dates: Date[],
  terms: TermLike[],
  assessmentWindows: AssessmentWindowLike[]
): ScheduleViolation[] {
  const out: ScheduleViolation[] = [];
  for (const date of dates) {
    const inAnyTerm = terms.some((t) => isWithin(date, t.startDate, t.endDate));
    if (!inAnyTerm) {
      out.push({ kind: "pulse_outside_any_term", date });
      continue;
    }
    for (const aw of assessmentWindows) {
      if (isWithin(date, aw.openAt, aw.closeAt)) {
        out.push({ kind: "pulse_on_assessment_day", date, conflictTerm: aw.termKey });
        break;
      }
      const earliestPulse = addDays(startOfDay(aw.closeAt), PULSE_POST_ASSESSMENT_GAP_DAYS);
      // Only flag the "too soon after" violation when the date is AFTER close
      // but inside the gap window. The "during the window" case is caught above.
      if (date > aw.closeAt && date < earliestPulse) {
        const daysShort = Math.ceil((earliestPulse.getTime() - startOfDay(date).getTime()) / (1000 * 60 * 60 * 24));
        out.push({ kind: "pulse_too_soon_after_assessment", date, assessmentClose: aw.closeAt, daysShort });
        break;
      }
    }
  }
  return out;
}

/**
 * Validate that an assessment window sits within its declared term.
 */
export function validateAssessmentWindow(
  window: AssessmentWindowLike,
  terms: TermLike[]
): ScheduleViolation[] {
  const term = terms.find((t) => t.key === window.termKey);
  if (!term) return [];
  const open = startOfDay(window.openAt);
  const close = startOfDay(window.closeAt);
  const termStart = startOfDay(term.startDate);
  const termEnd = startOfDay(term.endDate);
  if (open < termStart || close > termEnd) {
    return [{ kind: "assessment_outside_term", termKey: window.termKey, openAt: window.openAt, closeAt: window.closeAt }];
  }
  return [];
}

export function describeViolation(v: ScheduleViolation): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  switch (v.kind) {
    case "pulse_on_assessment_day":
      return `Pulse on ${fmt(v.date)} clashes with the ${v.conflictTerm} assessment window.`;
    case "pulse_too_soon_after_assessment":
      return `Pulse on ${fmt(v.date)} is only ${PULSE_POST_ASSESSMENT_GAP_DAYS - v.daysShort} day(s) after the assessment closed on ${fmt(v.assessmentClose)} — minimum ${PULSE_POST_ASSESSMENT_GAP_DAYS} days required.`;
    case "assessment_outside_term":
      return `Assessment window for ${v.termKey} (${fmt(v.openAt)}–${fmt(v.closeAt)}) falls outside the term's dates.`;
    case "pulse_outside_any_term":
      return `Pulse on ${fmt(v.date)} falls outside any term — no students would be in school.`;
  }
}
