import { describe, it, expect } from "vitest";
import {
  calculateFrameworkDomainScores,
  calculateTotalScore,
  calculateReliability,
  getLevel,
  getOverallLevel,
  getFrameworkLevel,
} from "./scoring";

const LIKERT_MAP = JSON.stringify({ "1": 0, "2": 1, "3": 2, "4": 3, "5": 4 });
const REVERSE_MAP = JSON.stringify({ "1": 4, "2": 3, "3": 2, "4": 1, "5": 0 });

// Helper to build a core question
function q(orderIndex: number, domainKey: string, opts: Partial<Record<string, unknown>> = {}) {
  return {
    orderIndex,
    domainKey,
    type: "core",
    weight: 1.0,
    scoreMap: LIKERT_MAP,
    ...opts,
  };
}

describe("calculateFrameworkDomainScores", () => {
  it("sums mapped scores per domain using the scoreMap", () => {
    const questions = [
      q(1, "KnowMe"), // answer "5" -> 4
      q(2, "KnowMe"), // answer "3" -> 2
      q(3, "ManageMe"), // answer "4" -> 3
    ];
    const answers = { "1": 5, "2": 3, "3": 4 };
    const result = calculateFrameworkDomainScores(answers, questions, ["KnowMe", "ManageMe"]);
    expect(result.KnowMe).toBe(6);
    expect(result.ManageMe).toBe(3);
  });

  it("applies weight to each question", () => {
    const questions = [
      q(1, "KnowMe", { weight: 2.0 }), // 4 * 2 = 8
      q(2, "KnowMe", { weight: 0.5 }), // 2 * 0.5 = 1
    ];
    const answers = { "1": 5, "2": 3 };
    const result = calculateFrameworkDomainScores(answers, questions, ["KnowMe"]);
    expect(result.KnowMe).toBe(9);
  });

  it("respects a reverse score map", () => {
    const questions = [
      q(1, "KnowMe", { scoreMap: REVERSE_MAP }), // answer 5 -> 0
      q(2, "KnowMe", { scoreMap: REVERSE_MAP }), // answer 1 -> 4
    ];
    const answers = { "1": 5, "2": 1 };
    const result = calculateFrameworkDomainScores(answers, questions, ["KnowMe"]);
    expect(result.KnowMe).toBe(4);
  });

  it("ignores validation and trap questions", () => {
    const questions = [
      q(1, "KnowMe"), // core
      q(2, "KnowMe", { type: "validation" }),
      q(3, "KnowMe", { type: "trap" }),
    ];
    const answers = { "1": 5, "2": 5, "3": 5 };
    const result = calculateFrameworkDomainScores(answers, questions, ["KnowMe"]);
    expect(result.KnowMe).toBe(4);
  });

  it("skips missing answers without crashing", () => {
    const questions = [q(1, "KnowMe"), q(2, "KnowMe")];
    const answers = { "1": 5 }; // Q2 missing
    const result = calculateFrameworkDomainScores(answers, questions, ["KnowMe"]);
    expect(result.KnowMe).toBe(4);
  });

  it("returns 0 for a domain with no core questions", () => {
    const questions = [q(1, "KnowMe")];
    const result = calculateFrameworkDomainScores({ "1": 5 }, questions, ["KnowMe", "ManageMe"]);
    expect(result.ManageMe).toBe(0);
  });

  it("rounds to one decimal place", () => {
    const questions = [
      q(1, "KnowMe", { weight: 1.33 }), // 4 * 1.33 = 5.32 -> 5.3
    ];
    const answers = { "1": 5 };
    const result = calculateFrameworkDomainScores(answers, questions, ["KnowMe"]);
    expect(result.KnowMe).toBe(5.3);
  });
});

