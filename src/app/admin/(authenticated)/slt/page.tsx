import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { type Level } from "@/lib/constants";
import StatCard from "@/components/admin/StatCard";
import LevelChip from "@/components/LevelChip";
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">SLT Dashboard — {school.name}</h1>
        <p className="text-gray-500 mt-1">{TERM_LABELS[school.currentTerm]} — {school.academicYear}</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Students" value={totalStudents} />
        <StatCard label="Completed" value={totalCompleted} sublabel={`${completionRate}% completion`} />
        <StatCard label="Avg MeQ Score" value={overallAvg > 0 ? overallAvg : "—"} />
        <StatCard label="Year Groups" value={yearGroups.length} />
      </div>

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
