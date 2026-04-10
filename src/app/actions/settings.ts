"use server";

import { prisma } from "@/lib/db";
import { getSchoolSettings } from "@/lib/school";
import { getAdminSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateSchoolSettings(formData: FormData) {
  const session = await getAdminSession();
  const school = await getSchoolSettings(session.schoolId);
  const name = (formData.get("name") as string)?.trim() || school.name;
  const currentTerm = (formData.get("currentTerm") as string) || school.currentTerm;
  const academicYear = (formData.get("academicYear") as string)?.trim() || school.academicYear;

  const reducedQuestions = formData.get("reducedQuestions") === "on";
  const pulseEnabled = formData.get("pulseEnabled") === "on";
  const readAloudEnabled = formData.get("readAloudEnabled") === "on";
  const staffWellbeingEnabled = formData.get("staffWellbeingEnabled") === "on";
  const frameworkId = (formData.get("frameworkId") as string) || null;

  await prisma.school.update({
    where: { id: school.id },
    data: { name, currentTerm, academicYear, reducedQuestions, pulseEnabled, readAloudEnabled, staffWellbeingEnabled, frameworkId },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
}
