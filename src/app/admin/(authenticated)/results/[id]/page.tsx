import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { TERM_LABELS } from "@/lib/school";
import { notFound } from "next/navigation";
import { DOMAINS, DOMAIN_LABELS, DOMAIN_COLORS, MAX_TOTAL_SCORE, type Domain, type Level, type Tier } from "@/lib/constants";
import LevelChip from "@/components/LevelChip";
import DomainCard from "@/components/DomainCard";
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

  const tier = (assessment.tier || "standard") as Tier;

  const questions = await prisma.question.findMany({
    where: { tier },
    orderBy: { orderIndex: "asc" },
  });

  const answers = JSON.parse(assessment.answers || "{}") as Record<string, number>;

  const domainScores: Record<Domain, number> = {
    KnowMe: assessment.knowMeScore ?? 0,
    ManageMe: assessment.manageMeScore ?? 0,
    UnderstandOthers: assessment.understandOthersScore ?? 0,
    WorkWithOthers: assessment.workWithOthersScore ?? 0,
    ChooseWell: assessment.chooseWellScore ?? 0,
  };

  const domainLevels: Record<Domain, Level> = {
    KnowMe: (assessment.knowMeLevel as Level) ?? "Emerging",
    ManageMe: (assessment.manageMeLevel as Level) ?? "Emerging",
    UnderstandOthers: (assessment.understandOthersLevel as Level) ?? "Emerging",
    WorkWithOthers: (assessment.workWithOthersLevel as Level) ?? "Emerging",
    ChooseWell: (assessment.chooseWellLevel as Level) ?? "Emerging",
  };

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/results"
        className="text-sm text-meq-sky hover:underline"
      >
        &larr; Back to Results
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {assessment.student.firstName} {assessment.student.lastName}
        </h1>
        <p className="text-gray-500">
          {assessment.student.yearGroup}
          {assessment.student.className &&
            ` / ${assessment.student.className}`}{" "}
          &middot; Completed{" "}
          {assessment.completedAt
            ? new Date(assessment.completedAt).toLocaleDateString()
            : "—"}
        </p>
      </div>

      {/* Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-sm text-gray-500">MeQ Score</p>
            <p className="text-4xl font-extrabold text-gray-900">
              {assessment.totalScore ?? 0}
              <span className="text-lg text-gray-400 font-normal"> / {MAX_TOTAL_SCORE[tier]}</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Level</p>
            <LevelChip
              level={(assessment.overallLevel as Level) ?? "Emerging"}
            />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Reliability</p>
            <span
              className={`text-sm font-bold px-3 py-1 rounded-full ${
                assessment.reliabilityScore === "High"
                  ? "bg-emerald-100 text-emerald-700"
                  : assessment.reliabilityScore === "Medium"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {assessment.reliabilityScore}
            </span>
          </div>
        </div>
      </div>

      {/* Domain Cards */}
      <div className="grid gap-4 mb-6">
        {DOMAINS.map((domain) => (
          <DomainCard
            key={domain}
            domain={domain}
            score={domainScores[domain]}
            level={domainLevels[domain]}
            tier={tier}
          />
        ))}
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
                    {DOMAINS.map((d) => (
                      <th key={d} className={`text-center px-2 py-2 text-xs font-semibold ${DOMAIN_COLORS[d].text}`}>
                        {DOMAIN_LABELS[d]}
                      </th>
                    ))}
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Overall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allAssessments.map((a, i) => {
                    const prev = i > 0 ? allAssessments[i - 1] : null;
                    return (
                      <tr key={a.id} className={a.id === assessment.id ? "bg-meq-sky-light/30" : ""}>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">
                          {TERM_LABELS[a.term] || a.term} {a.academicYear}
                          {a.id === assessment.id && <span className="text-xs text-meq-sky ml-1">(current)</span>}
                        </td>
                        {DOMAINS.map((domain) => {
                          const scoreKey = `${domain.charAt(0).toLowerCase()}${domain.slice(1)}Score` as keyof typeof a;
                          const score = (a[scoreKey] as number | null) ?? 0;
                          const prevScore = prev ? ((prev[scoreKey] as number | null) ?? 0) : null;
                          const diff = prevScore !== null ? score - prevScore : null;
                          return (
                            <td key={domain} className="text-center px-2 py-2 text-sm">
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
                          {prev && prev.totalScore !== null && a.totalScore !== null && (
                            <span className={`text-xs ml-1 ${
                              (a.totalScore - (prev.totalScore ?? 0)) > 0 ? "text-emerald-600" : (a.totalScore - (prev.totalScore ?? 0)) < 0 ? "text-red-500" : ""
                            }`}>
                              {(a.totalScore - (prev.totalScore ?? 0)) > 0 ? "+" : ""}
                              {(a.totalScore - (prev.totalScore ?? 0)).toFixed(1)}
                            </span>
                          )}
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
            const options = JSON.parse(q.answerOptions) as Array<{
              label: string;
              value: number;
            }>;
            const selectedOption = options.find((o) => o.value === answer);

            return (
              <div key={q.id} className="px-6 py-4">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-gray-400 mt-0.5 min-w-[28px]">
                    Q{q.orderIndex}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium">
                      {q.prompt}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {DOMAIN_LABELS[q.domain as Domain]}
                      </span>
                      {q.isTrap && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-medium">
                          Trap
                        </span>
                      )}
                      {q.isValidation && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                          Validation
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1">
                      {selectedOption ? (
                        <span className="text-meq-sky font-medium">
                          {selectedOption.label} ({answer})
                        </span>
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
