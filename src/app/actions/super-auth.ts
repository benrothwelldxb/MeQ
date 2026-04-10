"use server";

import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/session";
import { isLockedOut, recordFailedLogin, clearFailedLogins, formatLockoutMessage } from "@/lib/security";
import { compareSync } from "bcryptjs";
import { redirect } from "next/navigation";

export async function loginSuperAdmin(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter email and password." };
  }

  const lockout = await isLockedOut(email, "super");
  if (lockout.locked && lockout.unlocksAt) {
    return { error: formatLockoutMessage(lockout.unlocksAt) };
  }

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { email },
  });

  if (!superAdmin || !compareSync(password, superAdmin.passwordHash)) {
    await recordFailedLogin(email, "super");
    return { error: "Invalid credentials." };
  }

  await clearFailedLogins(email, "super");

  const session = await getSuperAdminSession();
  session.superAdminId = superAdmin.id;
  session.email = superAdmin.email;
  await session.save();

  redirect("/super");
}

export async function logoutSuperAdmin() {
  const session = await getSuperAdminSession();
  session.destroy();
  redirect("/super/login");
}
