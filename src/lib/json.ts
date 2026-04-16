import { z } from "zod";

/**
 * Safe JSON parsing helpers. Use these instead of raw `JSON.parse(x) as T`
 * casts — they survive malformed data, missing fields, and wrong types
 * without crashing the request.
 */

/**
 * Parse JSON text against a Zod schema. Returns the validated value or the
 * provided fallback if parsing or validation fails.
 */
export function parseJsonWith<T>(
  text: string | null | undefined,
  schema: z.ZodType<T>,
  fallback: T
): T {
  if (!text) return fallback;
  try {
    const parsed = JSON.parse(text);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}

// ---- Pre-built schemas for common shapes ----

/** Record<string, number> — e.g. domain scores JSON */
export const NumberRecord = z.record(z.string(), z.number());

/** Record<string, string> — e.g. domain levels JSON */
export const StringRecord = z.record(z.string(), z.string());

/** Record<string, number | string> — e.g. survey answers (mixed) */
export const AnswerRecord = z.record(z.string(), z.union([z.number(), z.string()]));

/** Array of strings — e.g. target IDs, options */
export const StringArray = z.array(z.string());

// ---- Convenience wrappers ----

export function parseNumberRecord(text: string | null | undefined): Record<string, number> {
  return parseJsonWith(text, NumberRecord, {});
}

export function parseStringRecord(text: string | null | undefined): Record<string, string> {
  return parseJsonWith(text, StringRecord, {});
}

export function parseAnswerRecord(text: string | null | undefined): Record<string, number | string> {
  return parseJsonWith(text, AnswerRecord, {});
}

export function parseStringArray(text: string | null | undefined): string[] {
  return parseJsonWith(text, StringArray, []);
}
