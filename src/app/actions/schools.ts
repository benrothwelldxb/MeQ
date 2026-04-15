"use server";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/security";
import { revalidatePath } from "next/cache";
import { sendAdminWelcomeEmail } from "@/lib/email";

export async function createSchool(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const adminEmail = (formData.get("adminEmail") as string)?.trim().toLowerCase();
  const adminPassword = formData.get("adminPassword") as string;
  const authMode = (formData.get("authMode") as string) || "both";

  if (!name || !slug || !adminEmail) {
    return { error: "School name, slug, and admin email are required." };
  }
  if (!["password", "sso", "both"].includes(authMode)) {
    return { error: "Invalid sign-in method." };
  }
  if (authMode === "password" && !adminPassword) {
    return { error: "A password is required when sign-in method is password-only." };
  }

  const existingSlug = await prisma.school.findUnique({ where: { slug } });
  if (existingSlug) return { error: "A school with this slug already exists." };

  const school = await prisma.school.create({
    data: { name, slug, authMode },
  });

  // If this email already exists as an admin elsewhere, reuse their password hash
  const existingAdmin = await prisma.admin.findFirst({ where: { email: adminEmail } });
  const passwordHash = existingAdmin
    ? existingAdmin.passwordHash
    : adminPassword ? hashPassword(adminPassword) : "";

  await prisma.admin.create({
    data: {
      email: adminEmail,
      passwordHash,
      schoolId: school.id,
    },
  });

  // Create default year groups for new school
  const defaultYearGroups = [
    { name: "FS2", sortOrder: 0, tier: "junior" },
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

  await sendAdminWelcomeEmail({
    email: adminEmail,
    schoolName: name,
    hasPassword: authMode !== "sso" && !!adminPassword,
  });

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
