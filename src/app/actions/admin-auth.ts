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

  const admins = await prisma.admin.findMany({
    where: { email },
    include: { school: true },
  });

  if (admins.length === 0) {
    return { error: "Invalid email or password." };
  }

  if (!compareSync(password, admins[0].passwordHash)) {
    return { error: "Invalid email or password." };
  }

  const activeAdmins = admins.filter((a) => a.school.isActive);
  if (activeAdmins.length === 0) {
    return { error: "No active school accounts found for this email." };
  }

  const session = await getAdminSession();

  if (activeAdmins.length === 1) {
    session.adminId = activeAdmins[0].id;
    session.schoolId = activeAdmins[0].schoolId;
    session.email = activeAdmins[0].email;
    session.pendingEmail = undefined;
    await session.save();
    redirect("/admin");
  }

  // Multiple campuses — let them choose
  session.pendingEmail = email;
  session.adminId = undefined as unknown as string;
  session.schoolId = undefined as unknown as string;
  session.email = undefined as unknown as string;
  await session.save();
  redirect("/admin/choose-campus");
}

export async function selectCampus(schoolId: string) {
  const session = await getAdminSession();
  const email = session.pendingEmail || session.email;

  if (!email) {
    redirect("/admin/login");
  }

  const admin = await prisma.admin.findUnique({
    where: { email_schoolId: { email, schoolId } },
    include: { school: true },
  });

  if (!admin || !admin.school.isActive) {
    redirect("/admin/login");
  }

  session.adminId = admin.id;
  session.schoolId = admin.schoolId;
  session.email = admin.email;
  session.pendingEmail = undefined;
  await session.save();
  redirect("/admin");
}

export async function logoutAdmin() {
  const session = await getAdminSession();
  session.destroy();
  redirect("/admin/login");
}
