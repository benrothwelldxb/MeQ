import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { type Level } from "@/lib/constants";
import { notFound } from "next/navigation";
import LevelChip from "@/components/LevelChip";
import StatCard from "@/components/admin/StatCard";
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
