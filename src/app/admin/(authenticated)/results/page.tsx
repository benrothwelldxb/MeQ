import { prisma } from "@/lib/db";
import Link from "next/link";
import LevelChip from "@/components/LevelChip";
import { MAX_TOTAL_SCORE, type Level, type Tier } from "@/lib/constants";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import ResultsFilter from "./ResultsFilter";

export default async function AdminResultsPage({
  searchParams,
}: {
  searchParams: { yearGroup?: string; className?: string; term?: string; level?: string };
}) {
  const school = await getSchoolSettings();

  // Build filter
  const where: Record<string, unknown> = { status: "completed" };
  if (searchParams.term) {
    where.term = searchParams.term;
    where.academicYear = school.academicYear;
  }
  if (searchParams.level) {
    where.overallLevel = searchParams.level;
  }

  const studentWhere: Record<string, unknown> = {};
  if (searchParams.yearGroup) studentWhere.yearGroup = searchParams.yearGroup;
  if (searchParams.className) studentWhere.className = searchParams.className;

  const assessments = await prisma.assessment.findMany({
    where: {
      ...where,
      ...(Object.keys(studentWhere).length > 0
        ? { student: studentWhere }
        : {}),
    },
    include: { student: true },
    orderBy: { completedAt: "desc" },
  });

  // Get unique values for filter dropdowns
  const allStudents = await prisma.student.findMany({
    select: { yearGroup: true, className: true },
    distinct: ["yearGroup", "className"],
    orderBy: { yearGroup: "asc" },
  });
  const yearGroups = Array.from(new Set(allStudents.map((s) => s.yearGroup)));
  const classNames = Array.from(new Set(allStudents.map((s) => s.className).filter(Boolean))) as string[];

  const exportUrl = `/api/results/export${searchParams.term ? `?term=${searchParams.term}&academicYear=${school.academicYear}` : ""}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results</h1>
          <p className="text-gray-500 mt-1">
            {assessments.length} completed assessments
          </p>
        </div>
        {assessments.length > 0 && (
          <a
            href={exportUrl}
            className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-leaf hover:bg-meq-leaf/90 transition-all"
          >
            Download CSV
          </a>
        )}
      </div>

      {/* Filters */}
      <ResultsFilter
        yearGroups={yearGroups}
        classNames={classNames}
        terms={Object.entries(TERM_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        current={searchParams}
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Year / Class</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Term</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">MeQ Score</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Level</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reliability</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</th>
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
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {TERM_LABELS[a.term] || a.term}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-gray-900">{a.totalScore ?? 0}</span>
                    <span className="text-xs text-gray-400 ml-1">/ {MAX_TOTAL_SCORE[(a.tier || "standard") as Tier]}</span>
                  </td>
                  <td className="px-6 py-4">
                    {a.overallLevel && <LevelChip level={a.overallLevel as Level} size="sm" />}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      a.reliabilityScore === "High" ? "bg-emerald-100 text-emerald-700"
                        : a.reliabilityScore === "Medium" ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}>{a.reliabilityScore}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/results/${a.id}`} className="text-sm text-meq-sky hover:underline font-medium">View</Link>
                  </td>
                </tr>
              ))}
              {assessments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No results match your filters.
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
