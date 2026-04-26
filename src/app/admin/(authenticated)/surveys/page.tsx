import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import Link from "next/link";

export default async function SurveysPage() {
  const session = await getAdminSession();

  const surveys = await prisma.survey.findMany({
    where: { schoolId: session.schoolId },
    include: {
      _count: { select: { responses: true, questions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const draft = surveys.filter((s) => s.status === "draft");
  const active = surveys.filter((s) => s.status === "active");
  const closed = surveys.filter((s) => s.status === "closed");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom surveys</h1>
          <p className="text-gray-500 mt-1">One-off surveys for your school — wellbeing, transitions, climate, and more. Plotted alongside the full survey and pulse on the <Link href="/admin/calendar" className="text-meq-sky hover:underline">calendar</Link>.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/surveys/calendar"
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
          >
            Calendar view
          </Link>
          <Link
            href="/admin/surveys/new"
            className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all"
          >
            Create Survey
          </Link>
        </div>
      </div>

      {active.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Active ({active.length})</h2>
          <div className="grid gap-3">
            {active.map((s) => (
              <SurveyCard key={s.id} survey={s} statusColor="emerald" />
            ))}
          </div>
        </div>
      )}

      {draft.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Drafts ({draft.length})</h2>
          <div className="grid gap-3">
            {draft.map((s) => (
              <SurveyCard key={s.id} survey={s} statusColor="gray" />
            ))}
          </div>
        </div>
      )}

      {closed.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Closed ({closed.length})</h2>
          <div className="grid gap-3">
            {closed.map((s) => (
              <SurveyCard key={s.id} survey={s} statusColor="slate" />
            ))}
          </div>
        </div>
      )}

      {surveys.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-3">No surveys yet.</p>
          <Link
            href="/admin/surveys/new"
            className="text-meq-sky hover:underline text-sm"
          >
            Create your first survey
          </Link>
        </div>
      )}
    </div>
  );
}

function SurveyCard({
  survey,
  statusColor,
}: {
  survey: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    anonymous: boolean;
    _count: { responses: number; questions: number };
  };
  statusColor: string;
}) {
  const statusClass: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700",
    gray: "bg-gray-100 text-gray-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <Link
      href={`/admin/surveys/${survey.id}`}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:border-meq-sky transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900">{survey.title}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClass[statusColor]}`}>
              {survey.status}
            </span>
            {survey.anonymous && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Anonymous
              </span>
            )}
          </div>
          {survey.description && (
            <p className="text-sm text-gray-500">{survey.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-400 mt-3">
        <span>{survey._count.questions} questions</span>
        <span>&middot;</span>
        <span>{survey._count.responses} responses</span>
      </div>
    </Link>
  );
}
