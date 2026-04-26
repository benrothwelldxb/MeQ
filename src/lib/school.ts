import { prisma } from "./db";

/**
 * Returns the school row, but with `currentTerm` derived from the calendar
 * when one exists for the active academic year. Falls back to the stored
 * `currentTerm` enum for schools that haven't set up term dates yet.
 *
 * The stored field stays writable (still used by year-rollover and as the
 * fallback) but UI surfaces should treat the returned value as authoritative.
 */
export async function getSchoolSettings(schoolId: string) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new Error("School not found");

  const today = new Date();
  const activeTerm = await prisma.term.findFirst({
    where: {
      schoolId,
      academicYear: school.academicYear,
      startDate: { lte: today },
      endDate: { gte: today },
    },
    select: { key: true },
  });

  return {
    ...school,
    currentTerm: activeTerm?.key ?? school.currentTerm,
  };
}

export const TERM_LABELS: Record<string, string> = {
  term1: "Term 1",
  term2: "Term 2",
  term3: "Term 3",
};
