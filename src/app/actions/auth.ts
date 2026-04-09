"use server";

import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { getSchoolSettings } from "@/lib/school";
import { loginCodeSchema } from "@/lib/validation";
import { redirect } from "next/navigation";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

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

  // Get current term from student's school settings
  const school = await getSchoolSettings(student.schoolId);
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
        isReduced: school.reducedQuestions,
      },
    });
  }

  const session = await getStudentSession();
  session.studentId = student.id;
  session.assessmentId = assessment.id;
  session.firstName = student.displayName || student.firstName;
  session.tier = student.tier;
  await session.save();

  // Check if pulse check-in is needed this week
  if (school.pulseEnabled) {
    const weekOf = getMonday(new Date());
    const existingPulse = await prisma.pulseCheck.findUnique({
      where: { studentId_weekOf: { studentId: student.id, weekOf } },
    });
    if (!existingPulse || !existingPulse.completedAt) {
      redirect("/pulse");
    }
  }

  redirect("/quiz");
}
