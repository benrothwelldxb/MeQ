import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { getSchoolFramework } from "@/lib/framework";
import { getDomainTailwind } from "@/lib/domain-colors";
import Link from "next/link";

const LEVEL_STYLES: Record<string, string> = {
  Emerging: "bg-red-100 text-red-700",
  Developing: "bg-amber-100 text-amber-700",
  Secure: "bg-blue-100 text-blue-700",
  Advanced: "bg-emerald-100 text-emerald-700",
};

function heatColor(score: number, max: number): string {
  if (score === 0) return "bg-gray-50 text-gray-400";
  const pct = score / max;
  if (pct >= 0.75) return "bg-emerald-100 text-emerald-800";
  if (pct >= 0.55) return "bg-blue-100 text-blue-800";
  if (pct >= 0.4) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export default async function ClassComparisonPage() {
  const session = await getAdminSession();
  const school = await getSchoolSettings(session.schoolId);
  const framework = await getSchoolFramework(session.schoolId);
  const scoringModel =
    framework.scoringModels.standard ??
    Object.values(framework.scoringModels)[0];
  const maxDomainScore = scoringModel?.maxDomainScore ?? 26;

  const yearGroups = await prisma.yearGroup.findMany({
    where: { schoolId: session.schoolId },
    orderBy: { sortOrder: "asc" },
    include: {
      classes: {
        orderBy: { name: "asc" },
        include: {
          students: {
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
      },
    },
  });

  // Filter to year groups that have at least one class with completed assessments
  const yearGroupsWithData = yearGroups
    .map((yg) => {
      const classes = yg.classes.map((cg) => {
        const completed = cg.students.filter((s) => s.assessments.length > 0);
        const totalScore = completed.reduce((sum, s) => sum + (s.assessments[0].totalScore ?? 0), 0);
        const avgScore = completed.length > 0 ? Math.round((totalScore / completed.length) * 10) / 10 : 0;

        // Per-domain average
        const domainAverages: Record<string, number> = {};
        for (const d of framework.domains) {
          const scores = completed
            .map((s) => {
              const json = s.assessments[0].domainScoresJson;
              if (!json) return null;
              try {
                return (JSON.parse(json) as Record<string, number>)[d.key];
              } catch {
                return null;
              }
            })
            .filter((v): v is number => typeof v === "number");
          domainAverages[d.key] =
            scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
        }

        // Level distribution
        const levelCounts: Record<string, number> = { Emerging: 0, Developing: 0, Secure: 0, Advanced: 0 };
        for (const s of completed) {
          const level = s.assessments[0].overallLevel || "Emerging";
          levelCounts[level] = (levelCounts[level] || 0) + 1;
        }

        return {
          id: cg.id,
          name: cg.name,
          studentCount: cg.students.length,
          completedCount: completed.length,
          avgScore,
          domainAverages,
          levelCounts,
        };
      });

      const hasData = classes.some((c) => c.completedCount > 0);
      return { ...yg, classData: classes, hasData };
    })
    .filter((yg) => yg.classes.length >= 2 || yg.hasData);

  return (
    <div>
      <Link href="/admin/slt" className="text-sm text-meq-sky hover:underline">
        &larr; Back to SLT Dashboard
      </Link>
      <div className="mt-2 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Class Comparison</h1>
        <p className="text-gray-500 mt-1">
          Side-by-side averages and level distribution for each class — {TERM_LABELS[school.currentTerm]} {school.academicYear}
        </p>
      </div>

      {yearGroupsWithData.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            No classes with completed assessments yet, or year groups don&apos;t have multiple classes to compare.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {yearGroupsWithData.map((yg) => (
            <div key={yg.id}>
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                {yg.name}
                <span className="text-xs font-normal text-gray-400">
                  ({yg.classes.length} {yg.classes.length === 1 ? "class" : "classes"})
                </span>
              </h2>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg score</th>
                        {framework.domains.map((d) => {
                          const tw = getDomainTailwind(d.color);
                          return (
                            <th key={d.key} className={`text-center px-3 py-3 text-xs font-semibold ${tw.text}`}>
                              {d.label}
                            </th>
                          );
                        })}
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Level distribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {yg.classData.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Link href={`/admin/slt/class/${c.id}`} className="text-sm font-medium text-meq-sky hover:underline">
                              {c.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {c.completedCount} / {c.studentCount}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-bold text-gray-900">
                              {c.completedCount > 0 ? c.avgScore : "—"}
                            </span>
                          </td>
                          {framework.domains.map((d) => (
                            <td key={d.key} className="px-3 py-3 text-center">
                              <span
                                className={`inline-block min-w-[42px] text-xs font-bold rounded px-2 py-1 ${heatColor(
                                  c.domainAverages[d.key],
                                  maxDomainScore
                                )}`}
                              >
                                {c.completedCount > 0 ? c.domainAverages[d.key] : "—"}
                              </span>
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {(["Emerging", "Developing", "Secure", "Advanced"] as const).map((lvl) => (
                                c.levelCounts[lvl] > 0 ? (
                                  <span
                                    key={lvl}
                                    className={`text-xs px-2 py-0.5 rounded-full ${LEVEL_STYLES[lvl]}`}
                                    title={`${lvl}: ${c.levelCounts[lvl]}`}
                                  >
                                    {c.levelCounts[lvl]}
                                  </span>
                                ) : null
                              ))}
                              {c.completedCount === 0 && <span className="text-xs text-gray-400">—</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 mt-6">
            <p className="font-medium mb-2">Heat colours (per-domain averages out of {maxDomainScore})</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-block px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">≥ 75%</span>
              <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-bold">≥ 55%</span>
              <span className="inline-block px-2 py-1 rounded bg-amber-100 text-amber-800 font-bold">≥ 40%</span>
              <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-800 font-bold">&lt; 40%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
