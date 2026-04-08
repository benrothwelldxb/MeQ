import { prisma } from "@/lib/db";
import Link from "next/link";
import { TERM_LABELS } from "@/lib/school";

export default async function SuperDashboard() {
  const schools = await prisma.school.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          students: true,
          teachers: true,
          admins: true,
        },
      },
    },
  });

  // Get assessment counts per school (via students)
  const assessmentCounts = await prisma.assessment.groupBy({
    by: ["studentId"],
    where: { status: "completed" },
    _count: true,
  });

  // Map student IDs to school IDs for counting
  const studentSchoolMap = new Map<string, string>();
  const allStudents = await prisma.student.findMany({
    select: { id: true, schoolId: true },
  });
  for (const s of allStudents) {
    studentSchoolMap.set(s.id, s.schoolId);
  }

  const schoolAssessmentCounts: Record<string, number> = {};
  for (const ac of assessmentCounts) {
    const schoolId = studentSchoolMap.get(ac.studentId);
    if (schoolId) {
      schoolAssessmentCounts[schoolId] = (schoolAssessmentCounts[schoolId] || 0) + ac._count;
    }
  }

  // Totals
  const totalStudents = schools.reduce((sum, s) => sum + s._count.students, 0);
  const totalAssessments = Object.values(schoolAssessmentCounts).reduce((sum, c) => sum + c, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Schools</h1>
          <p className="text-gray-400 mt-1">
            {schools.length} schools &middot; {totalStudents} students &middot; {totalAssessments} assessments completed
          </p>
        </div>
        <Link
          href="/super/schools/add"
          className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all"
        >
          Add School
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <p className="text-sm text-gray-400">Total Schools</p>
          <p className="text-3xl font-extrabold text-white">{schools.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <p className="text-sm text-gray-400">Total Students</p>
          <p className="text-3xl font-extrabold text-white">{totalStudents}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <p className="text-sm text-gray-400">Assessments Done</p>
          <p className="text-3xl font-extrabold text-white">{totalAssessments}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <p className="text-sm text-gray-400">Active Schools</p>
          <p className="text-3xl font-extrabold text-white">{schools.filter((s) => s.isActive).length}</p>
        </div>
      </div>

      {/* Schools table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">School</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Term</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Students</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Teachers</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Assessments</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {schools.map((school) => (
              <tr key={school.id} className="hover:bg-gray-750">
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{school.name}</div>
                  <div className="text-xs text-gray-500">{school.slug}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {TERM_LABELS[school.currentTerm]} &middot; {school.academicYear}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">{school._count.students}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{school._count.teachers}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{schoolAssessmentCounts[school.id] || 0}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    school.isActive ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"
                  }`}>
                    {school.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(school.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <Link href={`/super/schools/${school.id}`} className="text-sm text-meq-sky hover:underline">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
