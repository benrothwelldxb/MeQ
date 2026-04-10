"use server";

import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { getSchoolFramework, getFrameworkQuestions, getLevelFromThresholds } from "@/lib/framework";
import { calculateFrameworkDomainScores } from "@/lib/scoring";
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

  const tier = assessment.tier || "standard";
  const reduced = assessment.isReduced;

  // Always use framework-driven scoring
  const framework = await getSchoolFramework(assessment.student.schoolId);
  const scoringModel = framework.scoringModels[tier];

  // Load questions — prefer framework questions, fall back to legacy
  let fwQuestions = await getFrameworkQuestions(framework.id, tier);

  if (fwQuestions.length === 0) {
    // Fall back to legacy Question model for MeQ Standard
    const legacyQuestions = await prisma.question.findMany({
      where: { tier },
      orderBy: { orderIndex: "asc" },
    });
    // Convert to framework question shape
    fwQuestions = legacyQuestions.map((q) => ({
      ...q,
      frameworkId: framework.id,
      domainKey: q.domain,
      audience: "student",
      type: q.type || "core",
      questionFormat: q.questionFormat || "self-report",
    }));
  }

  const answers = JSON.parse(assessment.answers) as Record<string, number>;
  const domainKeys = framework.domains.map((d) => d.key);

  // Calculate domain scores
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

  const totalScore = Math.round(
    Object.values(domainScores).reduce((s, v) => s + v, 0) * 10
  ) / 10;

  // Get thresholds
  const domainThresholds = scoringModel?.thresholds || [];
  const overallThresholds = scoringModel?.overallThresholds || [];

  // Calculate levels
  const domainLevels: Record<string, string> = {};
  for (const key of domainKeys) {
    domainLevels[key] = getLevelFromThresholds(domainScores[key] || 0, domainThresholds);
  }
  const overallLevel = getLevelFromThresholds(totalScore, overallThresholds);

  // Determine reliability
  let reliability = "Lite";
  if (!reduced) {
    const validationQs = fwQuestions.filter((q) => q.isValidation && q.validationPair);
    const trapQs = fwQuestions.filter((q) => q.isTrap);
    if (validationQs.length > 0 || trapQs.length > 0) {
      let consistentPairs = 0;
      let totalPairs = 0;
      let trapFlags = 0;
      let totalTraps = 0;
      for (const vq of validationQs) {
        const va = answers[String(vq.orderIndex)];
        const pa = answers[String(vq.validationPair)];
        if (va !== undefined && pa !== undefined) {
          totalPairs++;
          if (Math.abs(va - pa) <= 1) consistentPairs++;
        }
      }
      for (const tq of trapQs) {
        const a = answers[String(tq.orderIndex)];
        if (a !== undefined) {
          totalTraps++;
          if (a === 4) trapFlags++;
        }
      }
      const pairRatio = totalPairs > 0 ? consistentPairs / totalPairs : 1;
      const trapRatio = totalTraps > 0 ? trapFlags / totalTraps : 0;
      if (pairRatio >= 0.8 && trapRatio <= 0.2) reliability = "High";
      else if (pairRatio >= 0.5 && trapRatio <= 0.4) reliability = "Medium";
      else reliability = "Low";
    } else {
      reliability = "High"; // No validation/trap = always high (junior)
    }
  }

  // Write assessment results — framework-driven only
  await prisma.assessment.update({
    where: { id: assessment.id },
    data: {
      status: "completed",
      completedAt: new Date(),
      totalScore,
      overallLevel,
      domainScoresJson: JSON.stringify(domainScores),
      domainLevelsJson: JSON.stringify(domainLevels),
      frameworkId: framework.id,
      reliabilityScore: reliability,
      rawResponseJson: JSON.stringify(answers),
      // Legacy columns — write for backwards compat with existing reports
      knowMeScore: domainScores["KnowMe"] ?? null,
      manageMeScore: domainScores["ManageMe"] ?? null,
      understandOthersScore: domainScores["UnderstandOthers"] ?? null,
      workWithOthersScore: domainScores["WorkWithOthers"] ?? null,
      chooseWellScore: domainScores["ChooseWell"] ?? null,
      knowMeLevel: domainLevels["KnowMe"] ?? null,
      manageMeLevel: domainLevels["ManageMe"] ?? null,
      understandOthersLevel: domainLevels["UnderstandOthers"] ?? null,
      workWithOthersLevel: domainLevels["WorkWithOthers"] ?? null,
      chooseWellLevel: domainLevels["ChooseWell"] ?? null,
    },
  });

  // Write domain score records (queryable)
  for (const key of domainKeys) {
    await prisma.assessmentDomainScore.upsert({
      where: { assessmentId_domainKey: { assessmentId: assessment.id, domainKey: key } },
      update: { score: domainScores[key] || 0, level: domainLevels[key] || "Emerging" },
      create: {
        assessmentId: assessment.id,
        domainKey: key,
        score: domainScores[key] || 0,
        level: domainLevels[key] || "Emerging",
      },
    });
  }

  redirect("/results");
}
