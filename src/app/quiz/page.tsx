import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { getSchoolSettings } from "@/lib/school";
import { DOMAINS, type Tier } from "@/lib/constants";
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

  // Load questions for this tier
  let questions = await prisma.question.findMany({
    where: { tier },
    orderBy: { orderIndex: "asc" },
  });

  // In reduced mode, filter to core-only and limit per domain
  if (isReduced) {
    const coreOnly = questions.filter((q) => !q.isValidation && !q.isTrap);
    const perDomainLimit = tier === "junior" ? 2 : 4;
    const domainCounts: Record<string, number> = {};
    questions = coreOnly.filter((q) => {
      domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;
      return domainCounts[q.domain] <= perDomainLimit;
    });
  }

  const answers = JSON.parse(assessment.answers) as Record<string, number>;

  const questionData = questions.map((q) => ({
    orderIndex: q.orderIndex,
    prompt: q.prompt,
    domain: q.domain,
    audioUrl: q.audioUrl || undefined,
    symbolImageUrl: q.symbolImageUrl || undefined,
    answerOptions: JSON.parse(q.answerOptions) as {
      label: string;
      value: number;
      emoji?: string;
    }[],
  }));

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
