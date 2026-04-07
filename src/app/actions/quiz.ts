"use server";

import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import {
  calculateDomainScores,
  calculateTotalScore,
  calculateReliability,
  getLevel,
  getOverallLevel,
} from "@/lib/scoring";
import { redirect } from "next/navigation";

export async function saveAnswer(questionNum: number, value: number) {
  const session = await getStudentSession();
  if (!session.assessmentId) return { error: "Not logged in" };

  const assessment = await prisma.assessment.findUnique({
    where: { id: session.assessmentId },
  });
  if (!assessment || assessment.status !== "in_progress") {
    return { error: "No active assessment" };
  }

  const answers = JSON.parse(assessment.answers) as Record<string, number>;
  answers[String(questionNum)] = value;

  await prisma.assessment.update({
    where: { id: assessment.id },
    data: {
      answers: JSON.stringify(answers),
      lastQuestionNum: Math.max(assessment.lastQuestionNum, questionNum),
    },
  });

  return { ok: true };
}

export async function submitQuiz() {
  const session = await getStudentSession();
  if (!session.assessmentId) return;

  const assessment = await prisma.assessment.findUnique({
    where: { id: session.assessmentId },
  });
  if (!assessment || assessment.status !== "in_progress") return;

  const questions = await prisma.question.findMany({
    orderBy: { orderIndex: "asc" },
  });

  const answers = JSON.parse(assessment.answers) as Record<string, number>;
  const domainScores = calculateDomainScores(answers, questions);
  const totalScore = calculateTotalScore(domainScores);
  const reliability = calculateReliability(answers, questions);

  await prisma.assessment.update({
    where: { id: assessment.id },
    data: {
      status: "completed",
      completedAt: new Date(),
      totalScore,
      overallLevel: getOverallLevel(totalScore),
      knowMeScore: domainScores.KnowMe,
      manageMeScore: domainScores.ManageMe,
      understandOthersScore: domainScores.UnderstandOthers,
      workWithOthersScore: domainScores.WorkWithOthers,
      chooseWellScore: domainScores.ChooseWell,
      knowMeLevel: getLevel(domainScores.KnowMe),
      manageMeLevel: getLevel(domainScores.ManageMe),
      understandOthersLevel: getLevel(domainScores.UnderstandOthers),
      workWithOthersLevel: getLevel(domainScores.WorkWithOthers),
      chooseWellLevel: getLevel(domainScores.ChooseWell),
      reliabilityScore: reliability,
      rawResponseJson: JSON.stringify(answers),
    },
  });

  redirect("/results");
}
