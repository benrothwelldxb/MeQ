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
  const authMode = (formData.get("authMode") as string) || "both";
  const inspectorate = (formData.get("inspectorate") as string) || "generic";
  const isActive = formData.get("isActive") === "on";
  const reducedJunior = formData.get("reducedJunior") === "on";
  const reducedStandard = formData.get("reducedStandard") === "on";
  const pulseEnabled = formData.get("pulseEnabled") === "on";
  const readAloudEnabled = formData.get("readAloudEnabled") === "on";
  const staffWellbeingEnabled = formData.get("staffWellbeingEnabled") === "on";

  if (!name) return { error: "School name is required." };
  if (!["password", "sso", "both"].includes(authMode)) {
    return { error: "Invalid sign-in method." };
  }

  await prisma.school.update({
    where: { id: schoolId },
    data: {
      name,
      currentTerm,
      academicYear,
      dslEmail,
      authMode,
      inspectorate,
      isActive,
      reducedJunior,
      reducedStandard,
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

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { academicYear: true },
  });
  if (!school) return { error: "School not found." };

  // Lock framework changes if any assessment has been completed this academic year
  const completedThisYear = await prisma.assessment.count({
    where: {
      status: "completed",
      academicYear: school.academicYear,
      student: { schoolId },
    },
  });
  if (completedThisYear > 0) {
    return {
      error: `Framework is locked: ${completedThisYear} assessment(s) completed in ${school.academicYear}. It can be changed at the start of a new academic year.`,
    };
  }

  await prisma.school.update({
    where: { id: schoolId },
    data: { frameworkId },
  });

  revalidatePath(`/super/schools/${schoolId}`);
  revalidatePath("/super");
  return { success: true };
}
