"use server";

import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/session";
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

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { email },
  });

  if (!superAdmin || !compareSync(password, superAdmin.passwordHash)) {
    return { error: "Invalid credentials." };
  }

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