describe("calculateTotalScore", () => {
  it("sums every domain score", () => {
    const result = calculateTotalScore({
      KnowMe: 15,
      ManageMe: 12,
      UnderstandOthers: 10,
      WorkWithOthers: 8,
      ChooseWell: 14,
    } as never);
    expect(result).toBe(59);
  });

  it("returns 0 for empty input", () => {
    expect(calculateTotalScore({} as never)).toBe(0);
  });

  it("rounds to one decimal place", () => {
    const result = calculateTotalScore({ KnowMe: 1.23, ManageMe: 2.34 } as never);
    expect(result).toBe(3.6);
  });
});

describe("calculateReliability", () => {
  it("returns High when all validation pairs agree and no trap flags", () => {
    const questions = [
      { orderIndex: 1, domain: "KnowMe", type: "validation", questionFormat: "self-report", weight: 1, isValidation: true, isTrap: false, validationPair: 2, scoreMap: LIKERT_MAP },
      { orderIndex: 2, domain: "KnowMe", type: "validation", questionFormat: "self-report", weight: 1, isValidation: true, isTrap: false, validationPair: 1, scoreMap: LIKERT_MAP },
      { orderIndex: 3, domain: "KnowMe", type: "trap", questionFormat: "self-report", weight: 1, isValidation: false, isTrap: true, validationPair: null, scoreMap: LIKERT_MAP },
    ];
    // Trap answer of 4 is counted as a flag by scoring logic; use 2 to pass.
    const answers = { "1": 5, "2": 5, "3": 2 };
    expect(calculateReliability(answers, questions)).toBe("High");
  });

  it("drops reliability when trap questions are flagged", () => {
    const questions = [
      { orderIndex: 1, domain: "KnowMe", type: "trap", questionFormat: "self-report", weight: 1, isValidation: false, isTrap: true, validationPair: null, scoreMap: LIKERT_MAP },
    ];
    const answers = { "1": 4 };
    expect(calculateReliability(answers, questions)).not.toBe("High");
  });

  it("returns Low when most validation pairs disagree", () => {
    const questions = [
      { orderIndex: 1, domain: "KnowMe", type: "validation", questionFormat: "self-report", weight: 1, isValidation: true, isTrap: false, validationPair: 2, scoreMap: LIKERT_MAP },
      { orderIndex: 2, domain: "KnowMe", type: "validation", questionFormat: "self-report", weight: 1, isValidation: true, isTrap: false, validationPair: 1, scoreMap: LIKERT_MAP },
    ];
    const answers = { "1": 1, "2": 5 };
    expect(calculateReliability(answers, questions)).toBe("Low");
  });

  it("returns High for junior tier (no validation or trap)", () => {
    expect(calculateReliability({}, [])).toBe("High");
  });
});

describe("level thresholds", () => {
  it("getLevel returns correct standard-tier band", () => {
    expect(getLevel(18)).toBe("Advanced");
    expect(getLevel(15)).toBe("Secure");
    expect(getLevel(10)).toBe("Developing");
    expect(getLevel(5)).toBe("Emerging");
    expect(getLevel(0)).toBe("Emerging");
  });

  it("getLevel uses lower thresholds for junior tier", () => {
    expect(getLevel(14, "junior")).toBe("Advanced");
    expect(getLevel(11, "junior")).toBe("Secure");
    expect(getLevel(8, "junior")).toBe("Developing");
  });

  it("getOverallLevel tracks total score bands", () => {
    expect(getOverallLevel(95)).toBe("Advanced");
    expect(getOverallLevel(80)).toBe("Secure");
    expect(getOverallLevel(60)).toBe("Developing");
    expect(getOverallLevel(30)).toBe("Emerging");
  });

  it("getFrameworkLevel returns highest matching level (descending thresholds)", () => {
    const thresholds = [
      { level: "Advanced", min: 9 },
      { level: "Secure", min: 7 },
      { level: "Developing", min: 4 },
      { level: "Emerging", min: 0 },
    ];
    expect(getFrameworkLevel(10, thresholds)).toBe("Advanced");
    expect(getFrameworkLevel(8, thresholds)).toBe("Secure");
    expect(getFrameworkLevel(5, thresholds)).toBe("Developing");
    expect(getFrameworkLevel(0, thresholds)).toBe("Emerging");
  });
});
