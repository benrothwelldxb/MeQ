"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { sendAdminWelcomeEmail } from "@/lib/email";
import { hashSync } from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function addSchoolAdmin(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized." };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string) || "";

  if (!email) return { error: "Email is required." };

  const school = await prisma.school.findUnique({
    where: { id: session.schoolId },
    select: { name: true, authMode: true },
  });
  if (!school) return { error: "School not found." };

  if (school.authMode === "password" && !password) {
    return { error: "A password is required for this school." };
  }

  // Don't allow duplicate admin emails on the same school
  const existing = await prisma.admin.findFirst({
    where: { email, schoolId: session.schoolId },
  });
  if (existing) return { error: "An admin with this email already exists at this school." };

  // If the email exists as an admin elsewhere, reuse their password hash
  // so they have a single password across schools (multi-campus pattern).
  const elsewhere = await prisma.admin.findFirst({ where: { email } });
  const passwordHash = elsewhere
    ? elsewhere.passwordHash
    : password ? hashSync(password, 10) : "";

  await prisma.admin.create({
    data: { email, passwordHash, schoolId: session.schoolId },
  });

  try {
    await sendAdminWelcomeEmail({
      email,
      schoolName: school.name,
      hasPassword: school.authMode !== "sso" && !!password,
    });
  } catch (err) {
    console.error(`Failed to send admin welcome email to ${email}:`, err);
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function removeSchoolAdmin(adminId: string) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized." };

  if (session.adminId === adminId) {
    return { error: "You cannot remove yourself." };
  }

  // Ensure the admin being removed is at the same school
  const target = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { schoolId: true },
  });
  if (!target || target.schoolId !== session.schoolId) {
    return { error: "Admin not found." };
  }

  // Don't allow removing the last admin from a school
  const count = await prisma.admin.count({ where: { schoolId: session.schoolId } });
  if (count <= 1) return { error: "Cannot remove the last admin from this school." };

  await prisma.admin.delete({ where: { id: adminId } });
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function resendAdminWelcome(adminId: string) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized." };

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    include: { school: { select: { name: true, authMode: true } } },
  });
  if (!admin || admin.schoolId !== session.schoolId) {
    return { error: "Admin not found." };
  }

  try {
    await sendAdminWelcomeEmail({
      email: admin.email,
      schoolName: admin.school.name,
      hasPassword: admin.school.authMode !== "sso" && !!admin.passwordHash,
    });
    return { success: true };
  } catch (err) {
    console.error(`Failed to resend admin welcome to ${admin.email}:`, err);
    return { error: (err as Error).message || "Failed to send email." };
  }
}
