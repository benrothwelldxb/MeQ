"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { sendStaffWellbeingDeployBatch } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function deployStaffWellbeing(
  _prev: { error?: string; success?: boolean; sent?: number; failed?: number; targetCount?: number } | null,
  formData: FormData
) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized." };

  const school = await getSchoolSettings(session.schoolId);
  if (!school.staffWellbeingEnabled) {
    return { error: "Staff wellbeing is not enabled for this school." };
  }

  const customMessage = ((formData.get("message") as string) || "").trim() || undefined;
  const onlyUnnotified = formData.get("onlyUnnotified") === "on";

  const allTeachers = await prisma.teacher.findMany({
    where: { schoolId: session.schoolId },
    select: { id: true, email: true, firstName: true },
  });

  // Filter out already-notified teachers this term if requested
  let teachers = allTeachers;
  if (onlyUnnotified) {
    const alreadyNotified = await prisma.staffWellbeingNotification.findMany({
      where: {
        term: school.currentTerm,
        academicYear: school.academicYear,
        teacherId: { in: allTeachers.map((t) => t.id) },
      },
      select: { teacherId: true },
    });
    const notifiedSet = new Set(alreadyNotified.map((n) => n.teacherId));
    teachers = allTeachers.filter((t) => !notifiedSet.has(t.id));
  }

  if (teachers.length === 0) {
    return { error: onlyUnnotified ? "All staff have already been notified this term." : "No staff to notify." };
  }

  const termLabel = `${TERM_LABELS[school.currentTerm] ?? school.currentTerm} ${school.academicYear}`;

  const { sent, failed } = await sendStaffWellbeingDeployBatch(
    teachers.map(({ email, firstName }) => ({ email, firstName })),
    { schoolName: school.name, termLabel, customMessage }
  );

  // Record successful notifications. Resend batch returns one ID per accepted
  // message in input order — if "sent" < recipients, we can't reliably know
  // which failed, so we conservatively only log on a fully successful batch.
  if (sent === teachers.length && failed === 0) {
    for (const t of teachers) {
      await prisma.staffWellbeingNotification.upsert({
        where: {
          teacherId_term_academicYear: {
            teacherId: t.id,
            term: school.currentTerm,
            academicYear: school.academicYear,
          },
        },
        create: {
          teacherId: t.id,
          term: school.currentTerm,
          academicYear: school.academicYear,
        },
        update: { sentAt: new Date() },
      });
    }
  }

  revalidatePath("/admin/staff-wellbeing");
  return { success: true, sent, failed, targetCount: teachers.length };
}
