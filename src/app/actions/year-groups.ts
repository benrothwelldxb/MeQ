"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createYearGroup(formData: FormData) {
  const session = await getAdminSession();
  const name = (formData.get("name") as string)?.trim();
  const tier = (formData.get("tier") as string) || "standard";
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

  if (!name) return { error: "Name is required" };

  const existing = await prisma.yearGroup.findFirst({
    where: { schoolId: session.schoolId, name },
  });
  if (existing) return { error: "Year group already exists" };

  await prisma.yearGroup.create({ data: { name, tier, sortOrder, schoolId: session.schoolId } });
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function deleteYearGroup(id: string) {
  const session = await getAdminSession();
  try {
    // Verify ownership
    const yearGroup = await prisma.yearGroup.findFirst({
      where: { id, schoolId: session.schoolId },
    });
    if (!yearGroup) return { error: "Year group not found." };

    // Unlink students from this year group before deleting
    await prisma.student.updateMany({
      where: { yearGroupId: id },
      data: { yearGroupId: null },
    });
    // Classes cascade-delete via schema, but unlink students from those classes too
    const classes = await prisma.classGroup.findMany({ where: { yearGroupId: id } });
    if (classes.length > 0) {
      await prisma.student.updateMany({
        where: { classGroupId: { in: classes.map((c) => c.id) } },
        data: { classGroupId: null },
      });
    }
    await prisma.yearGroup.delete({ where: { id } });
    revalidatePath("/admin/settings");
    return { success: true };
  } catch {
    return { error: "Could not delete year group." };
  }
}

export async function getYearGroups(schoolId: string) {
  return prisma.yearGroup.findMany({
    where: { schoolId },
    orderBy: { sortOrder: "asc" },
    include: { classes: { orderBy: { name: "asc" } } },
  });
}
