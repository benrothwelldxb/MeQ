"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { compareSync } from "bcryptjs";
import { redirect } from "next/navigation";

export async function loginAdmin(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter email and password." };
  }

  const admin = await prisma.admin.findUnique({
    where: { email },
    include: { school: true },
  });

  if (!admin || !compareSync(password, admin.passwordHash)) {
    return { error: "Invalid email or password." };
  }

  if (!admin.school.isActive) {
    return { error: "This school account is not currently active." };
  }

  const session = await getAdminSession();
  session.adminId = admin.id;
  session.schoolId = admin.schoolId;
  session.email = admin.email;
  await session.save();

  redirect("/admin");
}

export async function logoutAdmin() {
  const session = await getAdminSession();
  session.destroy();
  redirect("/admin/login");
}
