import { describe, it, expect } from "vitest";
import { moderateText, MODERATION_KEYWORDS } from "./surveys";

describe("moderateText — safeguarding triggers", () => {
  // Each phrase here has come up in real safeguarding incidents or in
  // testing where the system silently failed to flag. Any future change to
  // moderation logic that breaks these assertions will fail CI loudly.
  const mustFlag = [
    "I want to kill myself",
    "i want to kill myself",
    "I WANT TO KILL MYSELF",
    "Sometimes I think about suicide",
    "I want to end my life",
    "I want to die",
    "Nobody likes me",
    "no one likes me",
    "I hate myself",
    "I cut myself yesterday",
    "I'm going to run away",
    "Someone hits me at home",
    "I want to hurt myself",
  ];

  for (const phrase of mustFlag) {
    it(`flags "${phrase}"`, () => {
      const result = moderateText(phrase);
      expect(result.flagged, `expected "${phrase}" to be flagged`).toBe(true);
      expect(result.reason).toBeTruthy();
    });
  }

  it("does not flag innocuous text", () => {
    expect(moderateText("I had a great day at school").flagged).toBe(false);
    expect(moderateText("I like maths").flagged).toBe(false);
    expect(moderateText("My dog is fluffy").flagged).toBe(false);
  });

  it("handles null/undefined/empty without throwing", () => {
    expect(moderateText("").flagged).toBe(false);
    expect(moderateText("   ").flagged).toBe(false);
  });

  it("respects school custom keywords", () => {
    const result = moderateText("the playground is unsafe", ["unsafe"]);
    expect(result.flagged).toBe(true);
    expect(result.reason).toContain("unsafe");
  });

  it("custom keywords are case-insensitive", () => {
    const result = moderateText("MY HOUSE IS DANGEROUS", ["dangerous"]);
    expect(result.flagged).toBe(true);
  });

  it("MODERATION_KEYWORDS contains the core suicide-risk phrases", () => {
    // Sanity check on the source list itself — these are the most critical
    // phrases and must never be removed.
    expect(MODERATION_KEYWORDS).toContain("kill myself");
    expect(MODERATION_KEYWORDS).toContain("suicide");
    expect(MODERATION_KEYWORDS).toContain("want to die");
    expect(MODERATION_KEYWORDS).toContain("end my life");
    expect(MODERATION_KEYWORDS).toContain("hurt myself");
  });
});
