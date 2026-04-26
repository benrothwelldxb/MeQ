import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import SurveyClient from "@/app/survey/[id]/SurveyClient";

// Lives outside `(authenticated)` so the admin sidebar isn't wrapped around
// the preview — admins should see exactly what students see, full-bleed.
// Auth is enforced manually here.
export default async function SurveyPreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAdminSession();
  if (!session.adminId) redirect("/admin/login");

  const survey = await prisma.survey.findFirst({
    where: { id: params.id, schoolId: session.schoolId },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  if (!survey) return notFound();

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
      studentName="Preview"
      previewMode={true}
    />
  );
}
