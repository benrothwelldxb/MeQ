export const TEACHER_TAGS = [
  "Class Teacher",
  "Inclusion",
  "Specialist",
  "Assistant",
  "PLT",
] as const;

export type TeacherTag = (typeof TEACHER_TAGS)[number];

const TAG_SET = new Set<string>(TEACHER_TAGS);

export function isValidTag(value: string): value is TeacherTag {
  return TAG_SET.has(value);
}

export function parseTags(json: string | null | undefined): TeacherTag[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr.filter((t): t is TeacherTag => typeof t === "string" && isValidTag(t));
  } catch {
    return [];
  }
}

export const TAG_STYLES: Record<TeacherTag, string> = {
  "Class Teacher": "bg-blue-50 text-blue-700 border-blue-200",
  Inclusion: "bg-purple-50 text-purple-700 border-purple-200",
  Specialist: "bg-amber-50 text-amber-700 border-amber-200",
  Assistant: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PLT: "bg-rose-50 text-rose-700 border-rose-200",
};
