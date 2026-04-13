"use server";

import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/session";
import { hashSync } from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function addSuperAdmin(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const session = await getSuperAdminSession();
  if (!session.superAdminId) return { error: "Unauthorized." };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const existing = await prisma.superAdmin.findUnique({ where: { email } });
  if (existing) return { error: "A super admin with this email already exists." };

  // Create with empty password hash — they can sign in via Google SSO
  // or set a password later
  const password = formData.get("password") as string;
  const passwordHash = password ? hashSync(password, 10) : "";

  await prisma.superAdmin.create({
    data: { email, passwordHash },
  });

  revalidatePath("/super/settings");
  return { success: true };
}

export async function removeSuperAdmin(superAdminId: string) {
  const session = await getSuperAdminSession();
  if (!session.superAdminId) return { error: "Unauthorized." };

  // Prevent removing yourself
  if (session.superAdminId === superAdminId) {
    return { error: "You cannot remove yourself." };
  }

  // Ensure at least one super admin remains
  const count = await prisma.superAdmin.count();
  if (count <= 1) return { error: "Cannot remove the last super admin." };

  await prisma.superAdmin.delete({ where: { id: superAdminId } });
  revalidatePath("/super/settings");
  return { success: true };
}
