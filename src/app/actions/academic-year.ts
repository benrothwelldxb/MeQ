"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

/**
 * Compute the next academic year string given a current one.
 * Accepts "2025-2026" or "2025/2026" → returns "2026-2027".
 * If we can't parse it, just appends one year to the trailing 4-digit value.
 */
export function nextAcademicYear(current: string): string {
  const match = current.match(/^(\d{4})[-/](\d{4})$/);
  if (match) {
    const start = parseInt(match[1], 10);
    return `${start + 1}-${start + 2}`;
  }
  // Fallback — try to bump the last 4-digit token
  const last = current.match(/(\d{4})$/);
  if (last) {
    const end = parseInt(last[1], 10);
    return `${end}-${end + 1}`;
  }
  return current;
}

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
