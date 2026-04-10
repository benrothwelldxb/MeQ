import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import SurveyEditor from "./SurveyEditor";

export default async function SurveyEditPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAdminSession();

  const survey = await prisma.survey.findFirst({
    where: { id: params.id, schoolId: session.schoolId },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
      _count: { select: { responses: true } },
    },
  });

  if (!survey) return notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/surveys" className="text-sm text-meq-sky hover:underline">&larr; Back to Surveys</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{survey.title}</h1>
        </div>
        {survey._count.responses > 0 && (
          <Link
            href={`/admin/surveys/${survey.id}/results`}
            className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all"
          >
            View Results ({survey._count.responses})
          </Link>
        )}
      </div>

      <SurveyEditor
        survey={{
          id: survey.id,
          title: survey.title,
          description: survey.description,
          status: survey.status,
          anonymous: survey.anonymous,
          allowRetake: survey.allowRetake,
        }}
        questions={survey.questions.map((q) => ({
          id: q.id,
          orderIndex: q.orderIndex,
          prompt: q.prompt,
          questionType: q.questionType,
          options: q.options,
          required: q.required,
        }))}
      />
    </div>
  );
}
