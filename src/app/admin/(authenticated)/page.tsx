import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import StatCard from "@/components/admin/StatCard";
import SetupChecklist from "@/components/admin/SetupChecklist";
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

  // Setup checklist data — hidden when everything is done
  const [yearGroupCount, teacherCount, school, anyAssessment] = await Promise.all([
    prisma.yearGroup.count({ where: { schoolId: session.schoolId } }),
    prisma.teacher.count({ where: { schoolId: session.schoolId } }),
    prisma.school.findUnique({
      where: { id: session.schoolId },
      select: { frameworkId: true, dslEmail: true },
    }),
    prisma.assessment.findFirst({
      where: { student: { schoolId: session.schoolId } },
      select: { id: true },
    }),
  ]);

  const setupSteps = [
    { key: "yearGroups", title: "Add year groups and classes", done: yearGroupCount > 0, href: "/admin/settings/year-groups", cta: "Set up" },
    { key: "teachers", title: "Invite teaching staff", done: teacherCount > 0, href: "/admin/teachers/add", cta: "Add teachers" },
    { key: "students", title: "Add students (individually or via CSV)", done: totalStudents > 0, href: "/admin/students", cta: "Add students" },
    { key: "framework", title: "Choose your assessment framework", done: !!school?.frameworkId, href: "/admin/settings", cta: "Choose" },
    { key: "dsl", title: "Set your Designated Safeguarding Lead email", done: !!school?.dslEmail, href: "/admin/settings", cta: "Add DSL" },
    { key: "assessment", title: "Launch your first assessment", done: !!anyAssessment, href: "/admin/students", cta: "Share codes" },
  ];

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

      <SetupChecklist steps={setupSteps} />

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
        <Link
          href="/admin/inspector-summary"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-meq-sky hover:shadow-sm transition-all group"
        >
          <h3 className="font-bold text-gray-900 group-hover:text-meq-sky transition-colors">
            Inspector summary
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Printable 1-page report aligned to your inspectorate
          </p>
        </Link>
      </div>
    </div>
  );
}
