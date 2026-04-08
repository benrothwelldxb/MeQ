"use server";

import { prisma } from "@/lib/db";
import { getAdminSession, getTeacherSession, getSuperAdminSession } from "@/lib/session";
import { compareSync, hashSync } from "bcryptjs";

export async function changeAdminPassword(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Not authenticated." };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword) return { error: "Please fill in all fields." };
  if (newPassword.length < 6) return { error: "New password must be at least 6 characters." };
  if (newPassword !== confirmPassword) return { error: "Passwords do not match." };

  const admin = await prisma.admin.findUnique({ where: { id: session.adminId } });
  if (!admin || !compareSync(currentPassword, admin.passwordHash)) {
    return { error: "Current password is incorrect." };
  }

  // Update ALL admin records for this email (multi-campus sync)
  await prisma.admin.updateMany({
    where: { email: admin.email },
    data: { passwordHash: hashSync(newPassword, 10) },
  });

  return { success: true };
}

export async function changeTeacherPassword(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const session = await getTeacherSession();
  if (!session.teacherId) return { error: "Not authenticated." };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword) return { error: "Please fill in all fields." };
  if (newPassword.length < 6) return { error: "New password must be at least 6 characters." };
  if (newPassword !== confirmPassword) return { error: "Passwords do not match." };

  const teacher = await prisma.teacher.findUnique({ where: { id: session.teacherId } });
  if (!teacher || !compareSync(currentPassword, teacher.passwordHash)) {
    return { error: "Current password is incorrect." };
  }

  await prisma.teacher.update({
    where: { id: session.teacherId },
    data: { passwordHash: hashSync(newPassword, 10) },
  });

  return { success: true };
}

export async function changeSuperAdminPassword(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const session = await getSuperAdminSession();
  if (!session.superAdminId) return { error: "Not authenticated." };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword) return { error: "Please fill in all fields." };
  if (newPassword.length < 6) return { error: "New password must be at least 6 characters." };
  if (newPassword !== confirmPassword) return { error: "Passwords do not match." };

  const superAdmin = await prisma.superAdmin.findUnique({ where: { id: session.superAdminId } });
  if (!superAdmin || !compareSync(currentPassword, superAdmin.passwordHash)) {
    return { error: "Current password is incorrect." };
  }

  await prisma.superAdmin.update({
    where: { id: session.superAdminId },
    data: { passwordHash: hashSync(newPassword, 10) },
  });

  return { success: true };
}
