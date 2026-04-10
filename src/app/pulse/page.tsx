import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { getSchoolFramework } from "@/lib/framework";
import { type Tier } from "@/lib/constants";
import PulseClient from "./PulseClient";

export default async function PulsePage() {
  const session = await getStudentSession();
  if (!session.studentId) redirect("/");

  const student = await prisma.student.findUnique({
    where: { id: session.studentId },
    select: { schoolId: true },
  });
  if (!student) redirect("/");

  const tier = (session.tier || "standard") as Tier;
  const framework = await getSchoolFramework(student.schoolId);

  // Load framework-specific pulse questions
  let questions = await prisma.pulseQuestion.findMany({
    where: { frameworkId: framework.id, tier },
    orderBy: { orderIndex: "asc" },
  });

  // Fall back to standard tier within same framework
  if (questions.length === 0) {
    questions = await prisma.pulseQuestion.findMany({
      where: { frameworkId: framework.id, tier: "standard" },
      orderBy: { orderIndex: "asc" },
    });
  }

  // Final fallback: any pulse questions for this tier (legacy, no framework set)
  if (questions.length === 0) {
    questions = await prisma.pulseQuestion.findMany({
      where: { tier, frameworkId: null },
      orderBy: { orderIndex: "asc" },
    });
  }

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
