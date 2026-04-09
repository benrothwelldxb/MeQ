import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { TERM_LABELS } from "@/lib/school";
import { getSchoolFramework, getLevelFromThresholds } from "@/lib/framework";
import { notFound } from "next/navigation";
import { type Level } from "@/lib/constants";
import LevelChip from "@/components/LevelChip";
import Link from "next/link";

export default async function AdminResultDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAdminSession();

  const assessment = await prisma.assessment.findFirst({
    where: { id: params.id, student: { schoolId: session.schoolId } },
    include: { student: true },
  });

  if (!assessment) return notFound();

  const tier = assessment.tier || "standard";
  const framework = await getSchoolFramework(session.schoolId);
  const domains = framework.domains;
  const scoringModel = framework.scoringModels[tier];

  // Domain scores from JSON (primary) or legacy columns (fallback)
  const domainScores: Record<string, number> = assessment.domainScoresJson
    ? JSON.parse(assessment.domainScoresJson)
    : Object.fromEntries(domains.map((d) => {
        const legacyKey = `${d.key.charAt(0).toLowerCase()}${d.key.slice(1)}Score`;
        return [d.key, (assessment as Record<string, unknown>)[legacyKey] as number ?? 0];
      }));

  const domainLevels: Record<string, string> = assessment.domainLevelsJson
    ? JSON.parse(assessment.domainLevelsJson)
    : Object.fromEntries(domains.map((d) => {
        const legacyKey = `${d.key.charAt(0).toLowerCase()}${d.key.slice(1)}Level`;
        return [d.key, ((assessment as Record<string, unknown>)[legacyKey] as string) ?? "Emerging"];
      }));

  // Build label and color maps
  const labelMap: Record<string, string> = {};
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {};
  const COLOR_STYLES: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
    red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    pink: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
    teal: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  };
  for (const d of domains) {
    labelMap[d.key] = d.label;
    colorMap[d.key] = COLOR_STYLES[d.color] || COLOR_STYLES.blue;
  }

  const questions = await prisma.question.findMany({
    where: { tier },
    orderBy: { orderIndex: "asc" },
  });

  const answers = JSON.parse(assessment.answers || "{}") as Record<string, number>;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/results" className="text-sm text-meq-sky hover:underline">&larr; Back to Results</Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {assessment.student.firstName} {assessment.student.lastName}
        </h1>
        <p className="text-gray-500">
          {assessment.student.yearGroup}
          {assessment.student.className && ` / ${assessment.student.className}`}{" "}
          &middot; {framework.name} &middot; Completed{" "}
          {assessment.completedAt ? new Date(assessment.completedAt).toLocaleDateString() : "—"}
        </p>
      </div>

      {/* Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-sm text-gray-500">Total Score</p>
            <p className="text-4xl font-extrabold text-gray-900">
              {assessment.totalScore ?? 0}
              {scoringModel && (
                <span className="text-lg text-gray-400 font-normal"> / {scoringModel.maxTotalScore}</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Level</p>
            <LevelChip level={(assessment.overallLevel as Level) ?? "Emerging"} />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Reliability</p>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              assessment.reliabilityScore === "High" ? "bg-emerald-100 text-emerald-700"
              : assessment.reliabilityScore === "Medium" ? "bg-amber-100 text-amber-700"
              : assessment.reliabilityScore === "Lite" ? "bg-blue-100 text-blue-700"
              : "bg-red-100 text-red-700"
            }`}>
              {assessment.reliabilityScore}
            </span>
          </div>
        </div>
      </div>

      {/* Domain Cards — dynamic */}
      <div className={`grid gap-4 mb-6 ${domains.length <= 4 ? "grid-cols-2" : domains.length <= 6 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
        {domains.map((d) => {
          const colors = colorMap[d.key];
          return (
            <div key={d.key} className={`${colors.bg} rounded-xl p-4 border ${colors.border}`}>
              <p className={`text-xs font-semibold ${colors.text} mb-1`}>{d.label}</p>
              <p className={`text-2xl font-bold ${colors.text}`}>{domainScores[d.key] ?? 0}</p>
              <LevelChip level={(domainLevels[d.key] as Level) ?? "Emerging"} />
            </div>
          );
        })}
      </div>

      {/* Term Comparison */}
      {await (async () => {
        const allAssessments = await prisma.assessment.findMany({
          where: { studentId: assessment.studentId, status: "completed" },
          orderBy: [{ academicYear: "asc" }, { term: "asc" }],
        });

        if (allAssessments.length <= 1) return null;

        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">Progress Over Time</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Term</th>
                    {domains.map((d) => (
                      <th key={d.key} className={`text-center px-2 py-2 text-xs font-semibold ${colorMap[d.key].text}`}>
                        {d.label}
                      </th>
                    ))}
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Overall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allAssessments.map((a, i) => {
                    const prev = i > 0 ? allAssessments[i - 1] : null;
                    const aScores: Record<string, number> = a.domainScoresJson
                      ? JSON.parse(a.domainScoresJson)
                      : {};
                    const prevScores: Record<string, number> | null = prev?.domainScoresJson
                      ? JSON.parse(prev.domainScoresJson)
                      : null;
                    return (
                      <tr key={a.id} className={a.id === assessment.id ? "bg-meq-sky-light/30" : ""}>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">
                          {TERM_LABELS[a.term] || a.term} {a.academicYear}
                          {a.id === assessment.id && <span className="text-xs text-meq-sky ml-1">(current)</span>}
                        </td>
                        {domains.map((d) => {
                          const score = aScores[d.key] ?? 0;
                          const prevScore = prevScores ? (prevScores[d.key] ?? 0) : null;
                          const diff = prevScore !== null ? score - prevScore : null;
                          return (
                            <td key={d.key} className="text-center px-2 py-2 text-sm">
                              {score}
                              {diff !== null && diff !== 0 && (
                                <span className={`text-xs ml-1 ${diff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                  {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="text-center px-3 py-2 text-sm font-medium">
                          {a.totalScore ?? 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Individual Answers */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Individual Responses</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {questions.map((q) => {
            const answer = answers[String(q.orderIndex)];
            const options = JSON.parse(q.answerOptions) as Array<{ label: string; value: number }>;
            const selectedOption = options.find((o) => o.value === answer);

            return (
              <div key={q.id} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-gray-400 mt-0.5 min-w-[28px]">Q{q.orderIndex}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium">{q.prompt}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{labelMap[q.domain] || q.domain}</span>
                      {q.isTrap && <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-medium">Trap</span>}
                      {q.isValidation && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">Validation</span>}
                    </div>
                    <p className="text-sm mt-1">
                      {selectedOption ? (
                        <span className="text-meq-sky font-medium">{selectedOption.label} ({answer})</span>
                      ) : (
                        <span className="text-gray-400">No answer</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
