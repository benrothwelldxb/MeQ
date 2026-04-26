"use server";

import { prisma } from "@/lib/db";
import { getStudentSession, getTeacherSession, getAdminSession } from "@/lib/session";
import { createNotification, createNotificationsForMany } from "@/lib/notifications";
import { recordAudit } from "@/lib/audit";
import { sendCheckInRequestEmail } from "@/lib/email";
import { parseEmailList } from "@/lib/email";
import { revalidatePath } from "next/cache";

/**
 * Student lookup: returns the class teachers for a student and whether the
 * student has a "default" class teacher. Used to populate the check-in target
 * dropdown — their class teacher is pre-selected.
 */
export async function getCheckInTargets() {
  const session = await getStudentSession();
  if (!session.studentId) return { error: "Not signed in" as const };

  const student = await prisma.student.findUnique({
    where: { id: session.studentId },
    select: {
      schoolId: true,
      classGroupId: true,
      classGroupRef: { select: { teachers: { select: { id: true, firstName: true, lastName: true } } } },
    },
  });
  if (!student) return { error: "Student not found" as const };

  // All teachers at the school (so student can pick someone other than class teacher)
  const allTeachers = await prisma.teacher.findMany({
    where: { schoolId: student.schoolId },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const classTeacherIds = new Set(student.classGroupRef?.teachers.map((t) => t.id) ?? []);
  const defaultTeacherId = student.classGroupRef?.teachers[0]?.id ?? null;

  return {
    defaultTeacherId,
    teachers: allTeachers.map((t) => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`,
      isClassTeacher: classTeacherIds.has(t.id),
    })),
  };
}

export async function createCheckInRequest(params: {
  targetTeacherId?: string | null;
  freeText?: string | null;
}) {
  const session = await getStudentSession();
  if (!session.studentId) return { error: "Not signed in" as const };

  const student = await prisma.student.findUnique({
    where: { id: session.studentId },
    include: {
      school: { select: { id: true, name: true, dslEmail: true } },
      classGroupRef: { select: { teachers: { select: { id: true } } } },
    },
  });
  if (!student) return { error: "Student not found" as const };

  // Resolve target teacher: prefer explicit, else first class teacher.
  let targetTeacherId = params.targetTeacherId || null;
  if (!targetTeacherId && student.classGroupRef?.teachers[0]) {
    targetTeacherId = student.classGroupRef.teachers[0].id;
  }

  // Validate target teacher belongs to the same school.
  if (targetTeacherId) {
    const t = await prisma.teacher.findUnique({
      where: { id: targetTeacherId },
      select: { schoolId: true },
    });
    if (!t || t.schoolId !== student.schoolId) {
      targetTeacherId = null;
    }
  }

  const freeText = (params.freeText ?? "").trim().slice(0, 1000) || null;

  const request = await prisma.checkInRequest.create({
    data: {
      schoolId: student.schoolId,
      studentId: student.id,
      targetTeacherId,
      freeText,
    },
  });

  // Notify the target teacher (email + in-app)
  if (targetTeacherId) {
    const teacher = await prisma.teacher.findUnique({
      where: { id: targetTeacherId },
      select: { email: true, firstName: true },
    });
    if (teacher) {
      await createNotification({
        userType: "teacher",
        userId: targetTeacherId,
        schoolId: student.schoolId,
        category: "safeguarding",
        title: `Check-in requested: ${student.firstName} ${student.lastName}`,
        body: freeText ? `"${freeText.slice(0, 140)}${freeText.length > 140 ? "…" : ""}"` : "No additional note.",
        href: "/teacher",
      });

      try {
        await sendCheckInRequestEmail({
          to: teacher.email,
          teacherFirstName: teacher.firstName,
          schoolName: student.school.name,
          studentName: `${student.firstName} ${student.lastName}`,
          yearGroup: student.yearGroup,
          className: student.className,
          freeText,
        });
      } catch (err) {
        console.error("[check-in] Failed to send teacher email:", err);
      }
    }
  }

  // Notify DSLs in-app so the request shows up on the safeguarding tab.
  const dslEmails = parseEmailList(student.school.dslEmail);
  if (dslEmails.length > 0) {
    const dslAdmins = await prisma.admin.findMany({
      where: {
        schoolId: student.schoolId,
        email: { in: dslEmails.map((e) => e.toLowerCase()) },
      },
      select: { id: true },
    });
    if (dslAdmins.length > 0) {
      await createNotificationsForMany({
        userType: "admin",
        userIds: dslAdmins.map((a) => a.id),
        schoolId: student.schoolId,
        category: "safeguarding",
        title: `Check-in requested: ${student.firstName} ${student.lastName}`,
        body: freeText ? `"${freeText.slice(0, 140)}${freeText.length > 140 ? "…" : ""}"` : "No additional note.",
        href: "/admin/safeguarding?tab=checkins",
      });
    }
  }

  return { success: true as const, id: request.id };
}

/**
 * Resolve a check-in request. Either:
 *  - the target teacher (only their own), or
 *  - a DSL admin at the school
 * can mark it resolved. Students cannot.
 */
export async function resolveCheckInRequest(
  requestId: string,
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const notes = ((formData.get("notes") as string) || "").trim().slice(0, 1000) || null;

  const request = await prisma.checkInRequest.findUnique({ where: { id: requestId } });
  if (!request) return { error: "Request not found." };
  if (request.status !== "open") return { error: "Already resolved." };

  // Try teacher first
  const teacherSession = await getTeacherSession();
  if (teacherSession.teacherId) {
    if (teacherSession.schoolId !== request.schoolId) return { error: "Unauthorized." };
    // A teacher can only resolve requests targeted at them.
    if (request.targetTeacherId && request.targetTeacherId !== teacherSession.teacherId) {
      return { error: "Only the requested teacher or a safeguarding lead can resolve this." };
    }
    await prisma.checkInRequest.update({
      where: { id: requestId },
      data: {
        status: "resolved",
        notes,
        resolvedAt: new Date(),
        resolvedByType: "teacher",
        resolvedById: teacherSession.teacherId,
      },
    });
    await recordAudit({
      schoolId: request.schoolId,
      actorType: "teacher",
      actorId: teacherSession.teacherId,
      actorLabel: teacherSession.email,
      action: "check_in.resolve",
      entityType: "check_in_request",
      entityId: requestId,
      meta: notes ? { notes } : undefined,
    });
    revalidatePath("/teacher");
    revalidatePath("/admin/safeguarding");
    return { success: true };
  }

  // Fall back to admin (must be DSL)
  const adminSession = await getAdminSession();
  if (!adminSession.adminId) return { error: "Unauthorized." };
  if (adminSession.schoolId !== request.schoolId) return { error: "Unauthorized." };

  const [admin, school] = await Promise.all([
    prisma.admin.findUnique({ where: { id: adminSession.adminId }, select: { email: true } }),
    prisma.school.findUnique({ where: { id: request.schoolId }, select: { dslEmail: true } }),
  ]);
  const dslEmails = parseEmailList(school?.dslEmail);
  if (!admin || !dslEmails.includes(admin.email.toLowerCase())) {
    return { error: "Only Designated Safeguarding Leads can resolve check-ins from the admin view." };
  }

  await prisma.checkInRequest.update({
    where: { id: requestId },
    data: {
      status: "resolved",
      notes,
      resolvedAt: new Date(),
      resolvedByType: "admin",
      resolvedById: adminSession.adminId,
    },
  });
  await recordAudit({
    schoolId: request.schoolId,
    actorType: "admin",
    actorId: adminSession.adminId,
    actorLabel: admin.email,
    action: "check_in.resolve",
    entityType: "check_in_request",
    entityId: requestId,
    meta: notes ? { notes } : undefined,
  });
  revalidatePath("/admin/safeguarding");
  revalidatePath("/teacher");
  return { success: true };
}
