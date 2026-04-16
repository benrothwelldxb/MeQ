"use server";

import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { parseNumberRecord } from "@/lib/json";
import { redirect } from "next/navigation";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getLevelFromThresholds(score: number, thresholds: Array<{ level: string; min: number }>): string {
  for (const { level, min } of thresholds) {
    if (score >= min) return level;
  }
  return thresholds[thresholds.length - 1]?.level || "Emerging";
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

  const answers = parseNumberRecord(assessment.answers);
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
  });
  if (!assessment || assessment.teacherId !== session.teacherId) return;
  if (assessment.status !== "in_progress") return;

  // Load all staff questions with their domains
  const questions = await prisma.staffQuestion.findMany({
    include: { domain: true },
    orderBy: { orderIndex: "asc" },
  });

  const answers = parseNumberRecord(assessment.answers);

  // Calculate per-domain scores
  const domainScores: Record<string, number> = {};
  const domainMap: Record<string, string> = {}; // key -> label
  for (const q of questions) {
    if (!domainScores[q.domain.key]) {
      domainScores[q.domain.key] = 0;
      domainMap[q.domain.key] = q.domain.label;
    }
    const answer = answers[String(q.orderIndex)];
    if (answer === undefined) continue;
    const scoreMap = parseNumberRecord(q.scoreMap);
    const mapped = scoreMap[String(answer)] ?? answer;
    domainScores[q.domain.key] += mapped * q.weight;
  }

  // Round scores
  for (const key of Object.keys(domainScores)) {
    domainScores[key] = Math.round(domainScores[key] * 10) / 10;
  }

  const totalScore = Math.round(
    Object.values(domainScores).reduce((s, v) => s + v, 0) * 10
  ) / 10;

  // Load scoring config
  const config = await prisma.staffScoringConfig.findUnique({ where: { key: "default" } });
  const domainThresholds = config ? JSON.parse(config.thresholds) : [];
  const overallThresholds = config ? JSON.parse(config.overallThresholds) : [];

  const domainLevels: Record<string, string> = {};
  for (const key of Object.keys(domainScores)) {
    domainLevels[key] = getLevelFromThresholds(domainScores[key], domainThresholds);
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

  const answers = existing ? parseNumberRecord(existing.answers) : {};
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
