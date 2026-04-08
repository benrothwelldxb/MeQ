import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { getInterventionsForDomains } from "@/lib/interventions";
import {
  DOMAINS,
  DOMAIN_LABELS,
  DOMAIN_COLORS,
  type Domain,
  type Level,
} from "@/lib/constants";
import { getLevel } from "@/lib/scoring";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

function LevelBadge({ level }: { level: Level }) {
  const colors: Record<Level, string> = {
    Advanced: "bg-emerald-100 text-emerald-700",
    Secure: "bg-blue-100 text-blue-700",
    Developing: "bg-amber-100 text-amber-700",
    Emerging: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[level]}`}>
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

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: params.classGroupId },
    include: {
      yearGroup: true,
      teachers: { where: { id: session.teacherId } },
      students: {
        orderBy: { lastName: "asc" },
        include: {
          assessments: {
            where: {
              term: school.currentTerm,
              academicYear: school.academicYear,
              status: "completed",
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!classGroup || classGroup.teachers.length === 0) return notFound();

  const tier = classGroup.yearGroup.tier as "junior" | "standard";
  const completedStudents = classGroup.students.filter((s) => s.assessments.length > 0);

  // Calculate class averages per domain
  const domainTotals: Record<Domain, number> = { KnowMe: 0, ManageMe: 0, UnderstandOthers: 0, WorkWithOthers: 0, ChooseWell: 0 };
  for (const student of completedStudents) {
    const a = student.assessments[0];
    domainTotals.KnowMe += a.knowMeScore ?? 0;
    domainTotals.ManageMe += a.manageMeScore ?? 0;
    domainTotals.UnderstandOthers += a.understandOthersScore ?? 0;
    domainTotals.WorkWithOthers += a.workWithOthersScore ?? 0;
    domainTotals.ChooseWell += a.chooseWellScore ?? 0;
  }

  const count = completedStudents.length || 1;
  const domainAverages: Record<Domain, number> = {
    KnowMe: Math.round((domainTotals.KnowMe / count) * 10) / 10,
    ManageMe: Math.round((domainTotals.ManageMe / count) * 10) / 10,
    UnderstandOthers: Math.round((domainTotals.UnderstandOthers / count) * 10) / 10,
    WorkWithOthers: Math.round((domainTotals.WorkWithOthers / count) * 10) / 10,
    ChooseWell: Math.round((domainTotals.ChooseWell / count) * 10) / 10,
  };

  const domainLevels: Record<string, string> = {};
  for (const domain of DOMAINS) {
    domainLevels[domain] = getLevel(domainAverages[domain], tier);
  }

  // Find weakest 2 domains for class strategies
  const weakest = [...DOMAINS].sort((a, b) => domainAverages[a] - domainAverages[b]).slice(0, 2);

  // Get interventions for weakest domains
  const weakestLevels: Record<string, string> = {};
  for (const d of weakest) {
    weakestLevels[d] = domainLevels[d];
  }
  const interventions = await getInterventionsForDomains(weakestLevels, tier, "teacher");

  // Level distribution per domain
  const levelCounts: Record<Domain, Record<Level, number>> = {} as Record<Domain, Record<Level, number>>;
  for (const domain of DOMAINS) {
    levelCounts[domain] = { Emerging: 0, Developing: 0, Secure: 0, Advanced: 0 };
  }
  for (const student of completedStudents) {
    const a = student.assessments[0];
    const scores: Record<Domain, number> = {
      KnowMe: a.knowMeScore ?? 0,
      ManageMe: a.manageMeScore ?? 0,
      UnderstandOthers: a.understandOthersScore ?? 0,
      WorkWithOthers: a.workWithOthersScore ?? 0,
      ChooseWell: a.chooseWellScore ?? 0,
    };
    for (const domain of DOMAINS) {
      const level = getLevel(scores[domain], tier);
      levelCounts[domain][level]++;
    }
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
          {/* Class Domain Averages */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            {DOMAINS.map((domain) => {
              const colors = DOMAIN_COLORS[domain];
              return (
                <div key={domain} className={`${colors.bg} rounded-xl p-4 text-center border ${colors.border}`}>
                  <p className={`text-xs font-semibold ${colors.text} mb-1`}>{DOMAIN_LABELS[domain]}</p>
                  <p className={`text-2xl font-bold ${colors.text}`}>{domainAverages[domain]}</p>
                  <LevelBadge level={domainLevels[domain] as Level} />
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
                  {DOMAINS.map((domain) => (
                    <tr key={domain}>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">{DOMAIN_LABELS[domain]}</td>
                      <td className="px-3 py-2 text-center text-sm">{levelCounts[domain].Emerging || "—"}</td>
                      <td className="px-3 py-2 text-center text-sm">{levelCounts[domain].Developing || "—"}</td>
                      <td className="px-3 py-2 text-center text-sm">{levelCounts[domain].Secure || "—"}</td>
                      <td className="px-3 py-2 text-center text-sm">{levelCounts[domain].Advanced || "—"}</td>
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
                    {DOMAINS.map((d) => (
                      <th key={d} className="text-center px-2 py-2 text-xs font-semibold text-gray-500">{DOMAIN_LABELS[d]}</th>
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
                          <td colSpan={6} className="text-center text-xs">Not completed</td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={student.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <span className="flex items-center gap-2">
                            {student.firstName} {student.lastName}
                            {student.sen && <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">SEN</span>}
                          </span>
                        </td>
                        {DOMAINS.map((domain) => {
                          const scoreKey = `${domain.charAt(0).toLowerCase()}${domain.slice(1)}Score` as keyof typeof a;
                          const score = (a[scoreKey] as number | null) ?? 0;
                          const level = getLevel(score, tier);
                          return (
                            <td key={domain} className="text-center px-2 py-3">
                              <LevelBadge level={level} />
                            </td>
                          );
                        })}
                        <td className="text-center px-3 py-3">
                          <LevelBadge level={(a.overallLevel as Level) ?? "Emerging"} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Class Strategies */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-1">Suggested Class Strategies</h2>
            <p className="text-sm text-gray-500 mb-4">
              Based on the class&apos;s areas for development
            </p>
            {weakest.map((domain) => {
              const colors = DOMAIN_COLORS[domain];
              const domainInterventions = interventions[domain] || [];
              return (
                <div key={domain} className={`${colors.bg} rounded-lg p-4 mb-3 last:mb-0 border ${colors.border}`}>
                  <p className={`font-semibold ${colors.text} mb-2`}>
                    {DOMAIN_LABELS[domain]} — Class average: {domainLevels[domain]}
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
        </>
      )}
    </div>
  );
}
