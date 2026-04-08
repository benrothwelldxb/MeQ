"use server";

import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { getSchoolSettings } from "@/lib/school";
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

  // Get current term from school settings
  const school = await getSchoolSettings();
  const { currentTerm, academicYear } = school;

  // Check for existing assessment for this term
  let assessment = await prisma.assessment.findUnique({
    where: {
      studentId_term_academicYear: {
        studentId: student.id,
        term: currentTerm,
        academicYear,
      },
    },
  });

  if (assessment) {
    if (assessment.status === "completed") {
      return {
        error: "You've already completed your assessment for this term. Thank you!",
      };
    }
    // Resume in-progress assessment
  } else {
    // Create new assessment for current term
    assessment = await prisma.assessment.create({
      data: {
        studentId: student.id,
        tier: student.tier,
        term: currentTerm,
        academicYear,
      },
    });
  }

  const session = await getStudentSession();
  session.studentId = student.id;
  session.assessmentId = assessment.id;
  session.firstName = student.displayName || student.firstName;
  session.tier = student.tier;
  await session.save();

  redirect("/quiz");
}
