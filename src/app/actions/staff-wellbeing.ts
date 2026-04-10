"use server";

import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { getSchoolFramework, getLevelFromThresholds } from "@/lib/framework";
import { calculateFrameworkDomainScores } from "@/lib/scoring";
import { redirect } from "next/navigation";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function startStaffAssessment() {
  const session = await getTeacherSession();
  if (!session.teacherId) redirect("/teacher/login");

  const teacher = await prisma.teacher.findUnique({
    where: { id: session.teacherId },
    include: { school: true },
  });
  if (!teacher) redirect("/teacher/login");

  if (!teacher.school.staffWellbeingEnabled) {
    return { error: "Staff wellbeing is not enabled for this school." };
  }

  const framework = await getSchoolFramework(teacher.schoolId);
  const { currentTerm, academicYear } = teacher.school;

  let assessment = await prisma.staffAssessment.findUnique({
    where: {
      teacherId_term_academicYear: {
        teacherId: teacher.id,
        term: currentTerm,
        academicYear,
      },
    },
  });

  if (!assessment) {
    assessment = await prisma.staffAssessment.create({
      data: {
        teacherId: teacher.id,
        frameworkId: framework.id,
        term: currentTerm,
        academicYear,
      },
    });
  }

  return { assessmentId: assessment.id, status: assessment.status };
}

export async function saveStaffAnswer(assessmentId: string, questionNum: number, value: number) {
  const session = await getTeacherSession();
  if (!session.teacherId) return { error: "Not logged in" };

  const assessment = await prisma.staffAssessment.findUnique({
    where: { id: assessmentId },
  });
  if (!assessment || assessment.teacherId !== session.teacherId) {
    return { error: "Not your assessment" };
  }
  if (assessment.status !== "in_progress") {
    return { error: "Assessment already completed" };
  }

  const answers = JSON.parse(assessment.answers) as Record<string, number>;
  answers[String(questionNum)] = value;

  await prisma.staffAssessment.update({
    where: { id: assessmentId },
    data: { answers: JSON.stringify(answers) },
  });

  return { ok: true };
}

export async function submitStaffAssessment(assessmentId: string) {
  const session = await getTeacherSession();
  if (!session.teacherId) return;

  const assessment = await prisma.staffAssessment.findUnique({
    where: { id: assessmentId },
    include: { teacher: true },
  });
  if (!assessment || assessment.teacherId !== session.teacherId) return;
  if (assessment.status !== "in_progress") return;

  const framework = await getSchoolFramework(assessment.teacher.schoolId);
  const scoringModel = framework.scoringModels["standard"];

  // Load staff questions
  const questions = await prisma.frameworkQuestion.findMany({
    where: { frameworkId: framework.id, audience: "staff" },
    orderBy: { orderIndex: "asc" },
  });

  const answers = JSON.parse(assessment.answers) as Record<string, number>;
  const domainKeys = framework.domains.map((d) => d.key);

  const domainScores = calculateFrameworkDomainScores(
    answers,
    questions.map((q) => ({
      orderIndex: q.orderIndex,
      domainKey: q.domainKey,
      type: q.type,
      weight: q.weight,
      scoreMap: q.scoreMap,
    })),
    domainKeys
  );

  const totalScore = Math.round(
    Object.values(domainScores).reduce((s, v) => s + v, 0) * 10
  ) / 10;

  const domainThresholds = scoringModel?.thresholds || [];
  const overallThresholds = scoringModel?.overallThresholds || [];

  const domainLevels: Record<string, string> = {};
  for (const key of domainKeys) {
    domainLevels[key] = getLevelFromThresholds(domainScores[key] || 0, domainThresholds);
  }
  const overallLevel = getLevelFromThresholds(totalScore, overallThresholds);

  await prisma.staffAssessment.update({
    where: { id: assessmentId },
    data: {
      status: "completed",
      completedAt: new Date(),
      totalScore,
      overallLevel,
      domainScoresJson: JSON.stringify(domainScores),
      domainLevelsJson: JSON.stringify(domainLevels),
    },
  });

  redirect("/teacher/wellbeing/done");
}

export async function saveStaffPulseAnswer(domain: string, value: number) {
  const session = await getTeacherSession();
  if (!session.teacherId) return;

  const weekOf = getMonday(new Date());

  const existing = await prisma.staffPulseCheck.findUnique({
    where: { teacherId_weekOf: { teacherId: session.teacherId, weekOf } },
  });

  const answers = existing ? JSON.parse(existing.answers) as Record<string, number> : {};
  answers[domain] = value;

  await prisma.staffPulseCheck.upsert({
    where: { teacherId_weekOf: { teacherId: session.teacherId, weekOf } },
    update: { answers: JSON.stringify(answers) },
    create: {
      teacherId: session.teacherId,
      weekOf,
      answers: JSON.stringify(answers),
    },
  });
}

export async function submitStaffPulse(freeText?: string) {
  const session = await getTeacherSession();
  if (!session.teacherId) return;

  const weekOf = getMonday(new Date());

  await prisma.staffPulseCheck.update({
    where: { teacherId_weekOf: { teacherId: session.teacherId, weekOf } },
    data: { completedAt: new Date(), freeText: freeText || null },
  });

  redirect("/teacher/wellbeing");
}
