"use server";

import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateSchoolSettings(
  schoolId: string,
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const session = await getSuperAdminSession();
  if (!session.superAdminId) return { error: "Unauthorized." };

  const name = (formData.get("name") as string)?.trim();
  const currentTerm = formData.get("currentTerm") as string;
  const academicYear = (formData.get("academicYear") as string)?.trim();
  const dslEmail = (formData.get("dslEmail") as string)?.trim() || null;
  const isActive = formData.get("isActive") === "on";
  const reducedQuestions = formData.get("reducedQuestions") === "on";
  const pulseEnabled = formData.get("pulseEnabled") === "on";
  const readAloudEnabled = formData.get("readAloudEnabled") === "on";
  const staffWellbeingEnabled = formData.get("staffWellbeingEnabled") === "on";

  if (!name) return { error: "School name is required." };

  await prisma.school.update({
    where: { id: schoolId },
    data: {
      name,
      currentTerm,
      academicYear,
      dslEmail,
      isActive,
      reducedQuestions,
      pulseEnabled,
      readAloudEnabled,
      staffWellbeingEnabled,
    },
  });

  revalidatePath(`/super/schools/${schoolId}`);
  revalidatePath("/super");
  return { success: true };
}

export async function assignFrameworkToSchool(schoolId: string, frameworkId: string | null) {
  const session = await getSuperAdminSession();
  if (!session.superAdminId) return { error: "Unauthorized." };

  await prisma.school.update({
    where: { id: schoolId },
    data: { frameworkId },
  });

  revalidatePath(`/super/schools/${schoolId}`);
  revalidatePath("/super");
  return { success: true };
}
