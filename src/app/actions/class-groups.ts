"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createClassGroup(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const yearGroupId = formData.get("yearGroupId") as string;

  if (!name || !yearGroupId) return { error: "Name and year group are required" };

  const existing = await prisma.classGroup.findUnique({
    where: { yearGroupId_name: { yearGroupId, name } },
  });
  if (existing) return { error: "Class already exists in this year group" };

  await prisma.classGroup.create({ data: { name, yearGroupId } });
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function deleteClassGroup(id: string) {
  await prisma.classGroup.delete({ where: { id } });
  revalidatePath("/admin/settings");
}
