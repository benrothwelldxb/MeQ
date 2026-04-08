"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createYearGroup(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const tier = (formData.get("tier") as string) || "standard";
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

  if (!name) return { error: "Name is required" };

  const existing = await prisma.yearGroup.findUnique({ where: { name } });
  if (existing) return { error: "Year group already exists" };

  await prisma.yearGroup.create({ data: { name, tier, sortOrder } });
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function deleteYearGroup(id: string) {
  await prisma.yearGroup.delete({ where: { id } });
  revalidatePath("/admin/settings");
}

export async function getYearGroups() {
  return prisma.yearGroup.findMany({
    orderBy: { sortOrder: "asc" },
    include: { classes: { orderBy: { name: "asc" } } },
  });
}
