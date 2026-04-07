import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { type Tier } from "@/lib/constants";
import QuizClient from "./QuizClient";

export default async function QuizPage() {
  const session = await getStudentSession();
  if (!session.studentId || !session.assessmentId) {
    redirect("/");
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id: session.assessmentId },
  });

  if (!assessment || assessment.status === "completed") {
    redirect("/results");
  }

  const tier = (assessment.tier || "standard") as Tier;

  // Load only questions for this student's tier
  const questions = await prisma.question.findMany({
    where: { tier },
    orderBy: { orderIndex: "asc" },
  });

  const answers = JSON.parse(assessment.answers) as Record<string, number>;

  const questionData = questions.map((q) => ({
    orderIndex: q.orderIndex,
    prompt: q.prompt,
    domain: q.domain,
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
    />
  );
}
