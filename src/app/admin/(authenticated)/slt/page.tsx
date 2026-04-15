import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { getSchoolFramework } from "@/lib/framework";
import { type Level } from "@/lib/constants";
import StatCard from "@/components/admin/StatCard";
import LevelChip from "@/components/LevelChip";
import TermTrendChart from "@/components/slt/TermTrendChart";
import Link from "next/link";

export default async function SLTDashboard() {
  const session = await getAdminSession();
  const school = await getSchoolSettings(session.schoolId);

  const yearGroups = await prisma.yearGroup.findMany({
    where: { schoolId: session.schoolId },
    orderBy: { sortOrder: "asc" },
    include: {
      students: {
        include: {
          assessments: {
            where: { term: school.currentTerm, academicYear: school.academicYear, status: "completed" },
            take: 1,
          },
        },
      },
    },
  });

  // Aggregate stats
  let totalStudents = 0;
  let totalCompleted = 0;
  let totalScore = 0;

  const yearGroupStats = yearGroups.map((yg) => {
    const students = yg.students;
    const completed = students.filter((s) => s.assessments.length > 0);
    const scores = completed.map((s) => s.assessments[0].totalScore ?? 0);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // Level distribution
    const levelCounts: Record<string, number> = { Emerging: 0, Developing: 0, Secure: 0, Advanced: 0 };
    completed.forEach((s) => {
      const level = s.assessments[0].overallLevel || "Emerging";
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });

    totalStudents += students.length;
    totalCompleted += completed.length;
    totalScore += scores.reduce((a, b) => a + b, 0);

    return { ...yg, studentCount: students.length, completedCount: completed.length, avgScore: avg, levelCounts };
  });

  const overallAvg = totalCompleted > 0 ? Math.round(totalScore / totalCompleted) : 0;
  const completionRate = totalStudents > 0 ? Math.round((totalCompleted / totalStudents) * 100) : 0;

  // ===== Term-over-term trend data =====
  const framework = await getSchoolFramework(session.schoolId);
  const scoringModel =
    framework.scoringModels.standard ?? Object.values(framework.scoringModels)[0];
  const maxTotal = scoringModel?.maxTotalScore ?? 130;

  const allCompleted = await prisma.assessment.findMany({
    where: {
      status: "completed",
      student: { schoolId: session.schoolId },
    },
    select: {
      term: true,
      academicYear: true,
      totalScore: true,
      domainScoresJson: true,
    },
  });

  // Group by (academicYear, term) → average totals + per-domain
  const termKey = (a: { term: string; academicYear: string }) => `${a.academicYear}|${a.term}`;
  const groupedByTerm = new Map<string, typeof allCompleted>();
  for (const a of allCompleted) {
    const k = termKey(a);
    if (!groupedByTerm.has(k)) groupedByTerm.set(k, []);
    groupedByTerm.get(k)!.push(a);
  }

  const trendData = Array.from(groupedByTerm.entries())
    .map(([key, rows]) => {
      const [academicYear, term] = key.split("|");
      const totalAvg =
        rows.length > 0
          ? Math.round((rows.reduce((s, r) => s + (r.totalScore ?? 0), 0) / rows.length) * 10) / 10
          : 0;

      const domains: Record<string, number> = {};
      for (const d of framework.domains) {
        const scores: number[] = [];
        for (const r of rows) {
          if (!r.domainScoresJson) continue;
          try {
            const parsed = JSON.parse(r.domainScoresJson) as Record<string, number>;
            const v = parsed[d.key];
            if (typeof v === "number") scores.push(v);
          } catch {
            // ignore
          }
        }
        domains[d.key] =
          scores.length > 0
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
            : 0;
      }

      return {
        academicYear,
        term,
        label: `${TERM_LABELS[term] ?? term} '${academicYear.slice(2, 4)}-${academicYear.slice(7, 9)}`,
        total: totalAvg,
        domains,
        sortKey: `${academicYear}|${term}`,
      };
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SLT Dashboard — {school.name}</h1>
          <p className="text-gray-500 mt-1">{TERM_LABELS[school.currentTerm]} — {school.academicYear}</p>
        </div>
        <Link
          href="/admin/slt/class-comparison"
          className="px-4 py-2 rounded-lg text-sm font-medium text-meq-sky border border-meq-sky hover:bg-meq-sky hover:text-white transition-all"
        >
          Compare classes &rarr;
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Students" value={totalStudents} />
        <StatCard label="Completed" value={totalCompleted} sublabel={`${completionRate}% completion`} />
        <StatCard label="Avg MeQ Score" value={overallAvg > 0 ? overallAvg : "—"} />
        <StatCard label="Year Groups" value={yearGroups.length} />
      </div>

      {/* Term-over-term trend */}
      {trendData.length >= 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between mb-2 gap-3 flex-wrap">
            <div>
              <h2 className="font-bold text-gray-900">School trend over time</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Average MeQ score per term, across all completed assessments. Background shows level bands.
              </p>
            </div>
          </div>
          <TermTrendChart data={trendData} domains={framework.domains} maxTotal={maxTotal} />
        </div>
      )}

      {/* Per-domain trend */}
      {trendData.length >= 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="font-bold text-gray-900 mb-1">Domain trends over time</h2>
          <p className="text-xs text-gray-500 mb-4">
            One line per domain — spot which areas are improving or sliding.
          </p>
          <TermTrendChart
            data={trendData}
            domains={framework.domains}
            maxTotal={(scoringModel?.maxDomainScore ?? 26)}
            showDomains
          />
        </div>
      )}

      {/* Year Group Breakdown */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">By Year Group</h2>
      <div className="space-y-4">
        {yearGroupStats.map((yg) => (
          <Link
            key={yg.id}
            href={`/admin/slt/year/${yg.id}`}
            className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-meq-sky hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-gray-900">{yg.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  yg.tier === "junior" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                }`}>{yg.tier}</span>
              </div>
              <span className="text-sm text-gray-500">
                {yg.completedCount} / {yg.studentCount} completed
              </span>
            </div>

            {yg.completedCount > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Avg: <strong>{yg.avgScore}</strong></span>
                <div className="flex gap-2">
                  {(["Emerging", "Developing", "Secure", "Advanced"] as Level[]).map((level) => (
                    yg.levelCounts[level] > 0 && (
                      <div key={level} className="flex items-center gap-1">
                        <LevelChip level={level} size="sm" />
                        <span className="text-xs text-gray-500">{yg.levelCounts[level]}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
