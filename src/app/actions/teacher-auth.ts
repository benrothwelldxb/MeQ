"use server";

import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { teacherLoginSchema } from "@/lib/validation";
import { isLockedOut, recordFailedLogin, clearFailedLogins, formatLockoutMessage } from "@/lib/security";
import { compareSync } from "bcryptjs";
import { redirect } from "next/navigation";

export async function loginTeacher(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const parsed = teacherLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Please enter a valid email and password." };
  }

  const email = parsed.data.email.toLowerCase();

  const lockout = await isLockedOut(email, "teacher");
  if (lockout.locked && lockout.unlocksAt) {
    return { error: formatLockoutMessage(lockout.unlocksAt) };
  }

  const teacher = await prisma.teacher.findUnique({
    where: { email },
  });

  if (!teacher || !compareSync(parsed.data.password, teacher.passwordHash)) {
    await recordFailedLogin(email, "teacher");
    return { error: "Invalid email or password." };
  }

  await clearFailedLogins(email, "teacher");

  await prisma.teacher.update({
    where: { id: teacher.id },
    data: { lastLoginAt: new Date() },
  });

  const session = await getTeacherSession();
  session.teacherId = teacher.id;
  session.schoolId = teacher.schoolId;
  session.email = teacher.email;
  session.firstName = teacher.firstName;
  await session.save();

  redirect("/teacher");
}

export async function logoutTeacher() {
  const session = await getTeacherSession();
  session.destroy();
  redirect("/teacher/login");
}
