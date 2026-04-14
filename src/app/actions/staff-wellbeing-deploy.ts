"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { sendStaffWellbeingDeployEmail } from "@/lib/email";
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
  let sent = 0;
  let failed = 0;

  for (const teacher of teachers) {
    try {
      await sendStaffWellbeingDeployEmail({
        email: teacher.email,
        firstName: teacher.firstName,
        schoolName: school.name,
        termLabel,
        customMessage,
      });
      sent++;
    } catch (err) {
      console.error(`[staff-wellbeing-deploy] failed for ${teacher.email}:`, err);
      failed++;
    }
  }

  revalidatePath("/admin/staff-wellbeing");
  return { success: true, sent, failed };
}
