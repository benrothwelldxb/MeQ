import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { getSchoolFramework } from "@/lib/framework";
import { getSchoolSettings } from "@/lib/school";
import { getCheckInTargets } from "@/app/actions/check-in";
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
  const [framework, school, targets] = await Promise.all([
    getSchoolFramework(student.schoolId),
    getSchoolSettings(student.schoolId),
    getCheckInTargets(),
  ]);

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

  const teachers = "error" in targets ? [] : targets.teachers;
  const defaultTeacherId = "error" in targets ? null : targets.defaultTeacherId;

  return (
    <PulseClient
      questions={questions.map((q) => ({
        domain: q.domain,
        prompt: q.prompt,
        emoji: q.emoji || undefined,
        audioUrl: q.audioUrl || undefined,
      }))}
      studentName={session.firstName}
      isJunior={tier === "junior"}
      readAloudEnabled={school.readAloudEnabled && tier === "junior"}
      teachers={teachers}
      defaultTeacherId={defaultTeacherId}
    />
  );
}
