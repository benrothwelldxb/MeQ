import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
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

  const questions = await prisma.question.findMany({
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
    }[],
  }));

  return (
    <QuizClient
      questions={questionData}
      savedAnswers={answers}
      studentName={session.firstName}
      startQuestion={assessment.lastQuestionNum > 0 ? assessment.lastQuestionNum : 1}
    />
  );
}
