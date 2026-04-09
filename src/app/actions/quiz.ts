"use server";

import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { getSchoolFramework, getFrameworkQuestions } from "@/lib/framework";
import { type Tier } from "@/lib/constants";
import {
  calculateDomainScores,
  calculateTotalScore,
  calculateReliability,
  calculateFrameworkDomainScores,
  getLevel,
  getOverallLevel,
  getFrameworkLevel,
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
    include: { student: true },
  });
  if (!assessment || assessment.status !== "in_progress") return;

  const tier = (assessment.tier || "standard") as Tier;
  const reduced = assessment.isReduced;
  const answers = JSON.parse(assessment.answers) as Record<string, number>;

  // Check for custom framework
  const framework = await getSchoolFramework(assessment.student.schoolId);

  if (framework) {
    const fwQuestions = await getFrameworkQuestions(framework.id, tier);
    if (fwQuestions.length > 0) {
      // Framework-based scoring
      const domainKeys = framework.domains.map((d) => d.key);
      const domainScores = calculateFrameworkDomainScores(
        answers,
        fwQuestions.map((q) => ({
          orderIndex: q.orderIndex,
          domainKey: q.domainKey,
          type: q.type,
          weight: q.weight,
          scoreMap: q.scoreMap,
        })),
        domainKeys
      );

      const totalScore = Object.values(domainScores).reduce((s, v) => s + v, 0);
      const tierConfig = framework.config.tiers?.[tier];
      const levelThresholds = tierConfig?.levelThresholds || [];
      const overallThresholds = tierConfig?.overallThresholds || [];

      const domainLevels: Record<string, string> = {};
      for (const key of domainKeys) {
        domainLevels[key] = getFrameworkLevel(domainScores[key] || 0, levelThresholds);
      }

      await prisma.assessment.update({
        where: { id: assessment.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          totalScore: Math.round(totalScore * 10) / 10,
          overallLevel: getFrameworkLevel(totalScore, overallThresholds),
          // Write to JSON fields for framework assessments
          domainScoresJson: JSON.stringify(domainScores),
          domainLevelsJson: JSON.stringify(domainLevels),
          frameworkId: framework.id,
          // Also write to legacy columns if domains match
          knowMeScore: domainScores.KnowMe ?? null,
          manageMeScore: domainScores.ManageMe ?? null,
          understandOthersScore: domainScores.UnderstandOthers ?? null,
          workWithOthersScore: domainScores.WorkWithOthers ?? null,
          chooseWellScore: domainScores.ChooseWell ?? null,
          knowMeLevel: domainLevels.KnowMe ?? null,
          manageMeLevel: domainLevels.ManageMe ?? null,
          understandOthersLevel: domainLevels.UnderstandOthers ?? null,
          workWithOthersLevel: domainLevels.WorkWithOthers ?? null,
          chooseWellLevel: domainLevels.ChooseWell ?? null,
          reliabilityScore: reduced ? "Lite" : "N/A",
          rawResponseJson: JSON.stringify(answers),
        },
      });

      redirect("/results");
    }
  }

  // Legacy MeQ Standard scoring
  const questions = await prisma.question.findMany({
    where: { tier },
    orderBy: { orderIndex: "asc" },
  });

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
      domainScoresJson: JSON.stringify(domainScores),
      domainLevelsJson: JSON.stringify({
        KnowMe: getLevel(domainScores.KnowMe, tier, reduced),
        ManageMe: getLevel(domainScores.ManageMe, tier, reduced),
        UnderstandOthers: getLevel(domainScores.UnderstandOthers, tier, reduced),
        WorkWithOthers: getLevel(domainScores.WorkWithOthers, tier, reduced),
        ChooseWell: getLevel(domainScores.ChooseWell, tier, reduced),
      }),
    },
  });

  redirect("/results");
}
