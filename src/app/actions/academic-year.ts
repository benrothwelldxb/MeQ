"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { nextAcademicYear } from "@/lib/academic-year";
import { revalidatePath } from "next/cache";

export async function rolloverAcademicYear(
  _prev: { error?: string; success?: boolean; newYear?: string } | null,
  formData: FormData
) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized." };

  const confirmation = (formData.get("confirmation") as string)?.trim();
  const requestedYear = ((formData.get("academicYear") as string) || "").trim();

  const school = await prisma.school.findUnique({
    where: { id: session.schoolId },
    select: { academicYear: true, name: true },
  });
  if (!school) return { error: "School not found." };

  const expected = `ROLL OVER ${school.name.toUpperCase()}`;
  if (confirmation !== expected) {
    return {
      error: `Type "${expected}" exactly to confirm. This is to prevent accidental rollovers.`,
    };
  }

  const target = requestedYear || nextAcademicYear(school.academicYear);

  if (target === school.academicYear) {
    return { error: "New academic year matches the current one." };
  }

  await prisma.school.update({
    where: { id: session.schoolId },
    data: { academicYear: target, currentTerm: "term1" },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  return { success: true, newYear: target };
}
