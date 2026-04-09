"use server";

import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { type Tier } from "@/lib/constants";
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

  const tier = (assessment.tier || "standard") as Tier;

  // Load only questions for this tier
  const questions = await prisma.question.findMany({
    where: { tier },
    orderBy: { orderIndex: "asc" },
  });

  const reduced = assessment.isReduced;
  const answers = JSON.parse(assessment.answers) as Record<string, number>;
  const domainScores = calculateDomainScores(answers, questions);
  const totalScore = calculateTotalScore(domainScores);
  const reliability = reduced ? "Lite" : calculateReliability(answers, questions);

  await prisma.assessment.update({
    where: { id: assessment.id },
    data: {
      status: "completed",
      completedAt: new Date(),
      totalScore,
      overallLevel: getOverallLevel(totalScore, tier, reduced),
      knowMeScore: domainScores.KnowMe,
      manageMeScore: domainScores.ManageMe,
      understandOthersScore: domainScores.UnderstandOthers,
      workWithOthersScore: domainScores.WorkWithOthers,
      chooseWellScore: domainScores.ChooseWell,
      knowMeLevel: getLevel(domainScores.KnowMe, tier, reduced),
      manageMeLevel: getLevel(domainScores.ManageMe, tier, reduced),
      understandOthersLevel: getLevel(domainScores.UnderstandOthers, tier, reduced),
      workWithOthersLevel: getLevel(domainScores.WorkWithOthers, tier, reduced),
      chooseWellLevel: getLevel(domainScores.ChooseWell, tier, reduced),
      reliabilityScore: reliability,
      rawResponseJson: JSON.stringify(answers),
    },
  });

  redirect("/results");
}
