"use server";

import { prisma } from "@/lib/db";
import { hashSync } from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createSchool(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const adminEmail = (formData.get("adminEmail") as string)?.trim().toLowerCase();
  const adminPassword = formData.get("adminPassword") as string;

  if (!name || !slug || !adminEmail || !adminPassword) {
    return { error: "All fields are required." };
  }

  const existingSlug = await prisma.school.findUnique({ where: { slug } });
  if (existingSlug) return { error: "A school with this slug already exists." };

  const existingEmail = await prisma.admin.findUnique({ where: { email: adminEmail } });
  if (existingEmail) return { error: "An admin with this email already exists." };

  const school = await prisma.school.create({
    data: { name, slug },
  });

  await prisma.admin.create({
    data: {
      email: adminEmail,
      passwordHash: hashSync(adminPassword, 10),
      schoolId: school.id,
    },
  });

  // Create default year groups for new school
  const defaultYearGroups = [
    { name: "Reception", sortOrder: 0, tier: "junior" },
    { name: "Year 1", sortOrder: 1, tier: "junior" },
    { name: "Year 2", sortOrder: 2, tier: "junior" },
    { name: "Year 3", sortOrder: 3, tier: "standard" },
    { name: "Year 4", sortOrder: 4, tier: "standard" },
    { name: "Year 5", sortOrder: 5, tier: "standard" },
    { name: "Year 6", sortOrder: 6, tier: "standard" },
  ];

  for (const yg of defaultYearGroups) {
    await prisma.yearGroup.create({
      data: { ...yg, schoolId: school.id },
    });
  }

  revalidatePath("/super");
  return { success: true, schoolId: school.id };
}

export async function toggleSchoolActive(schoolId: string, isActive: boolean) {
  await prisma.school.update({
    where: { id: schoolId },
    data: { isActive },
  });
  revalidatePath("/super");
}
