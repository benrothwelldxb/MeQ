import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { type Tier } from "@/lib/constants";
import PulseClient from "./PulseClient";

export default async function PulsePage() {
  const session = await getStudentSession();
  if (!session.studentId) redirect("/");

  const tier = (session.tier || "standard") as Tier;

  const pulseQuestions = await prisma.pulseQuestion.findMany({
    where: { tier },
    orderBy: { orderIndex: "asc" },
  });

  // Fallback: if no pulse questions seeded for this tier, use standard
  const questions = pulseQuestions.length > 0
    ? pulseQuestions
    : await prisma.pulseQuestion.findMany({
        where: { tier: "standard" },
        orderBy: { orderIndex: "asc" },
      });

  if (questions.length === 0) redirect("/quiz");

  return (
    <PulseClient
      questions={questions.map((q) => ({
        domain: q.domain,
        prompt: q.prompt,
        emoji: q.emoji || undefined,
      }))}
      studentName={session.firstName}
      isJunior={tier === "junior"}
    />
  );
}
