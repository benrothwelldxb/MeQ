import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { MAX_TOTAL_SCORE, type Level, type Tier } from "@/lib/constants";
import { notFound } from "next/navigation";
import LevelChip from "@/components/LevelChip";
import Link from "next/link";

export default async function SLTClassPage({
  params,
}: {
  params: { classGroupId: string };
}) {
  const session = await getAdminSession();
  const school = await getSchoolSettings(session.schoolId);

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: params.classGroupId },
    include: {
      yearGroup: true,
      students: {
        orderBy: { lastName: "asc" },
        include: {
          assessments: {
            where: { term: school.currentTerm, academicYear: school.academicYear, status: "completed" },
            take: 1,
          },
          teacherAssessments: {
            where: { term: school.currentTerm, academicYear: school.academicYear, status: "completed" },
            take: 1,
          },
        },
      },
    },
  });

  if (!classGroup) return notFound();

  return (
    <div>
      <Link href={`/admin/slt/year/${classGroup.yearGroupId}`} className="text-sm text-meq-sky hover:underline">
        &larr; Back to {classGroup.yearGroup.name}
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {classGroup.yearGroup.name} — {classGroup.name}
        </h1>
        <p className="text-gray-500 mt-1">
          {classGroup.students.length} students &middot; {TERM_LABELS[school.currentTerm]} — {school.academicYear}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Self-Assessment</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Level</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teacher View</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reliability</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {classGroup.students.map((student) => {
                const assessment = student.assessments[0];
                const teacherAssessment = student.teacherAssessments[0];
                const tier = (student.tier || "standard") as Tier;

                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-6 py-4">
                      {assessment ? (
                        <span className="text-lg font-bold text-gray-900">
                          {assessment.totalScore ?? 0}
                          <span className="text-xs text-gray-400 ml-1">/ {MAX_TOTAL_SCORE[tier]}</span>
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Not completed</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {assessment?.overallLevel ? (
                        <LevelChip level={assessment.overallLevel as Level} size="sm" />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {teacherAssessment ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Completed</span>
                      ) : (
                        <span className="text-xs text-gray-400">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {assessment?.reliabilityScore ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          assessment.reliabilityScore === "High" ? "bg-emerald-100 text-emerald-700"
                            : assessment.reliabilityScore === "Medium" ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}>{assessment.reliabilityScore}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {assessment && (
                        <Link href={`/admin/results/${assessment.id}`} className="text-sm text-meq-sky hover:underline font-medium">
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
