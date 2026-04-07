import { prisma } from "@/lib/db";
import Link from "next/link";
import LevelChip from "@/components/LevelChip";
import { MAX_TOTAL_SCORE, type Level } from "@/lib/constants";

export default async function AdminResultsPage() {
  const assessments = await prisma.assessment.findMany({
    where: { status: "completed" },
    include: { student: true },
    orderBy: { completedAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Results</h1>
        <p className="text-gray-500 mt-1">
          {assessments.length} completed assessments
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Year / Class
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  MeQ Score
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reliability
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {assessments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {a.student.firstName} {a.student.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {a.student.yearGroup}
                    {a.student.className && ` / ${a.student.className}`}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-gray-900">
                      {a.totalScore ?? 0}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">/ {MAX_TOTAL_SCORE}</span>
                  </td>
                  <td className="px-6 py-4">
                    {a.overallLevel && (
                      <LevelChip level={a.overallLevel as Level} size="sm" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        a.reliabilityScore === "High"
                          ? "bg-emerald-100 text-emerald-700"
                          : a.reliabilityScore === "Medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {a.reliabilityScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {a.completedAt
                      ? new Date(a.completedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/results/${a.id}`}
                      className="text-sm text-meq-sky hover:underline font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {assessments.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No completed assessments yet.
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
