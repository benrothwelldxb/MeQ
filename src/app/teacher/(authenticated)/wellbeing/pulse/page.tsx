import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { getSchoolSettings } from "@/lib/school";
import StaffPulseClient from "./StaffPulseClient";

export default async function StaffPulsePage() {
  const session = await getTeacherSession();
  if (!session.teacherId) redirect("/teacher/login");

  const school = await getSchoolSettings(session.schoolId);
  if (!school.staffWellbeingEnabled) redirect("/teacher/wellbeing");

  // Load system-wide staff pulse questions
  const questions = await prisma.staffPulseQuestion.findMany({
    include: { domain: true },
    orderBy: { domain: { sortOrder: "asc" } },
  });

  if (questions.length === 0) redirect("/teacher/wellbeing");

  return (
    <StaffPulseClient
      questions={questions.map((q) => ({
        domain: q.domain.key,
        prompt: q.prompt,
        emoji: q.emoji || undefined,
      }))}
      teacherName={session.firstName}
    />
  );
}
