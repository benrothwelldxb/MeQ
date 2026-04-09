import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { getSchoolFramework, getLevelFromThresholds } from "@/lib/framework";
import { getInterventionsForDomains } from "@/lib/interventions";
import { type Level } from "@/lib/constants";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

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

function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Advanced: "bg-emerald-100 text-emerald-700",
    Secure: "bg-blue-100 text-blue-700",
    Developing: "bg-amber-100 text-amber-700",
    Emerging: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[level] || "bg-gray-100 text-gray-700"}`}>
      {level}
    </span>
  );
}

export default async function ClassResultsPage({
  params,
}: {
  params: { classGroupId: string };
}) {
  const session = await getTeacherSession();
  if (!session.teacherId) redirect("/teacher/login");

  const school = await getSchoolSettings(session.schoolId);
  const framework = await getSchoolFramework(session.schoolId);
  const domains = framework.domains;
  const tier = "standard"; // Will be determined by class year group below

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: params.classGroupId },
    include: {
      yearGroup: true,
      teachers: { where: { id: session.teacherId } },
      students: {
        orderBy: { lastName: "asc" },
        include: {
          assessments: {
            where: { term: school.currentTerm, academicYear: school.academicYear, status: "completed" },
            take: 1,
          },
        },
      },
    },
  });

  if (!classGroup || classGroup.teachers.length === 0) return notFound();

  const classTier = classGroup.yearGroup.tier || "standard";
  const scoringModel = framework.scoringModels[classTier];
  const thresholds = scoringModel?.thresholds || [];
  const completedStudents = classGroup.students.filter((s) => s.assessments.length > 0);

  // Calculate class averages per domain — dynamically
  const domainTotals: Record<string, number> = {};
  for (const d of domains) domainTotals[d.key] = 0;

  for (const student of completedStudents) {
    const a = student.assessments[0];
    const scores: Record<string, number> = a.domainScoresJson
      ? JSON.parse(a.domainScoresJson)
      : {};
    for (const d of domains) {
      domainTotals[d.key] += scores[d.key] ?? 0;
    }
  }

  const count = completedStudents.length || 1;
  const domainAverages: Record<string, number> = {};
  const domainLevels: Record<string, string> = {};
  for (const d of domains) {
    domainAverages[d.key] = Math.round((domainTotals[d.key] / count) * 10) / 10;
    domainLevels[d.key] = getLevelFromThresholds(domainAverages[d.key], thresholds);
  }

  // Weakest domains for strategies
  const strengthCount = Math.min(2, Math.floor(domains.length / 2)) || 1;
  const weakest = domains
    .map((d) => d.key)
    .sort((a, b) => (domainAverages[a] ?? 0) - (domainAverages[b] ?? 0))
    .slice(0, strengthCount);

  const weakestLevels: Record<string, string> = {};
  for (const d of weakest) weakestLevels[d] = domainLevels[d];
  const interventions = await getInterventionsForDomains(weakestLevels, classTier, "teacher");

  // Level distribution
  const levelCounts: Record<string, Record<string, number>> = {};
  for (const d of domains) {
    levelCounts[d.key] = { Emerging: 0, Developing: 0, Secure: 0, Advanced: 0 };
  }
  for (const student of completedStudents) {
    const a = student.assessments[0];
    const scores: Record<string, number> = a.domainScoresJson ? JSON.parse(a.domainScoresJson) : {};
    for (const d of domains) {
      const level = getLevelFromThresholds(scores[d.key] ?? 0, thresholds);
      levelCounts[d.key][level] = (levelCounts[d.key][level] || 0) + 1;
    }
  }

  // Build label/color maps
  const labelMap: Record<string, string> = {};
  const colorStyles: Record<string, typeof COLOR_STYLES["blue"]> = {};
  for (const d of domains) {
    labelMap[d.key] = d.label;
    colorStyles[d.key] = COLOR_STYLES[d.color] || COLOR_STYLES.blue;
  }

  return (
    <div className="max-w-4xl">
      <Link href="/teacher" className="text-sm text-meq-sky hover:underline">&larr; Back to Classes</Link>

      <div className="flex items-center justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {classGroup.yearGroup.name} — {classGroup.name}
          </h1>
          <p className="text-gray-500 mt-1">
            {TERM_LABELS[school.currentTerm]} — {completedStudents.length} of {classGroup.students.length} assessments completed
          </p>
        </div>
        <Link
          href={`/teacher/class/${params.classGroupId}/report`}
          className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download Report
        </Link>
      </div>

      {completedStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No completed assessments yet for this class.</p>
        </div>
      ) : (
        <>
          {/* Domain Averages — dynamic grid */}
          <div className={`grid gap-3 mb-6 ${domains.length <= 4 ? "grid-cols-2 sm:grid-cols-4" : domains.length <= 6 ? "grid-cols-3 sm:grid-cols-" + domains.length : "grid-cols-2 sm:grid-cols-4"}`}>
            {domains.map((d) => {
              const colors = colorStyles[d.key];
              return (
                <div key={d.key} className={`${colors.bg} rounded-xl p-4 text-center border ${colors.border}`}>
                  <p className={`text-xs font-semibold ${colors.text} mb-1`}>{d.label}</p>
                  <p className={`text-2xl font-bold ${colors.text}`}>{domainAverages[d.key]}</p>
                  <LevelBadge level={domainLevels[d.key]} />
                </div>
              );
            })}
          </div>

          {/* Level Distribution */}
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
          </div>

          {/* Student Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Student Results</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Student</th>
                    {domains.map((d) => (
                      <th key={d.key} className="text-center px-2 py-2 text-xs font-semibold text-gray-500">{d.label}</th>
                    ))}
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Overall</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {classGroup.students.map((student) => {
                    const a = student.assessments[0];
                    if (!a) {
                      return (
                        <tr key={student.id} className="text-gray-400">
                          <td className="px-4 py-3 text-sm">
                            <span className="flex items-center gap-2">
                              {student.firstName} {student.lastName}
                              {student.sen && <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">SEN</span>}
                            </span>
                          </td>
                          <td colSpan={domains.length + 1} className="text-center text-xs">Not completed</td>
                        </tr>
                      );
                    }
                    const scores: Record<string, number> = a.domainScoresJson ? JSON.parse(a.domainScoresJson) : {};
                    const levels: Record<string, string> = a.domainLevelsJson ? JSON.parse(a.domainLevelsJson) : {};
                    return (
                      <tr key={student.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <span className="flex items-center gap-2">
                            {student.firstName} {student.lastName}
                            {student.sen && <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">SEN</span>}
                          </span>
                        </td>
                        {domains.map((d) => (
                          <td key={d.key} className="text-center px-2 py-3">
                            <LevelBadge level={levels[d.key] || getLevelFromThresholds(scores[d.key] ?? 0, thresholds)} />
                          </td>
                        ))}
                        <td className="text-center px-3 py-3">
                          <LevelBadge level={(a.overallLevel as string) ?? "Emerging"} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Strategies */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-1">Suggested Class Strategies</h2>
            <p className="text-sm text-gray-500 mb-4">Based on the class&apos;s areas for development</p>
            {weakest.map((domainKey) => {
              const colors = colorStyles[domainKey];
              const domainInterventions = interventions[domainKey] || [];
              return (
                <div key={domainKey} className={`${colors.bg} rounded-lg p-4 mb-3 last:mb-0 border ${colors.border}`}>
                  <p className={`font-semibold ${colors.text} mb-2`}>
                    {labelMap[domainKey]} — Class average: {domainLevels[domainKey]}
                  </p>
                  {domainInterventions.length > 0 ? (
                    <ul className="space-y-2">
                      {domainInterventions.map((int) => (
                        <li key={int.id} className="text-sm text-gray-700">
                          <span className="font-medium">{int.title}</span>
                          <span className="text-gray-500"> — {int.description}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No specific strategies available for this level.</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Weekly Pulse */}
          {school.pulseEnabled && await (async () => {
            const studentIds = classGroup.students.map((s) => s.id);
            const sixWeeksAgo = new Date();
            sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

            const pulseChecks = await prisma.pulseCheck.findMany({
              where: { studentId: { in: studentIds }, weekOf: { gte: sixWeeksAgo }, completedAt: { not: null } },
              orderBy: { weekOf: "asc" },
            });

            if (pulseChecks.length === 0) return null;

            const weeks = Array.from(new Set(pulseChecks.map((p) => p.weekOf.toISOString()))).sort();

            const weeklyAverages = weeks.map((weekIso) => {
              const weekChecks = pulseChecks.filter((p) => p.weekOf.toISOString() === weekIso);
              const avgs: Record<string, number> = {};
              for (const d of domains) {
                const values = weekChecks
                  .map((p) => (JSON.parse(p.answers) as Record<string, number>)[d.key])
                  .filter((v) => v !== undefined);
                avgs[d.key] = values.length > 0 ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10 : 0;
              }
              return { week: new Date(weekIso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), count: weekChecks.length, ...avgs };
            });

            return (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-bold text-gray-900">Weekly Pulse</h2>
                  <span className="text-xs text-gray-400">Last 6 weeks</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Week</th>
                        <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500">Responses</th>
                        {domains.map((d) => (
                          <th key={d.key} className={`text-center px-2 py-2 text-xs font-semibold ${colorStyles[d.key].text}`}>{d.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {weeklyAverages.map((row, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{row.week}</td>
                          <td className="text-center px-2 py-2 text-sm text-gray-500">{row.count}</td>
                          {domains.map((d) => {
                            const val = (row as Record<string, number | string>)[d.key] as number;
                            const color = val >= 4 ? "text-emerald-600" : val >= 3 ? "text-gray-700" : val >= 2 ? "text-amber-600" : "text-red-600";
                            return <td key={d.key} className={`text-center px-2 py-2 text-sm font-medium ${color}`}>{val > 0 ? val : "—"}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
