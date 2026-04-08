import { prisma } from "./db";

export async function getSchoolSettings() {
  let school = await prisma.school.findFirst();
  if (!school) {
    school = await prisma.school.create({
      data: { name: "My School" },
    });
  }
  return school;
}

export const TERM_LABELS: Record<string, string> = {
  term1: "Term 1",
  term2: "Term 2",
  term3: "Term 3",
};
