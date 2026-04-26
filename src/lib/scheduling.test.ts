import { describe, it, expect } from "vitest";
import {
  materialisePulseDates,
  applyPulseOverrides,
  validatePulseDates,
  validateAssessmentWindow,
  PULSE_POST_ASSESSMENT_GAP_DAYS,
  type TermLike,
  type AssessmentWindowLike,
  type PulseScheduleLike,
} from "./scheduling";

const d = (iso: string) => new Date(iso + "T00:00:00.000Z");

const autumn: TermLike = {
  key: "term1",
  name: "Autumn",
  startDate: d("2025-09-01"),
  endDate: d("2025-12-19"),
  halfTerms: [{ startDate: d("2025-10-21"), endDate: d("2025-10-27"), label: "October half-term" }],
};

const spring: TermLike = {
  key: "term2",
  name: "Spring",
  startDate: d("2026-01-06"),
  endDate: d("2026-03-28"),
  halfTerms: [{ startDate: d("2026-02-17"), endDate: d("2026-02-23"), label: "February half-term" }],
};

describe("materialisePulseDates", () => {
  it("generates weekly Monday pulses inside a term", () => {
    const schedule: PulseScheduleLike = {
      cadence: "weekly",
      dayOfWeek: 1,
      startDate: d("2025-09-08"),
      endDate: d("2025-12-19"),
    };
    const dates = materialisePulseDates(schedule, [autumn], []);
    // Expect ~16 Mondays minus the half-term Monday (27 Oct).
    expect(dates.length).toBeGreaterThan(10);
    expect(dates.every((x) => x.getUTCDay() === 1)).toBe(true);
  });

  it("skips dates inside a half-term break", () => {
    const schedule: PulseScheduleLike = {
      cadence: "weekly",
      dayOfWeek: 1,
      startDate: d("2025-09-01"),
      endDate: d("2025-12-19"),
    };
    const dates = materialisePulseDates(schedule, [autumn], []);
    // 27 Oct 2025 is a Monday inside the Oct half-term.
    expect(dates.find((x) => x.toISOString().startsWith("2025-10-27"))).toBeUndefined();
  });

  it("skips dates inside an assessment window", () => {
    const schedule: PulseScheduleLike = {
      cadence: "weekly",
      dayOfWeek: 1,
      startDate: d("2025-09-01"),
      endDate: d("2025-12-19"),
    };
    const aw: AssessmentWindowLike = { termKey: "term1", openAt: d("2025-09-01"), closeAt: d("2025-09-30") };
    const dates = materialisePulseDates(schedule, [autumn], [aw]);
    // No Monday in September should appear.
    expect(dates.find((x) => x.getUTCMonth() === 8)).toBeUndefined();
  });

  it(`skips dates within ${PULSE_POST_ASSESSMENT_GAP_DAYS} days after assessment close`, () => {
    const schedule: PulseScheduleLike = {
      cadence: "weekly",
      dayOfWeek: 1,
      startDate: d("2025-09-01"),
      endDate: d("2025-12-19"),
    };
    // Assessment closes Mon 29 Sep. The next Monday (6 Oct) is exactly 7 days after.
    const aw: AssessmentWindowLike = { termKey: "term1", openAt: d("2025-09-01"), closeAt: d("2025-09-29") };
    const dates = materialisePulseDates(schedule, [autumn], [aw]);
    // 6 Oct sits exactly on the gap boundary — exclusion is inclusive of the gap window so 6 Oct is excluded.
    expect(dates.find((x) => x.toISOString().startsWith("2025-10-06"))).toBeUndefined();
    // 13 Oct (14 days after close) should be present.
    expect(dates.find((x) => x.toISOString().startsWith("2025-10-13"))).toBeDefined();
  });

  it("handles biweekly cadence", () => {
    const schedule: PulseScheduleLike = {
      cadence: "biweekly",
      dayOfWeek: 1,
      startDate: d("2025-09-08"),
      endDate: d("2025-12-19"),
    };
    const dates = materialisePulseDates(schedule, [autumn], []);
    // Consecutive dates should be 14 days apart.
    for (let i = 1; i < dates.length; i++) {
      const diff = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
      // Allow >14 when a half-term skip happens.
      expect(diff >= 14).toBe(true);
    }
  });

  it("returns empty when schedule has no end date", () => {
    const schedule: PulseScheduleLike = {
      cadence: "weekly",
      dayOfWeek: 1,
      startDate: d("2025-09-01"),
      endDate: null,
    };
    expect(materialisePulseDates(schedule, [autumn], [])).toEqual([]);
  });

  it("respects multiple terms with their own half-terms", () => {
    const schedule: PulseScheduleLike = {
      cadence: "weekly",
      dayOfWeek: 1,
      startDate: d("2025-10-01"),
      endDate: d("2026-03-28"),
    };
    const dates = materialisePulseDates(schedule, [autumn, spring], []);
    // Christmas break (between term1 end and term2 start) should produce no pulses.
    expect(dates.find((x) => x.toISOString().startsWith("2025-12-29"))).toBeUndefined();
    expect(dates.find((x) => x.toISOString().startsWith("2026-01-05"))).toBeUndefined();
    // Feb half-term Monday (23 Feb) should be skipped.
    expect(dates.find((x) => x.toISOString().startsWith("2026-02-23"))).toBeUndefined();
  });
});

