import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import Link from "next/link";
import DeleteStudentButton from "./DeleteStudentButton";
import ResetAssessmentButton from "./ResetAssessmentButton";

export default async function StudentsPage() {
  const session = await getAdminSession();

  const students = await prisma.student.findMany({
    where: { schoolId: session.schoolId },
    orderBy: [{ yearGroup: "asc" }, { lastName: "asc" }],
    include: {
      assessments: {
        select: { id: true, status: true, term: true },
        orderBy: { startedAt: "desc" },
      },
    },
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Year / Class</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Login Code</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((student) => {
                const latestAssessment = student.assessments[0];
                const status = latestAssessment?.status ?? "not_started";
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {student.yearGroup}
                      {student.className && ` / ${student.className}`}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        student.tier === "junior"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {student.tier === "junior" ? "Junior" : "Standard"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 rounded bg-gray-100 text-sm font-mono text-gray-700">
                        {student.loginCode}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : status === "in_progress"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {status === "completed"
                          ? "Completed"
                          : status === "in_progress"
                          ? "In Progress"
                          : "Not Started"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 justify-end">
                        <Link href={`/admin/students/${student.id}/edit`} className="text-xs text-meq-sky hover:underline">
                          Edit
                        </Link>
                        {latestAssessment && (
                          <ResetAssessmentButton
                            assessmentId={latestAssessment.id}
                            studentName={`${student.firstName} ${student.lastName}`}
                            term={latestAssessment.term}
                          />
                        )}
                        <DeleteStudentButton studentId={student.id} studentName={`${student.firstName} ${student.lastName}`} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No students yet.{" "}
                    <Link href="/admin/students/add" className="text-meq-sky hover:underline">Add a student</Link>{" "}
                    or{" "}
                    <Link href="/admin/students/upload" className="text-meq-sky hover:underline">upload a CSV</Link>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
