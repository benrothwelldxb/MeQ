"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { sendStaffWellbeingDeployBatch } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function deployStaffWellbeing(
  _prev: { error?: string; success?: boolean; sent?: number; failed?: number } | null,
  formData: FormData
) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized." };

  const school = await getSchoolSettings(session.schoolId);
  if (!school.staffWellbeingEnabled) {
    return { error: "Staff wellbeing is not enabled for this school." };
  }

  const customMessage = ((formData.get("message") as string) || "").trim() || undefined;

  const teachers = await prisma.teacher.findMany({
    where: { schoolId: session.schoolId },
    select: { email: true, firstName: true },
  });

  if (teachers.length === 0) {
    return { error: "No staff to notify." };
  }

  const termLabel = `${TERM_LABELS[school.currentTerm] ?? school.currentTerm} ${school.academicYear}`;

  // Use Resend's batch API — one request per 100 recipients, bypasses the
  // 2-emails-per-second per-call rate limit.
  const { sent, failed } = await sendStaffWellbeingDeployBatch(teachers, {
    schoolName: school.name,
    termLabel,
    customMessage,
  });

  revalidatePath("/admin/staff-wellbeing");
  return { success: true, sent, failed };
}
