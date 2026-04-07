import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { DOMAINS, DOMAIN_LABELS, MAX_TOTAL_SCORE, type Domain, type Level, type Tier } from "@/lib/constants";
import LevelChip from "@/components/LevelChip";
import DomainCard from "@/components/DomainCard";
import Link from "next/link";

export default async function AdminResultDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
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
