import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { getSchoolSettings } from "@/lib/school";
import { getSchoolFramework, getFrameworkQuestions } from "@/lib/framework";
import { type Tier } from "@/lib/constants";
import QuizClient from "./QuizClient";

export default async function QuizPage() {
  const session = await getStudentSession();
  if (!session.studentId || !session.assessmentId) {
    redirect("/");
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id: session.assessmentId },
    include: { student: true },
  });

  if (!assessment || assessment.status === "completed") {
    redirect("/results");
  }

  const tier = (assessment.tier || "standard") as Tier;
  const school = await getSchoolSettings(assessment.student.schoolId);
  const isReduced = assessment.isReduced;

  // Check if school has a custom framework with questions
  const framework = await getSchoolFramework(assessment.student.schoolId);
  let questions;

  if (framework) {
    const fwQuestions = await getFrameworkQuestions(framework.id, tier);
    if (fwQuestions.length > 0) {
      // Use framework questions
      let filtered = fwQuestions;
      if (isReduced) {
        const coreOnly = filtered.filter((q) => !q.isValidation && !q.isTrap);
        const perDomainLimit = tier === "junior" ? 2 : 4;
        const domainCounts: Record<string, number> = {};
        filtered = coreOnly.filter((q) => {
          domainCounts[q.domainKey] = (domainCounts[q.domainKey] || 0) + 1;
          return domainCounts[q.domainKey] <= perDomainLimit;
        });
      }
      questions = filtered;
    }
  }

  if (!questions) {
    // Fall back to legacy Question model
    let legacyQuestions = await prisma.question.findMany({
      where: { tier },
      orderBy: { orderIndex: "asc" },
    });

    if (isReduced) {
      const coreOnly = legacyQuestions.filter((q) => !q.isValidation && !q.isTrap);
      const perDomainLimit = tier === "junior" ? 2 : 4;
      const domainCounts: Record<string, number> = {};
      legacyQuestions = coreOnly.filter((q) => {
        domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;
        return domainCounts[q.domain] <= perDomainLimit;
      });
    }
    questions = legacyQuestions;
  }

  const answers = JSON.parse(assessment.answers) as Record<string, number>;

  const questionData = questions.map((q) => {
    // Handle both legacy Question and FrameworkQuestion field names
    const domain = "domainKey" in q ? q.domainKey : (q as { domain: string }).domain;
    return {
      orderIndex: q.orderIndex,
      prompt: q.prompt,
      domain,
      audioUrl: q.audioUrl || undefined,
      symbolImageUrl: q.symbolImageUrl || undefined,
      answerOptions: JSON.parse(q.answerOptions) as {
        label: string;
        value: number;
        emoji?: string;
      }[],
    };
  });

  return (
    <QuizClient
      questions={questionData}
      savedAnswers={answers}
      studentName={session.firstName}
      startQuestion={assessment.lastQuestionNum > 0 ? assessment.lastQuestionNum : 1}
      tier={tier}
      readAloudEnabled={school.readAloudEnabled}
    />
  );
}
