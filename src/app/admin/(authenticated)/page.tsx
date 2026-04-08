import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import StatCard from "@/components/admin/StatCard";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getAdminSession();

  const [totalStudents, totalCompleted, assessments] = await Promise.all([
    prisma.student.count({ where: { schoolId: session.schoolId } }),
    prisma.assessment.count({ where: { status: "completed", student: { schoolId: session.schoolId } } }),
    prisma.assessment.findMany({
      where: { status: "completed", totalScore: { not: null }, student: { schoolId: session.schoolId } },
      select: { totalScore: true },
    }),
  ]);

  const inProgress = await prisma.assessment.count({
    where: { status: "in_progress", student: { schoolId: session.schoolId } },
  });

  const avgScore =
    assessments.length > 0
      ? Math.round(
          assessments.reduce((sum, a) => sum + (a.totalScore ?? 0), 0) /
            assessments.length
        )
      : 0;

  const completionRate =
    totalStudents > 0
      ? Math.round((totalCompleted / totalStudents) * 100)
      : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of MeQ assessments</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Students" value={totalStudents} />
        <StatCard label="Completed" value={totalCompleted} sublabel={`${completionRate}% completion rate`} />
        <StatCard label="In Progress" value={inProgress} />
        <StatCard label="Avg MeQ Score" value={avgScore > 0 ? `${avgScore}` : "—"} sublabel="out of 130" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/students"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-meq-sky hover:shadow-sm transition-all group"
        >
          <h3 className="font-bold text-gray-900 group-hover:text-meq-sky transition-colors">
            Manage Students
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            View students, upload CSV, generate login codes
          </p>
        </Link>
        <Link
          href="/admin/results"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-meq-sky hover:shadow-sm transition-all group"
        >
          <h3 className="font-bold text-gray-900 group-hover:text-meq-sky transition-colors">
            View Results
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            See scores, levels, and detailed breakdowns
          </p>
        </Link>
      </div>
    </div>
  );
}
