import { prisma } from "./db";

export async function getSchoolSettings(schoolId: string) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new Error("School not found");
  return school;
}

export const TERM_LABELS: Record<string, string> = {
  term1: "Term 1",
  term2: "Term 2",
  term3: "Term 3",
};