describe("applyPulseOverrides", () => {
  const base = [d("2025-09-08"), d("2025-09-15"), d("2025-09-22")];

  it("skips overridden dates", () => {
    const result = applyPulseOverrides(base, [{ date: d("2025-09-15"), status: "skipped" }]);
    expect(result.map((x) => x.toISOString())).not.toContain("2025-09-15T00:00:00.000Z");
    expect(result).toHaveLength(2);
  });

  it("adds ad-hoc dates", () => {
    const result = applyPulseOverrides(base, [{ date: d("2025-09-10"), status: "ad_hoc" }]);
    expect(result).toHaveLength(4);
    expect(result[1].toISOString()).toBe("2025-09-10T00:00:00.000Z");
  });

  it("dedupes when ad-hoc overlaps materialised", () => {
    const result = applyPulseOverrides(base, [{ date: d("2025-09-15"), status: "ad_hoc" }]);
    expect(result).toHaveLength(3);
  });
});

describe("validatePulseDates", () => {
  const aw: AssessmentWindowLike = { termKey: "term1", openAt: d("2025-09-01"), closeAt: d("2025-09-29") };

  it("flags dates inside an assessment window", () => {
    const violations = validatePulseDates([d("2025-09-15")], [autumn], [aw]);
    expect(violations).toHaveLength(1);
    expect(violations[0].kind).toBe("pulse_on_assessment_day");
  });

  it("flags dates within the post-assessment gap", () => {
    const violations = validatePulseDates([d("2025-10-03")], [autumn], [aw]);
    expect(violations[0].kind).toBe("pulse_too_soon_after_assessment");
  });

  it("flags dates outside any term", () => {
    const violations = validatePulseDates([d("2025-12-28")], [autumn], []);
    expect(violations[0].kind).toBe("pulse_outside_any_term");
  });

  it("returns empty for a valid date", () => {
    expect(validatePulseDates([d("2025-11-10")], [autumn], [aw])).toEqual([]);
  });
});

describe("validateAssessmentWindow", () => {
  it("passes when window sits inside the term", () => {
    expect(
      validateAssessmentWindow({ termKey: "term1", openAt: d("2025-09-08"), closeAt: d("2025-09-30") }, [autumn])
    ).toEqual([]);
  });

  it("flags when window starts before the term", () => {
    const result = validateAssessmentWindow(
      { termKey: "term1", openAt: d("2025-08-25"), closeAt: d("2025-09-30") }, [autumn]
    );
    expect(result[0].kind).toBe("assessment_outside_term");
  });

  it("flags when window ends after the term", () => {
    const result = validateAssessmentWindow(
      { termKey: "term1", openAt: d("2025-09-08"), closeAt: d("2026-01-15") }, [autumn]
    );
    expect(result[0].kind).toBe("assessment_outside_term");
  });
});
