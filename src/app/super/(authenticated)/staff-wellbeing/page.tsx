import { prisma } from "@/lib/db";

const COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-500/20 text-blue-400",
  emerald: "bg-emerald-500/20 text-emerald-400",
  purple: "bg-purple-500/20 text-purple-400",
  amber: "bg-amber-500/20 text-amber-400",
  rose: "bg-rose-500/20 text-rose-400",
  red: "bg-red-500/20 text-red-400",
  green: "bg-green-500/20 text-green-400",
  indigo: "bg-indigo-500/20 text-indigo-400",
  pink: "bg-pink-500/20 text-pink-400",
  teal: "bg-teal-500/20 text-teal-400",
};

export default async function SuperStaffWellbeingPage() {
  const domains = await prisma.staffDomain.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
      pulseQuestions: true,
    },
  });

  const config = await prisma.staffScoringConfig.findUnique({ where: { key: "default" } });

  // Platform-wide stats
  const schoolsWithStaffWellbeing = await prisma.school.count({
    where: { staffWellbeingEnabled: true },
  });
  const totalSchools = await prisma.school.count();
  const totalAssessments = await prisma.staffAssessment.count({
    where: { status: "completed" },
  });
  const totalPulseChecks = await prisma.staffPulseCheck.count({
    where: { completedAt: { not: null } },
  });

  const totalQuestions = domains.reduce((sum, d) => sum + d.questions.length, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Staff Wellbeing</h1>
      <p className="text-gray-400 mb-6">
        System-wide staff wellbeing configuration. All schools using staff wellbeing share this content.
      </p>

      {/* Platform stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <p className="text-xs text-gray-500 mb-1">Schools Enabled</p>
          <p className="text-2xl font-bold text-white">
            {schoolsWithStaffWellbeing} <span className="text-sm font-normal text-gray-500">/ {totalSchools}</span>
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <p className="text-xs text-gray-500 mb-1">Staff Assessments</p>
          <p className="text-2xl font-bold text-white">{totalAssessments}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <p className="text-xs text-gray-500 mb-1">Pulse Check-ins</p>
          <p className="text-2xl font-bold text-white">{totalPulseChecks}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Questions</p>
          <p className="text-2xl font-bold text-white">{totalQuestions}</p>
        </div>
      </div>

      {/* Domains and questions */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
        <h2 className="font-bold text-white mb-1">Staff Domains</h2>
        <p className="text-sm text-gray-400 mb-4">
          {domains.length} domains with {totalQuestions} questions across the platform
        </p>

        {domains.map((d) => (
          <div key={d.id} className="mb-6 last:mb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${COLOR_CLASSES[d.color] || COLOR_CLASSES.blue}`}>
                  {d.label}
                </span>
                <span className="text-xs text-gray-500 font-mono">{d.key}</span>
              </div>
              <span className="text-xs text-gray-500">{d.questions.length} questions</span>
            </div>
            {d.description && (
              <p className="text-xs text-gray-400 mb-2">{d.description}</p>
            )}
            <div className="bg-gray-900/50 rounded-lg p-3 space-y-1">
              {d.questions.map((q) => (
                <div key={q.id} className="text-xs text-gray-300 flex items-start gap-2">
                  <span className="text-gray-500 font-mono w-6 flex-shrink-0">Q{q.orderIndex}</span>
                  <span className="flex-1">{q.prompt}</span>
                </div>
              ))}
              {d.questions.length === 0 && (
                <p className="text-xs text-gray-500">No questions yet for this domain.</p>
              )}
            </div>
            {d.pulseQuestions.length > 0 && (
              <div className="mt-2 text-xs text-gray-400">
                <span className="font-medium">Pulse:</span> {d.pulseQuestions[0].emoji} {d.pulseQuestions[0].prompt}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Scoring config */}
      {config && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="font-bold text-white mb-3">Scoring Configuration</h2>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-2">Per-Domain Levels</p>
              <div className="space-y-1">
                {(JSON.parse(config.thresholds) as Array<{ level: string; min: number }>)
                  .slice()
                  .reverse()
                  .map((t) => (
                    <div key={t.level} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{t.level}</span>
                      <span className="font-mono text-gray-500">{t.min}+</span>
                    </div>
                  ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Max domain score: {config.maxDomainScore}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Overall Levels</p>
              <div className="space-y-1">
                {(JSON.parse(config.overallThresholds) as Array<{ level: string; min: number }>)
                  .slice()
                  .reverse()
                  .map((t) => (
                    <div key={t.level} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{t.level}</span>
                      <span className="font-mono text-gray-500">{t.min}+</span>
                    </div>
                  ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Max total score: {config.maxTotalScore}</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-6">
        Edit staff wellbeing content via the Prisma schema or seed file. A dedicated builder UI is planned for a future release.
      </p>
    </div>
  );
}
