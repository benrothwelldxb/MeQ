import { describe, it, expect } from "vitest";
import {
  parseNumberRecord,
  parseStringRecord,
  parseAnswerRecord,
  parseStringArray,
} from "./json";

describe("parseNumberRecord", () => {
  it("parses a valid record", () => {
    expect(parseNumberRecord(`{"KnowMe": 12, "ManageMe": 8}`)).toEqual({ KnowMe: 12, ManageMe: 8 });
  });

  it("returns {} for null/undefined/empty", () => {
    expect(parseNumberRecord(null)).toEqual({});
    expect(parseNumberRecord(undefined)).toEqual({});
    expect(parseNumberRecord("")).toEqual({});
  });

  it("returns {} for malformed JSON", () => {
    expect(parseNumberRecord("{KnowMe: 12")).toEqual({});
  });

  it("returns {} when values are not numbers", () => {
    expect(parseNumberRecord(`{"KnowMe": "twelve"}`)).toEqual({});
  });
});

describe("parseStringRecord", () => {
  it("parses string-valued records", () => {
    expect(parseStringRecord(`{"KnowMe": "Secure"}`)).toEqual({ KnowMe: "Secure" });
  });

  it("rejects mixed types", () => {
    expect(parseStringRecord(`{"KnowMe": 12}`)).toEqual({});
  });
});

describe("parseAnswerRecord", () => {
  it("accepts string or number values (mixed answers)", () => {
    expect(parseAnswerRecord(`{"q1": "yes", "q2": 4}`)).toEqual({ q1: "yes", q2: 4 });
  });
});

describe("parseStringArray", () => {
  it("parses an array of strings", () => {
    expect(parseStringArray(`["a", "b"]`)).toEqual(["a", "b"]);
  });

  it("returns [] for non-arrays", () => {
    expect(parseStringArray(`{"not": "an array"}`)).toEqual([]);
  });

  it("rejects mixed-type arrays", () => {
    expect(parseStringArray(`["a", 1]`)).toEqual([]);
  });
});
