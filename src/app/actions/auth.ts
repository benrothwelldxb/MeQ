"use server";

import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { loginCodeSchema } from "@/lib/validation";
import { redirect } from "next/navigation";

export async function loginStudent(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const code = (formData.get("code") as string)?.toUpperCase().trim();

  const parsed = loginCodeSchema.safeParse(code);
  if (!parsed.success) {
    return { error: "Please enter a valid 8-character code." };
  }

  const student = await prisma.student.findUnique({
    where: { loginCode: parsed.data },
  });

  if (!student) {
    return { error: "We couldn't find that code. Please check and try again." };
  }

  // Find existing in-progress assessment or create one
  let assessment = await prisma.assessment.findFirst({
    where: { studentId: student.id, status: "in_progress" },
  });

  if (!assessment) {
    // Check if already completed
    const completed = await prisma.assessment.findFirst({
      where: { studentId: student.id, status: "completed" },
    });

    if (completed) {
      return { error: "You've already completed your assessment. Thank you!" };
    }

    assessment = await prisma.assessment.create({
      data: { studentId: student.id },
    });
  }

  const session = await getStudentSession();
  session.studentId = student.id;
  session.assessmentId = assessment.id;
  session.firstName = student.displayName || student.firstName;
  await session.save();

  redirect("/quiz");
}
