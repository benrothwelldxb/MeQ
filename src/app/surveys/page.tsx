import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SurveySelectionPage() {
  const session = await getStudentSession();
  if (!session.studentId) redirect("/");

  const student = await prisma.student.findUnique({
    where: { id: session.studentId },
    select: { schoolId: true, yearGroupId: true, classGroupId: true, firstName: true, displayName: true },
  });
  if (!student) redirect("/");

  const activeSurveys = await prisma.survey.findMany({
    where: { schoolId: student.schoolId, status: "active" },
    select: {
      id: true,
      title: true,
      description: true,
      targetType: true,
      targetIds: true,
      allowRetake: true,
      questions: { select: { id: true } },
    },
  });

  // Filter to surveys targeting this student and not yet completed
  const pending: { id: string; title: string; description: string | null; questionCount: number }[] = [];

  for (const survey of activeSurveys) {
    const targetIds: string[] = JSON.parse(survey.targetIds);
    if (survey.targetType === "year_group" && student.yearGroupId && !targetIds.includes(student.yearGroupId)) {
      continue;
    }
    if (survey.targetType === "class" && student.classGroupId && !targetIds.includes(student.classGroupId)) {
      continue;
    }

    if (!survey.allowRetake) {
      const existing = await prisma.surveyResponse.findFirst({
        where: { surveyId: survey.id, studentId: session.studentId },
      });
      if (existing) continue;
    }

    pending.push({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      questionCount: survey.questions.length,
    });
  }

  // If only one survey, go straight to it
  if (pending.length === 1) {
    redirect(`/survey/${pending[0].id}`);
  }

  // If none left, send home
  if (pending.length === 0) {
    redirect("/");
  }

  const name = student.displayName || student.firstName;

  return (
    <main className="min-h-screen bg-meq-cloud flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-meq-slate">Hi {name}!</h1>
          <p className="text-gray-500 mt-1">You have {pending.length} surveys to complete.</p>
        </div>

        <div className="space-y-3">
          {pending.map((survey) => (
            <Link
              key={survey.id}
              href={`/survey/${survey.id}`}
              className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-meq-sky hover:shadow-md transition-all"
            >
              <h2 className="font-bold text-meq-slate">{survey.title}</h2>
              {survey.description && (
                <p className="text-sm text-gray-500 mt-1">{survey.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">{survey.questionCount} questions</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
