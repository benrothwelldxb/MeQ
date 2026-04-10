import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import SurveyClient from "./SurveyClient";

export default async function StudentSurveyPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getStudentSession();
  if (!session.studentId) redirect("/");

  const student = await prisma.student.findUnique({
    where: { id: session.studentId },
    select: { schoolId: true, yearGroupId: true, classGroupId: true, firstName: true, displayName: true },
  });
  if (!student) redirect("/");

  const survey = await prisma.survey.findFirst({
    where: {
      id: params.id,
      schoolId: student.schoolId,
      status: "active",
    },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!survey) return notFound();

  // Check targeting
  const targetIds: string[] = JSON.parse(survey.targetIds);
  if (survey.targetType === "year_group" && student.yearGroupId && !targetIds.includes(student.yearGroupId)) {
    return notFound();
  }
  if (survey.targetType === "class" && student.classGroupId && !targetIds.includes(student.classGroupId)) {
    return notFound();
  }

  // Check if already completed (and retakes disabled)
  if (!survey.allowRetake) {
    const existing = await prisma.surveyResponse.findFirst({
      where: { surveyId: survey.id, studentId: session.studentId },
    });
    if (existing) redirect(`/survey/${survey.id}/done`);
  }

  return (
    <SurveyClient
      survey={{
        id: survey.id,
        title: survey.title,
        description: survey.description,
        anonymous: survey.anonymous,
      }}
      questions={survey.questions.map((q) => ({
        id: q.id,
        orderIndex: q.orderIndex,
        prompt: q.prompt,
        questionType: q.questionType,
        options: q.options ? (JSON.parse(q.options) as string[]) : null,
        required: q.required,
      }))}
      studentName={student.displayName || student.firstName}
    />
  );
}
