import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { getSchoolFramework } from "@/lib/framework";
import { type Level } from "@/lib/constants";
import { notFound } from "next/navigation";
import LevelChip from "@/components/LevelChip";
import StatCard from "@/components/admin/StatCard";
import TermTrendChart from "@/components/slt/TermTrendChart";
import Link from "next/link";

export default async function SLTYearGroupPage({
  params,
}: {
  params: { yearGroupId: string };
}) {
  const session = await getAdminSession();
  const school = await getSchoolSettings(session.schoolId);

  const yearGroup = await prisma.yearGroup.findUnique({
    where: { id: params.yearGroupId },
    include: {
      classes: {
        orderBy: { name: "asc" },
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
      },
    },
  });

  if (!yearGroup) return notFound();
  if (yearGroup.schoolId !== session.schoolId) return notFound();

  // Cohort trend: pull all completed assessments for any student
  // currently in this year group, across every term they have data.
  const framework = await getSchoolFramework(session.schoolId);
  const scoringModel =
    framework.scoringModels.standard ?? Object.values(framework.scoringModels)[0];
  const maxTotal = scoringModel?.maxTotalScore ?? 130;
  const studentIds = yearGroup.classes.flatMap((c) => c.students.map((s) => s.id));

  const allCompleted = studentIds.length > 0
    ? await prisma.assessment.findMany({
        where: { studentId: { in: studentIds }, status: "completed" },
        select: { term: true, academicYear: true, totalScore: true, domainScoresJson: true },
      })
    : [];

  const termKey = (a: { term: string; academicYear: string }) => `${a.academicYear}|${a.term}`;
  const grouped = new Map<string, typeof allCompleted>();
  for (const a of allCompleted) {
    const k = termKey(a);
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(a);
  }

  const cohortTrend = Array.from(grouped.entries())
    .map(([key, rows]) => {
      const [academicYear, term] = key.split("|");
      const totalAvg =
        rows.length > 0
          ? Math.round((rows.reduce((s, r) => s + (r.totalScore ?? 0), 0) / rows.length) * 10) / 10
          : 0;
      const domainScores: Record<string, number> = {};
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
        domainScores[d.key] =
          scores.length > 0
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
            : 0;
      }
      return {
        sortKey: key,
        label: `${TERM_LABELS[term] ?? term} '${academicYear.slice(2, 4)}-${academicYear.slice(7, 9)}`,
        total: totalAvg,
        domains: domainScores,
      };
    })
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const classStats = yearGroup.classes.map((cls) => {
    const students = cls.students;
    const completed = students.filter((s) => s.assessments.length > 0);
    const scores = completed.map((s) => s.assessments[0].totalScore ?? 0);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const levelCounts: Record<string, number> = { Emerging: 0, Developing: 0, Secure: 0, Advanced: 0 };
    completed.forEach((s) => {
      const level = s.assessments[0].overallLevel || "Emerging";
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });

    return { ...cls, studentCount: students.length, completedCount: completed.length, avgScore: avg, levelCounts };
  });

  const totalStudents = classStats.reduce((sum, c) => sum + c.studentCount, 0);
  const totalCompleted = classStats.reduce((sum, c) => sum + c.completedCount, 0);

  return (
    <div>
      <Link href="/admin/slt" className="text-sm text-meq-sky hover:underline">&larr; Back to SLT Dashboard</Link>

      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{yearGroup.name}</h1>
        <p className="text-gray-500 mt-1">{TERM_LABELS[school.currentTerm]} — {school.academicYear}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Students" value={totalStudents} />
        <StatCard label="Completed" value={totalCompleted} sublabel={totalStudents > 0 ? `${Math.round((totalCompleted / totalStudents) * 100)}% completion` : undefined} />
        <StatCard label="Classes" value={yearGroup.classes.length} />
      </div>

      {cohortTrend.length >= 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="font-bold text-gray-900 mb-1">Cohort trend</h2>
          <p className="text-xs text-gray-500 mb-4">
            How students currently in {yearGroup.name} have scored across every term they&apos;ve completed an assessment.
          </p>
          <TermTrendChart data={cohortTrend} domains={framework.domains} maxTotal={maxTotal} />
          <div className="mt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">By domain</p>
            <TermTrendChart
              data={cohortTrend}
              domains={framework.domains}
              maxTotal={scoringModel?.maxDomainScore ?? 26}
              showDomains
            />
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold text-gray-900 mb-4">Classes</h2>
      <div className="space-y-4">
        {classStats.map((cls) => (
          <Link
            key={cls.id}
            href={`/admin/slt/class/${cls.id}`}
            className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-meq-sky hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">{cls.name}</h3>
              <span className="text-sm text-gray-500">
                {cls.completedCount} / {cls.studentCount} completed
              </span>
            </div>
            {cls.completedCount > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Avg: <strong>{cls.avgScore}</strong></span>
                <div className="flex gap-2">
                  {(["Emerging", "Developing", "Secure", "Advanced"] as Level[]).map((level) =>
                    cls.levelCounts[level] > 0 ? (
                      <div key={level} className="flex items-center gap-1">
                        <LevelChip level={level} size="sm" />
                        <span className="text-xs text-gray-500">{cls.levelCounts[level]}</span>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </Link>
        ))}
        {yearGroup.classes.length === 0 && (
          <p className="text-gray-500 text-center py-8">No classes in this year group yet.</p>
        )}
      </div>
    </div>
  );
}
