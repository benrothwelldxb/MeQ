import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { getSchoolFramework } from "@/lib/framework";
import { getSchoolSettings } from "@/lib/school";
import StaffPulseClient from "./StaffPulseClient";

export default async function StaffPulsePage() {
  const session = await getTeacherSession();
  if (!session.teacherId) redirect("/teacher/login");

  const school = await getSchoolSettings(session.schoolId);
  if (!school.staffWellbeingEnabled) redirect("/teacher/wellbeing");

  const framework = await getSchoolFramework(session.schoolId);

  // Use same pulse questions as students (framework-level, tier doesn't apply to adults)
  let questions = await prisma.pulseQuestion.findMany({
    where: { frameworkId: framework.id, tier: "standard" },
    orderBy: { orderIndex: "asc" },
  });

  if (questions.length === 0) {
    questions = await prisma.pulseQuestion.findMany({
      where: { frameworkId: framework.id },
      orderBy: { orderIndex: "asc" },
    });
  }

  if (questions.length === 0) redirect("/teacher/wellbeing");

  return (
    <StaffPulseClient
      questions={questions.map((q) => ({
        domain: q.domain,
        prompt: q.prompt,
        emoji: q.emoji || undefined,
      }))}
      teacherName={session.firstName}
    />
  );
}
