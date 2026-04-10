import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { QUESTION_TYPE_LABELS } from "@/lib/surveys";

export default async function SurveyResultsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAdminSession();

  const survey = await prisma.survey.findFirst({
    where: { id: params.id, schoolId: session.schoolId },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
      responses: true,
    },
  });

  if (!survey) return notFound();

  const totalResponses = survey.responses.length;
  const flaggedCount = survey.responses.filter((r) => r.flagged).length;

  // Build analytics per question
  const analyticsPerQuestion = survey.questions.map((q) => {
    const answers = survey.responses
      .map((r) => {
        const parsed = JSON.parse(r.answers) as Record<string, unknown>;
        return parsed[q.id];
      })
      .filter((a) => a !== undefined && a !== null && a !== "");

    if (q.questionType === "likert_5" || q.questionType === "rating_10") {
      const nums = answers.map((a) => Number(a)).filter((n) => !isNaN(n));
      const avg = nums.length > 0 ? Math.round((nums.reduce((s, v) => s + v, 0) / nums.length) * 10) / 10 : 0;
      const dist: Record<number, number> = {};
      const max = q.questionType === "likert_5" ? 5 : 10;
      for (let i = 1; i <= max; i++) dist[i] = 0;
      for (const n of nums) {
        if (dist[n] !== undefined) dist[n]++;
      }
      return { question: q, type: "numeric" as const, average: avg, distribution: dist, count: nums.length };
    }

    if (q.questionType === "yes_no") {
      const yes = answers.filter((a) => a === "yes").length;
      const no = answers.filter((a) => a === "no").length;
      return { question: q, type: "yes_no" as const, yes, no, count: yes + no };
    }

    if (q.questionType === "multiple_choice") {
      const counts: Record<string, number> = {};
      const options = q.options ? (JSON.parse(q.options) as string[]) : [];
      for (const o of options) counts[o] = 0;
      for (const a of answers) {
        const key = String(a);
        if (counts[key] !== undefined) counts[key]++;
      }
      return { question: q, type: "choice" as const, counts, count: answers.length };
    }

    if (q.questionType === "free_text") {
      const texts = answers.map((a) => String(a)).filter((t) => t.trim().length > 0);
      return { question: q, type: "text" as const, texts, count: texts.length };
    }

    return { question: q, type: "unknown" as const, count: 0 };
  });

  return (
    <div className="max-w-4xl">
      <Link href={`/admin/surveys/${survey.id}`} className="text-sm text-meq-sky hover:underline">&larr; Back to Survey</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">{survey.title}</h1>
      <p className="text-gray-500 mb-6">Results · {totalResponses} response{totalResponses !== 1 ? "s" : ""}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Responses</p>
          <p className="text-2xl font-bold text-gray-900">{totalResponses}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Mode</p>
          <p className="text-2xl font-bold text-gray-900">{survey.anonymous ? "Anonymous" : "Identified"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Flagged for Review</p>
          <p className={`text-2xl font-bold ${flaggedCount > 0 ? "text-red-600" : "text-gray-900"}`}>{flaggedCount}</p>
        </div>
      </div>

      {/* Flagged responses */}
      {flaggedCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
          <h2 className="font-bold text-red-800 mb-3">Responses Flagged for Review</h2>
          <p className="text-xs text-red-600 mb-4">
            These responses contained words that may indicate a concern. Review them carefully
            and follow your school&apos;s safeguarding procedures.
          </p>
          <div className="space-y-3">
            {survey.responses.filter((r) => r.flagged).map((r) => (
              <div key={r.id} className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-red-700 font-medium mb-1">
                  Flagged: {r.flagReason || "keyword match"}
                </p>
                <p className="text-xs text-red-400">
                  {survey.anonymous ? "Anonymous" : (r.studentId ? `Student ID: ${r.studentId}` : "Unknown")}
                  {" · "}{new Date(r.completedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-question analytics */}
      <div className="space-y-4">
        {analyticsPerQuestion.map((a) => (
          <div key={a.question.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1">{QUESTION_TYPE_LABELS[a.question.questionType]}</p>
              <h3 className="font-bold text-gray-900">{a.question.prompt}</h3>
              <p className="text-xs text-gray-500 mt-1">{a.count} response{a.count !== 1 ? "s" : ""}</p>
            </div>

            {a.type === "numeric" && (
              <div>
                <p className="text-sm text-gray-700 mb-3">Average: <strong>{a.average}</strong></p>
                <div className="space-y-1">
                  {Object.entries(a.distribution).map(([val, count]) => {
                    const max = Math.max(...Object.values(a.distribution));
                    const width = max > 0 ? (count / max) * 100 : 0;
                    return (
                      <div key={val} className="flex items-center gap-2 text-xs">
                        <span className="w-6 text-gray-500">{val}</span>
                        <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                          <div
                            className="h-full bg-meq-sky rounded flex items-center justify-end px-2"
                            style={{ width: `${width}%` }}
                          >
                            {count > 0 && <span className="text-white text-[10px]">{count}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {a.type === "yes_no" && (
              <div className="flex gap-4">
                <div className="flex-1 bg-emerald-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-emerald-700 mb-1">Yes</p>
                  <p className="text-2xl font-bold text-emerald-700">{a.yes}</p>
                  <p className="text-xs text-emerald-600">
                    {a.count > 0 ? Math.round((a.yes / a.count) * 100) : 0}%
                  </p>
                </div>
                <div className="flex-1 bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-red-700 mb-1">No</p>
                  <p className="text-2xl font-bold text-red-700">{a.no}</p>
                  <p className="text-xs text-red-600">
                    {a.count > 0 ? Math.round((a.no / a.count) * 100) : 0}%
                  </p>
                </div>
              </div>
            )}

            {a.type === "choice" && (
              <div className="space-y-1">
                {Object.entries(a.counts).map(([option, count]) => {
                  const max = Math.max(...Object.values(a.counts));
                  const width = max > 0 ? (count / max) * 100 : 0;
                  return (
                    <div key={option} className="flex items-center gap-2 text-xs">
                      <span className="w-32 text-gray-700 text-xs truncate" title={option}>{option}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-meq-sky rounded flex items-center justify-end px-2"
                          style={{ width: `${width}%` }}
                        >
                          {count > 0 && <span className="text-white text-[10px]">{count}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {a.type === "text" && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {a.texts.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No responses</p>
                ) : (
                  a.texts.map((t, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 italic">
                      &ldquo;{t}&rdquo;
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
