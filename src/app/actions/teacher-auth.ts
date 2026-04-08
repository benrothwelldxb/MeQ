"use server";

import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { teacherLoginSchema } from "@/lib/validation";
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

  const teacher = await prisma.teacher.findUnique({
    where: { email: parsed.data.email },
  });

  if (!teacher || !compareSync(parsed.data.password, teacher.passwordHash)) {
    return { error: "Invalid email or password." };
  }

  const session = await getTeacherSession();
  session.teacherId = teacher.id;
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
