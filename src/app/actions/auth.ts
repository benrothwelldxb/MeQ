"use server";

import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { getSchoolSettings } from "@/lib/school";
import { loginCodeSchema } from "@/lib/validation";
import { isLockedOut, recordFailedLogin, clearFailedLogins, formatLockoutMessage } from "@/lib/security";
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

  // Rate limit: 5 failed attempts per code within 15 minutes locks it out for 15 minutes.
  // Keyed by the code (not an email) so an attacker can't tie up a different student.
  const lockout = await isLockedOut(parsed.data, "student");
  if (lockout.locked && lockout.unlocksAt) {
    return { error: formatLockoutMessage(lockout.unlocksAt) };
  }

  const student = await prisma.student.findUnique({
    where: { loginCode: parsed.data },
  });

  if (!student) {
    await recordFailedLogin(parsed.data, "student");
    return { error: "We couldn't find that code. Please check and try again." };
  }

  await clearFailedLogins(parsed.data, "student");

  // Get current term from student's school settings
  const school = await getSchoolSettings(student.schoolId);
  const { currentTerm, academicYear } = school;

  // Priority 1: Check for active custom surveys the student hasn't completed.
  // Custom surveys take priority over the framework assessment so admins
  // can run quick targeted surveys without requiring the full assessment first.
  const hasPendingSurveys = await findPendingSurvey(student);
  if (hasPendingSurveys) {
    const existingAssessment = await prisma.assessment.findUnique({
      where: {
        studentId_term_academicYear: {
          studentId: student.id,
          term: currentTerm,
          academicYear,
        },
      },
    });

    const session = await getStudentSession();
    session.studentId = student.id;
    session.assessmentId = existingAssessment?.id || "";
    session.firstName = student.displayName || student.firstName;
    session.tier = student.tier;
    await session.save();
    // /surveys page handles single vs multiple — redirects directly if only one
    redirect("/surveys");
  }

  // Priority 2: Framework assessment
  let assessment = await prisma.assessment.findUnique({
    where: {
      studentId_term_academicYear: {
        studentId: student.id,
        term: currentTerm,
        academicYear,
      },
    },
  });

  // Get the school's framework. The calendar's AssessmentWindow is now the
  // primary source of truth for "is the full survey live right now"; we fall
  // back to the framework's activeTerms list for schools that haven't set up
  // a calendar yet.
  const { getSchoolFramework } = await import("@/lib/framework");
  const fw = await getSchoolFramework(student.schoolId);
  const today = new Date();
  const calendarWindow = await prisma.assessmentWindow.findFirst({
    where: {
      schoolId: student.schoolId,
      academicYear,
      termKey: currentTerm,
      openAt: { lte: today },
      closeAt: { gte: today },
    },
    select: { id: true },
  });
  const assessmentActive = calendarWindow !== null || fw.activeTerms.includes(currentTerm);

  if (assessment) {
    if (assessment.status === "completed") {
      // Student has finished this term — let them back in to view their own
      // history. The dashboard is read-only; their individual data stays
      // scoped to their session.
      const session = await getStudentSession();
      session.studentId = student.id;
      session.assessmentId = assessment.id;
      session.firstName = student.displayName || student.firstName;
      session.tier = student.tier;
      await session.save();
      redirect("/my-wellbeing");
    }
    // Resume in-progress assessment
  } else if (assessmentActive) {
    // Create new assessment for current term. Reduced mode is now per-tier
    // so a school can shorten the junior version while keeping the full set
    // for standard tier (or vice versa).
    const isReduced = student.tier === "junior" ? school.reducedJunior : school.reducedStandard;
    assessment = await prisma.assessment.create({
      data: {
        studentId: student.id,
        tier: student.tier,
        term: currentTerm,
        academicYear,
        isReduced,
        frameworkId: fw.id,
      },
    });
  }
  // If no assessment and the framework's schedule says none is due this term,
  // the student should still be able to land on the app — either for pulse (if
  // enabled) or the always-available check-in fallback. No early-return here.

  const session = await getStudentSession();
  session.studentId = student.id;
  session.assessmentId = assessment?.id || "";
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

  // If no assessment is active (term inactive or pulse already done this week),
  // still give the student a place to land — the always-available check-in page.
  if (!assessment) {
    redirect("/check-in");
  }

  redirect("/quiz");
}

/** Find an active custom survey the student hasn't completed yet. */
async function findPendingSurvey(student: {
  id: string;
  schoolId: string;
  yearGroupId: string | null;
  classGroupId: string | null;
}) {
  const activeSurveys = await prisma.survey.findMany({
    where: { schoolId: student.schoolId, status: "active" },
    select: {
      id: true,
      targetType: true,
      targetIds: true,
      allowRetake: true,
    },
  });

  for (const survey of activeSurveys) {
    // Check targeting
    const targetIds: string[] = JSON.parse(survey.targetIds);
    if (survey.targetType === "year_group" && student.yearGroupId && !targetIds.includes(student.yearGroupId)) {
      continue;
    }
    if (survey.targetType === "class" && student.classGroupId && !targetIds.includes(student.classGroupId)) {
      continue;
    }

    // Check if already completed
    if (!survey.allowRetake) {
      const existing = await prisma.surveyResponse.findFirst({
        where: { surveyId: survey.id, studentId: student.id },
      });
      if (existing) continue;
    }

    return survey;
  }

  return null;
}
