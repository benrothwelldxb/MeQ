"use server";

import { prisma } from "@/lib/db";
import { getAdminSession, getTeacherSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

type Actor =
  | { type: "admin"; adminId: string; schoolId: string; email: string }
  | { type: "teacher"; teacherId: string; schoolId: string; email: string };

async function getActor(): Promise<Actor | null> {
  const teacher = await getTeacherSession();
  if (teacher.teacherId) {
    return { type: "teacher", teacherId: teacher.teacherId, schoolId: teacher.schoolId, email: teacher.email };
  }
  const admin = await getAdminSession();
  if (admin.adminId) {
    return { type: "admin", adminId: admin.adminId, schoolId: admin.schoolId, email: admin.email };
  }
  return null;
}

// Editable = creator (when still around) or any admin at the school.
// Shared teachers can view + see aggregate data but can't rename/delete the
// group or change its membership/sharing.
async function canEdit(actor: Actor, groupId: string): Promise<boolean> {
  const group = await prisma.smartGroup.findUnique({
    where: { id: groupId },
    select: { schoolId: true, createdByType: true, createdByTeacherId: true, createdByAdminId: true },
  });
  if (!group || group.schoolId !== actor.schoolId) return false;
  if (actor.type === "admin") return true;
  return group.createdByType === "teacher" && group.createdByTeacherId === actor.teacherId;
}

async function canView(actor: Actor, groupId: string): Promise<boolean> {
  if (await canEdit(actor, groupId)) return true;
  if (actor.type !== "teacher") return false;
  const access = await prisma.smartGroupTeacher.findUnique({
    where: { smartGroupId_teacherId: { smartGroupId: groupId, teacherId: actor.teacherId } },
    select: { teacherId: true },
  });
  return !!access;
}

export async function createSmartGroup(params: {
  name: string;
  description?: string | null;
  purpose?: string | null;
  studentIds?: string[];
  sharedTeacherIds?: string[];
}) {
  const actor = await getActor();
  if (!actor) return { error: "Not signed in" as const };

  const name = params.name.trim();
  if (!name) return { error: "Name is required" as const };
  if (name.length > 100) return { error: "Name too long" as const };

  // Validate that all students belong to this school.
  const studentIds = Array.from(new Set(params.studentIds ?? []));
  if (studentIds.length > 0) {
    const count = await prisma.student.count({
      where: { id: { in: studentIds }, schoolId: actor.schoolId },
    });
    if (count !== studentIds.length) {
      return { error: "Some students do not belong to this school" as const };
    }
  }

  const sharedTeacherIds = Array.from(new Set(params.sharedTeacherIds ?? []));
  if (sharedTeacherIds.length > 0) {
    const count = await prisma.teacher.count({
      where: { id: { in: sharedTeacherIds }, schoolId: actor.schoolId },
    });
    if (count !== sharedTeacherIds.length) {
      return { error: "Some teachers do not belong to this school" as const };
    }
  }

  const group = await prisma.smartGroup.create({
    data: {
      schoolId: actor.schoolId,
      name,
      description: params.description?.trim() || null,
      purpose: params.purpose?.trim() || null,
      createdByType: actor.type,
      createdByTeacherId: actor.type === "teacher" ? actor.teacherId : null,
      createdByAdminId: actor.type === "admin" ? actor.adminId : null,
      members: {
        create: studentIds.map((studentId) => ({ studentId })),
      },
      teacherAccess: {
        // Creator gets automatic access (if teacher) — listing code filters
        // by createdBy OR teacherAccess, so no need to insert a row for the
        // creator themselves. Just record the explicit shares.
        create: sharedTeacherIds
          .filter((id) => id !== (actor.type === "teacher" ? actor.teacherId : ""))
          .map((teacherId) => ({ teacherId })),
      },
    },
  });

  await recordAudit({
    schoolId: actor.schoolId,
    actorType: actor.type,
    actorId: actor.type === "admin" ? actor.adminId : actor.teacherId,
    actorLabel: actor.email,
    action: "smart_group.create",
    entityType: "smart_group",
    entityId: group.id,
    meta: { name, studentCount: studentIds.length, sharedCount: sharedTeacherIds.length },
  });

  revalidatePath("/admin/settings/groups");
  revalidatePath("/teacher");
  return { success: true as const, id: group.id };
}

export async function updateSmartGroup(
  groupId: string,
  params: { name?: string; description?: string | null; purpose?: string | null }
) {
  const actor = await getActor();
  if (!actor) return { error: "Not signed in" as const };
  if (!(await canEdit(actor, groupId))) return { error: "Not allowed" as const };

  const data: { name?: string; description?: string | null; purpose?: string | null } = {};
  if (params.name !== undefined) {
    const name = params.name.trim();
    if (!name) return { error: "Name is required" as const };
    data.name = name;
  }
  if (params.description !== undefined) data.description = params.description?.trim() || null;
  if (params.purpose !== undefined) data.purpose = params.purpose?.trim() || null;

  await prisma.smartGroup.update({ where: { id: groupId }, data });
  revalidatePath(`/admin/settings/groups/${groupId}`);
  revalidatePath(`/teacher/groups/${groupId}`);
  return { success: true as const };
}

export async function deleteSmartGroup(groupId: string) {
  const actor = await getActor();
  if (!actor) return { error: "Not signed in" as const };
  if (!(await canEdit(actor, groupId))) return { error: "Not allowed" as const };

  await prisma.smartGroup.delete({ where: { id: groupId } });
  await recordAudit({
    schoolId: actor.schoolId,
    actorType: actor.type,
    actorId: actor.type === "admin" ? actor.adminId : actor.teacherId,
    actorLabel: actor.email,
    action: "smart_group.delete",
    entityType: "smart_group",
    entityId: groupId,
  });
  revalidatePath("/admin/settings/groups");
  revalidatePath("/teacher");
  return { success: true as const };
}

export async function setSmartGroupMembers(groupId: string, studentIds: string[]) {
  const actor = await getActor();
  if (!actor) return { error: "Not signed in" as const };
  if (!(await canEdit(actor, groupId))) return { error: "Not allowed" as const };

  const uniqueIds = Array.from(new Set(studentIds));
  if (uniqueIds.length > 0) {
    const count = await prisma.student.count({
      where: { id: { in: uniqueIds }, schoolId: actor.schoolId },
    });
    if (count !== uniqueIds.length) {
      return { error: "Some students do not belong to this school" as const };
    }
  }

  await prisma.$transaction([
    prisma.smartGroupStudent.deleteMany({ where: { smartGroupId: groupId } }),
    ...(uniqueIds.length > 0
      ? [prisma.smartGroupStudent.createMany({
          data: uniqueIds.map((studentId) => ({ smartGroupId: groupId, studentId })),
        })]
      : []),
  ]);

  revalidatePath(`/admin/settings/groups/${groupId}`);
  revalidatePath(`/teacher/groups/${groupId}`);
  return { success: true as const };
}

export async function setSmartGroupSharedTeachers(groupId: string, teacherIds: string[]) {
  const actor = await getActor();
  if (!actor) return { error: "Not signed in" as const };
  if (!(await canEdit(actor, groupId))) return { error: "Not allowed" as const };

  const group = await prisma.smartGroup.findUnique({
    where: { id: groupId },
    select: { createdByTeacherId: true },
  });
  if (!group) return { error: "Group not found" as const };

  // The creator (if a teacher) is always in. We don't store a row for them.
  const cleanIds = Array.from(new Set(teacherIds)).filter(
    (id) => id !== group.createdByTeacherId
  );

  if (cleanIds.length > 0) {
    const count = await prisma.teacher.count({
      where: { id: { in: cleanIds }, schoolId: actor.schoolId },
    });
    if (count !== cleanIds.length) {
      return { error: "Some teachers do not belong to this school" as const };
    }
  }

  await prisma.$transaction([
    prisma.smartGroupTeacher.deleteMany({ where: { smartGroupId: groupId } }),
    ...(cleanIds.length > 0
      ? [prisma.smartGroupTeacher.createMany({
          data: cleanIds.map((teacherId) => ({ smartGroupId: groupId, teacherId })),
        })]
      : []),
  ]);

  revalidatePath(`/admin/settings/groups/${groupId}`);
  revalidatePath(`/teacher/groups/${groupId}`);
  return { success: true as const };
}

/** Groups a given teacher can see (created by them OR shared with them). */
export async function getTeacherSmartGroups(teacherId: string, schoolId: string) {
  return prisma.smartGroup.findMany({
    where: {
      schoolId,
      OR: [
        { createdByTeacherId: teacherId },
        { teacherAccess: { some: { teacherId } } },
      ],
    },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/** All groups in a school (admin view). */
export async function getSchoolSmartGroups(schoolId: string) {
  return prisma.smartGroup.findMany({
    where: { schoolId },
    include: {
      _count: { select: { members: true } },
      createdByTeacher: { select: { firstName: true, lastName: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/** Helper: returns true if the current actor is allowed to view this group. */
export async function canViewSmartGroup(groupId: string): Promise<boolean> {
  const actor = await getActor();
  if (!actor) return false;
  return canView(actor, groupId);
}
