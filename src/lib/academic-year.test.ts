import { describe, it, expect } from "vitest";
import { nextAcademicYear } from "./academic-year";

describe("nextAcademicYear", () => {
  it("advances hyphen-format", () => {
    expect(nextAcademicYear("2025-2026")).toBe("2026-2027");
  });

  it("advances slash-format (returns hyphen format)", () => {
    expect(nextAcademicYear("2025/2026")).toBe("2026-2027");
  });

  it("falls back to bumping the last 4-digit year", () => {
    expect(nextAcademicYear("AY 2025")).toBe("2025-2026");
  });

  it("returns the input unchanged when nothing numeric matches", () => {
    expect(nextAcademicYear("unknown")).toBe("unknown");
  });
});
