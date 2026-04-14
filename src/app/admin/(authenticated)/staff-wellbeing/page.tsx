import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import DeployButton from "./DeployButton";
import NudgeButton from "./NudgeButton";

const MIN_COHORT = 5;

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

export default async function AdminStaffWellbeingPage() {
  const session = await getAdminSession();
  const school = await getSchoolSettings(session.schoolId);

  if (!school.staffWellbeingEnabled) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Staff Wellbeing</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-2">Staff wellbeing is not enabled.</p>
          <a href="/admin/settings" className="text-sm text-meq-sky hover:underline">Enable in Settings</a>
        </div>
      </div>
    );
  }

  const domains = await prisma.staffDomain.findMany({
    orderBy: { sortOrder: "asc" },
  });

  // Get all staff in school
  const totalStaff = await prisma.teacher.count({ where: { schoolId: session.schoolId } });

  // How many staff have been notified this term?
  const schoolTeacherIds = await prisma.teacher.findMany({
    where: { schoolId: session.schoolId },
    select: { id: true },
  });
  const notifiedThisTerm = await prisma.staffWellbeingNotification.count({
    where: {
      term: school.currentTerm,
      academicYear: school.academicYear,
      teacherId: { in: schoolTeacherIds.map((t) => t.id) },
    },
  });

  const scoringConfig = await prisma.staffScoringConfig.findUnique({ where: { key: "default" } });
  const maxDomainScore = scoringConfig?.maxDomainScore ?? 16;
  const domainThresholds: Array<{ level: string; min: number }> = scoringConfig?.thresholds
    ? JSON.parse(scoringConfig.thresholds)
    : [];

  function levelFor(score: number): string {
    // thresholds are stored ascending ({min:0,...},{min:8,...}) — find the highest one met
    let current = "Emerging";
    for (const t of domainThresholds) {
      if (score >= t.min) current = t.level;
    }
    return current;
  }

  const LEVEL_STYLES: Record<string, string> = {
    Emerging: "bg-red-100 text-red-700",
    Developing: "bg-amber-100 text-amber-700",
    Secure: "bg-blue-100 text-blue-700",
    Advanced: "bg-emerald-100 text-emerald-700",
  };

  const lastNudge = await prisma.staffWellbeingNudge.findFirst({
    where: {
      schoolId: session.schoolId,
      term: school.currentTerm,
      academicYear: school.academicYear,
    },
    orderBy: { sentAt: "desc" },
    select: { sentAt: true },
  });

  // Get all completed assessments this term
  const assessments = await prisma.staffAssessment.findMany({
    where: {
      status: "completed",
      term: school.currentTerm,
      academicYear: school.academicYear,
      teacher: { schoolId: session.schoolId },
    },
  });

  const completedCount = assessments.length;
  const cohortReady = completedCount >= MIN_COHORT;

  // Calculate aggregated averages (only if cohort is large enough)
  const domainAverages: Record<string, number> = {};
  for (const d of domains) domainAverages[d.key] = 0;

  if (cohortReady) {
    const totals: Record<string, number> = {};
    for (const d of domains) totals[d.key] = 0;

    for (const a of assessments) {
      if (!a.domainScoresJson) continue;
      const scores = JSON.parse(a.domainScoresJson) as Record<string, number>;
      for (const d of domains) {
        totals[d.key] += scores[d.key] ?? 0;
      }
    }

    for (const d of domains) {
      domainAverages[d.key] = Math.round((totals[d.key] / completedCount) * 10) / 10;
    }
  }

  // Level distribution per domain
  const levelCounts: Record<string, Record<string, number>> = {};
  for (const d of domains) {
    levelCounts[d.key] = { Emerging: 0, Developing: 0, Secure: 0, Advanced: 0 };
  }

  if (cohortReady) {
    for (const a of assessments) {
      if (!a.domainLevelsJson) continue;
      const levels = JSON.parse(a.domainLevelsJson) as Record<string, string>;
      for (const d of domains) {
        const level = levels[d.key];
        if (level && levelCounts[d.key][level] !== undefined) {
          levelCounts[d.key][level]++;
        }
      }
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Staff Wellbeing</h1>
          <p className="text-gray-500">
            {TERM_LABELS[school.currentTerm]} — {school.academicYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NudgeButton
            incompleteCount={Math.max(totalStaff - completedCount, 0)}
            lastNudgedAt={lastNudge?.sentAt ?? null}
          />
          <DeployButton totalStaff={totalStaff} notifiedCount={notifiedThisTerm} />
        </div>
      </div>

      {/* Privacy banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-900">Aggregated data only</p>
            <p className="text-xs text-blue-700 mt-1">
              Individual staff responses are private. Data is only shown when at least {MIN_COHORT} staff members have completed the assessment this term.
            </p>
          </div>
        </div>
      </div>

      {/* Participation */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Staff</p>
          <p className="text-2xl font-bold text-gray-900">{totalStaff}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Completed</p>
          <p className="text-2xl font-bold text-gray-900">
            {completedCount} <span className="text-sm font-normal text-gray-400">/ {totalStaff}</span>
          </p>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2">
            <div
              className="h-full bg-meq-sky rounded-full"
              style={{ width: `${totalStaff ? Math.round((completedCount / totalStaff) * 100) : 0}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Cohort Status</p>
          <p className={`text-2xl font-bold ${cohortReady ? "text-emerald-600" : "text-amber-600"}`}>
            {cohortReady ? "Ready" : `${MIN_COHORT - completedCount} more`}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {cohortReady ? "Data visible below" : `needed before data is shown`}
          </p>
        </div>
      </div>

      {!cohortReady ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-1">
            Staff wellbeing data will appear when {MIN_COHORT} or more staff members have completed the assessment.
          </p>
          <p className="text-xs text-gray-400">
            Currently: {completedCount}/{MIN_COHORT}
          </p>
        </div>
      ) : (
        <>
          {/* Domain averages */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-1">Staff Wellbeing by Domain</h2>
            <p className="text-xs text-gray-500 mb-4">
              Average score out of {maxDomainScore}, across {completedCount} staff responses.
            </p>
            <div className={`grid gap-3 ${domains.length <= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
              {domains.map((d) => {
                const colors = COLOR_STYLES[d.color] || COLOR_STYLES.blue;
                const score = domainAverages[d.key];
                const level = levelFor(score);
                const pct = Math.min(100, Math.max(0, Math.round((score / maxDomainScore) * 100)));
                return (
                  <div key={d.key} className={`${colors.bg} rounded-xl p-4 border ${colors.border}`}>
                    <p className={`text-xs font-semibold ${colors.text} mb-2`}>{d.label}</p>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className={`text-2xl font-bold ${colors.text}`}>{score}</span>
                      <span className={`text-xs ${colors.text} opacity-70`}>/ {maxDomainScore}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full ${colors.text.replace("text-", "bg-")} rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${LEVEL_STYLES[level]}`}>
                      {level}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Level distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">Level Distribution</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Domain</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-red-600">Emerging</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-amber-600">Developing</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-blue-600">Secure</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-emerald-600">Advanced</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {domains.map((d) => (
                    <tr key={d.key}>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">{d.label}</td>
                      <td className="px-3 py-2 text-center text-sm">{levelCounts[d.key]?.Emerging || "—"}</td>
                      <td className="px-3 py-2 text-center text-sm">{levelCounts[d.key]?.Developing || "—"}</td>
                      <td className="px-3 py-2 text-center text-sm">{levelCounts[d.key]?.Secure || "—"}</td>
                      <td className="px-3 py-2 text-center text-sm">{levelCounts[d.key]?.Advanced || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Number of staff in each level band per domain. No individual staff members are identified.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
