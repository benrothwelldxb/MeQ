import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { getSchoolSettings } from "@/lib/school";
import { startStaffAssessment } from "@/app/actions/staff-wellbeing";
import { redirect } from "next/navigation";
import StaffAssessmentClient from "./StaffAssessmentClient";

export default async function StaffAssessmentPage() {
  const session = await getTeacherSession();
  if (!session.teacherId) redirect("/teacher/login");

  const school = await getSchoolSettings(session.schoolId);
  if (!school.staffWellbeingEnabled) redirect("/teacher/wellbeing");

  // Start or resume the assessment
  const startResult = await startStaffAssessment();
  if ("error" in startResult) {
    return (
      <div className="max-w-md">
        <p className="text-red-600">{startResult.error}</p>
      </div>
    );
  }

  const assessment = await prisma.staffAssessment.findUnique({
    where: { id: startResult.assessmentId },
  });
  if (!assessment || assessment.status === "completed") {
    redirect("/teacher/wellbeing");
  }

  // Load staff questions from standalone StaffQuestion model
  const questions = await prisma.staffQuestion.findMany({
    include: { domain: true },
    orderBy: { orderIndex: "asc" },
  });

  if (questions.length === 0) {
    return (
      <div className="max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Assessment Not Ready</h1>
        <p className="text-gray-600">
          Staff wellbeing questions haven&apos;t been configured yet.
          Please ask your platform administrator to set these up.
        </p>
      </div>
    );
  }

  const answers = JSON.parse(assessment.answers) as Record<string, number>;

  return (
    <StaffAssessmentClient
      assessmentId={assessment.id}
      questions={questions.map((q) => ({
        orderIndex: q.orderIndex,
        prompt: q.prompt,
        domain: q.domain.label,
        answerOptions: JSON.parse(q.answerOptions) as { label: string; value: number }[],
      }))}
      savedAnswers={answers}
      teacherName={session.firstName}
    />
  );
}
