"use server";

import { prisma } from "@/lib/db";
import { getAdminSession, getTeacherSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

/**
 * Look up either an admin or teacher session and verify they can act on
 * the given student (admin: same school; teacher: same school AND teaches
 * one of the student's classes).
 */
async function authForStudent(studentId: string) {
  const adminSession = await getAdminSession().catch(() => null);
  if (adminSession?.adminId) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { schoolId: true },
    });
    if (!student || student.schoolId !== adminSession.schoolId) {
      return { error: "Student not found." as const };
    }
    return {
      schoolId: adminSession.schoolId,
      adminId: adminSession.adminId,
      teacherId: null as string | null,
    };
  }

  const teacherSession = await getTeacherSession().catch(() => null);
  if (teacherSession?.teacherId) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        schoolId: true,
        classGroupId: true,
        classGroupRef: { select: { teachers: { select: { id: true } } } },
      },
    });
    if (!student || student.schoolId !== teacherSession.schoolId) {
      return { error: "Student not found." as const };
    }
    const teaches = student.classGroupRef?.teachers.some((t) => t.id === teacherSession.teacherId);
    if (!teaches) return { error: "You do not teach this student." as const };
    return {
      schoolId: teacherSession.schoolId,
      adminId: null as string | null,
      teacherId: teacherSession.teacherId,
    };
  }

  return { error: "Unauthorized." as const };
}

export async function logIntervention(
  studentId: string,
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const auth = await authForStudent(studentId);
  if ("error" in auth) return { error: auth.error };

  const interventionId = (formData.get("interventionId") as string) || null;
  const domainKey = (formData.get("domainKey") as string)?.trim();
  const level = (formData.get("level") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  const notes = ((formData.get("notes") as string) || "").trim() || null;

  if (!domainKey || !level || !title) {
    return { error: "Domain, level, and title are required." };
  }

  await prisma.interventionLog.create({
    data: {
      studentId,
      schoolId: auth.schoolId,
      adminId: auth.adminId,
      teacherId: auth.teacherId,
      source: "intervention",
      interventionId,
      domainKey,
      level,
      title,
      notes,
    },
  });

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath(`/teacher/students/${studentId}`);
  return { success: true };
}

export async function deleteInterventionLog(logId: string) {
  const log = await prisma.interventionLog.findUnique({ where: { id: logId } });
  if (!log) return { error: "Log entry not found." };

  const auth = await authForStudent(log.studentId);
  if ("error" in auth) return { error: auth.error };

  await prisma.interventionLog.delete({ where: { id: logId } });
  revalidatePath(`/admin/students/${log.studentId}`);
  revalidatePath(`/teacher/students/${log.studentId}`);
  return { success: true };
}
