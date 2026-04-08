"use server";

import { prisma } from "@/lib/db";
import { hashSync } from "bcryptjs";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function requestPasswordReset(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const userType = formData.get("userType") as string;

  if (!email) {
    return { error: "Please enter your email address." };
  }

  // Check user exists (don't reveal whether they do)
  let userExists = false;
  if (userType === "admin") {
    userExists = (await prisma.admin.count({ where: { email } })) > 0;
  } else if (userType === "teacher") {
    userExists = (await prisma.teacher.count({ where: { email } })) > 0;
  } else if (userType === "super") {
    userExists = (await prisma.superAdmin.count({ where: { email } })) > 0;
  }

  if (userExists) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, email, userType, expiresAt },
    });

    await sendPasswordResetEmail(email, token, userType);
  }

  // Always return success to prevent email enumeration
  return { success: true };
}

export async function resetPassword(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) {
    return { error: "Invalid reset link." };
  }

  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { error: "This reset link has expired or already been used." };
  }

  const passwordHash = hashSync(password, 10);

  if (resetToken.userType === "admin") {
    // Update ALL admin records for this email (multi-campus sync)
    await prisma.admin.updateMany({
      where: { email: resetToken.email },
      data: { passwordHash },
    });
  } else if (resetToken.userType === "teacher") {
    await prisma.teacher.update({
      where: { email: resetToken.email },
      data: { passwordHash },
    });
  } else if (resetToken.userType === "super") {
    await prisma.superAdmin.update({
      where: { email: resetToken.email },
      data: { passwordHash },
    });
  }

  // Mark token as used
  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { usedAt: new Date() },
  });

  return { success: true };
}
