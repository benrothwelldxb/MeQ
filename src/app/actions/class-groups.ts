"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createClassGroup(formData: FormData) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized." };

  const name = (formData.get("name") as string)?.trim();
  const yearGroupId = formData.get("yearGroupId") as string;

  if (!name || !yearGroupId) return { error: "Name and year group are required" };

  // Verify year group belongs to this school — prevents creating classes
  // under another school's year group via a crafted ID.
  const yearGroup = await prisma.yearGroup.findUnique({
    where: { id: yearGroupId },
    select: { schoolId: true },
  });
  if (!yearGroup || yearGroup.schoolId !== session.schoolId) {
    return { error: "Year group not found." };
  }

  const existing = await prisma.classGroup.findUnique({
    where: { yearGroupId_name: { yearGroupId, name } },
  });
  if (existing) return { error: "Class already exists in this year group" };

  await prisma.classGroup.create({ data: { name, yearGroupId, schoolId: session.schoolId } });
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function deleteClassGroup(id: string) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized." };

  const classGroup = await prisma.classGroup.findUnique({
    where: { id },
    select: { schoolId: true },
  });
  if (!classGroup || classGroup.schoolId !== session.schoolId) {
    return { error: "Class not found." };
  }

  await prisma.classGroup.delete({ where: { id } });
  revalidatePath("/admin/settings");
  return { success: true };
}
