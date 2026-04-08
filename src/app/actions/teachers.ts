"use server";

import { prisma } from "@/lib/db";
import { hashSync } from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createTeacher(formData: FormData) {
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const classGroupIds = formData.getAll("classGroupIds") as string[];

  if (!firstName || !lastName || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const existing = await prisma.teacher.findUnique({ where: { email } });
  if (existing) return { error: "A teacher with this email already exists." };

  await prisma.teacher.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash: hashSync(password, 10),
      classes: classGroupIds.length > 0
        ? { connect: classGroupIds.map((id) => ({ id })) }
        : undefined,
    },
  });

  revalidatePath("/admin/teachers");
  return { success: true };
}

export async function deleteTeacher(teacherId: string) {
  await prisma.teacherAssessment.deleteMany({ where: { teacherId } });
  await prisma.teacher.delete({ where: { id: teacherId } });
  revalidatePath("/admin/teachers");
}

export async function updateTeacherClasses(teacherId: string, classGroupIds: string[]) {
  await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      classes: { set: classGroupIds.map((id) => ({ id })) },
    },
  });
  revalidatePath("/admin/teachers");
}
