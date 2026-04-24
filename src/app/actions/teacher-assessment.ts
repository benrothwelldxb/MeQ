"use server";

import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { getSchoolSettings } from "@/lib/school";
import { calculateTeacherDomainScores, getTeacherLevel } from "@/lib/teacher-scoring";
import { parseNumberRecord } from "@/lib/json";

export async function saveTeacherAnswers(
  studentId: string,
  answers: Record<string, number>
) {
  const session = await getTeacherSession();
  if (!session.teacherId) return { error: "Not logged in" };

  const school = await getSchoolSettings(session.schoolId);
  const { currentTerm, academicYear } = school;

  await prisma.teacherAssessment.upsert({
    where: {
      teacherId_studentId_term_academicYear: {
        teacherId: session.teacherId,
        studentId,
        term: currentTerm,
        academicYear,
      },
    },
    update: {
      answers: JSON.stringify(answers),
    },
    create: {
      teacherId: session.teacherId,
      studentId,
      term: currentTerm,
      academicYear,
      answers: JSON.stringify(answers),
    },
  });

  return { ok: true };
}

export async function submitTeacherAssessments(classGroupId: string) {
  const session = await getTeacherSession();
  if (!session.teacherId) return { error: "Not logged in" };

  const school = await getSchoolSettings(session.schoolId);
  const { currentTerm, academicYear } = school;

  const questions = await prisma.teacherQuestion.findMany({
    orderBy: { orderIndex: "asc" },
  });

  // Find all in-progress teacher assessments for this class
  const students = await prisma.student.findMany({
    where: { classGroupId },
    select: { id: true },
  });
  const studentIds = students.map((s) => s.id);

  const assessments = await prisma.teacherAssessment.findMany({
    where: {
      teacherId: session.teacherId,
      studentId: { in: studentIds },
      term: currentTerm,
      academicYear,
      status: "in_progress",
    },
  });

  for (const ta of assessments) {
    const answers = parseNumberRecord(ta.answers);
    const answeredCount = Object.keys(answers).length;

    // Only submit if all 10 questions answered
    if (answeredCount < questions.length) continue;

    const domainScores = calculateTeacherDomainScores(answers, questions);

    const domainLevels: Record<string, string> = {};
    for (const [key, score] of Object.entries(domainScores)) {
      domainLevels[key] = getTeacherLevel(score);
    }

    await prisma.teacherAssessment.update({
      where: { id: ta.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        domainScoresJson: JSON.stringify(domainScores),
        domainLevelsJson: JSON.stringify(domainLevels),
      },
    });
  }

  return { ok: true, submitted: assessments.length };
}
