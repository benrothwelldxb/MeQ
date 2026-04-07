"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { adminLoginSchema } from "@/lib/validation";
import { compareSync } from "bcryptjs";
import { redirect } from "next/navigation";

export async function loginAdmin(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const parsed = adminLoginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Please enter username and password." };
  }

  const admin = await prisma.admin.findUnique({
    where: { username: parsed.data.username },
  });

  if (!admin || !compareSync(parsed.data.password, admin.passwordHash)) {
    return { error: "Invalid username or password." };
  }

  const session = await getAdminSession();
  session.adminId = admin.id;
  session.username = admin.username;
  await session.save();

  redirect("/admin");
}

export async function logoutAdmin() {
  const session = await getAdminSession();
  session.destroy();
  redirect("/admin/login");
}
