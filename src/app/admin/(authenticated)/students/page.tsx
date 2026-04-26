import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import Link from "next/link";
import StudentTable from "./StudentTable";

export default async function StudentsPage() {
  const session = await getAdminSession();

  const students = await prisma.student.findMany({
    where: { schoolId: session.schoolId },
    orderBy: [{ yearGroup: "asc" }, { lastName: "asc" }],
    include: {
      assessments: {
        select: { id: true, status: true, term: true, overallLevel: true, completedAt: true },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  const classGroups = await prisma.classGroup.findMany({
    where: { schoolId: session.schoolId },
    include: { yearGroup: { select: { name: true } } },
    orderBy: [{ yearGroup: { sortOrder: "asc" } }, { name: "asc" }],
  });

  const classes = classGroups.map((c) => ({
    id: c.id,
    name: c.name,
    yearGroupName: c.yearGroup.name,
  }));

  const studentData = students.map((s) => {
    const latestCompleted = s.assessments.find((a) => a.status === "completed" && a.overallLevel);
    return {
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      yearGroup: s.yearGroup,
      className: s.className,
      tier: s.tier,
      loginCode: s.loginCode,
      sen: s.sen,
      magt: s.magt,
      eal: s.eal,
      overallLevel: latestCompleted?.overallLevel ?? null,
      assessments: s.assessments.map((a) => ({ id: a.id, status: a.status, term: a.term })),
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 mt-1">{students.length} students</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/students/add"
            className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all"
          >
            Add Student
          </Link>
          <Link
            href="/admin/students/upload"
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
          >
            Upload CSV
          </Link>
          <Link
            href="/admin/students/codes"
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
          >
            Print Codes
          </Link>
        </div>
      </div>

      <StudentTable students={studentData} classes={classes} />
    </div>
  );
}
