import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { getSchoolFramework, getLevelFromThresholds } from "@/lib/framework";
import { getInterventionsForDomains } from "@/lib/interventions";
import { notFound, redirect } from "next/navigation";
import PrintButton from "./PrintButton";

export default async function ClassReportPage({
  params,
}: {
  params: { classGroupId: string };
}) {
  const session = await getTeacherSession();
  if (!session.teacherId) redirect("/teacher/login");

  const school = await getSchoolSettings(session.schoolId);
  const framework = await getSchoolFramework(session.schoolId);
  const domains = framework.domains;

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: params.classGroupId },
    include: {
      yearGroup: true,
      teachers: { where: { id: session.teacherId } },
      students: {
        orderBy: { lastName: "asc" },
        include: {
          assessments: {
            where: {
              term: school.currentTerm,
              academicYear: school.academicYear,
              status: "completed",
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!classGroup || classGroup.teachers.length === 0) return notFound();

  const tier = classGroup.yearGroup.tier || "standard";
  const scoringModel = framework.scoringModels[tier];
  const thresholds = scoringModel?.thresholds || [];
  const completedStudents = classGroup.students.filter((s) => s.assessments.length > 0);
  const count = completedStudents.length || 1;

  // Dynamic domain totals
  const domainTotals: Record<string, number> = {};
  for (const d of domains) domainTotals[d.key] = 0;
  for (const student of completedStudents) {
    const a = student.assessments[0];
    const scores: Record<string, number> = a.domainScoresJson ? JSON.parse(a.domainScoresJson) : {};
    for (const d of domains) domainTotals[d.key] += scores[d.key] ?? 0;
  }

  const domainAverages: Record<string, number> = {};
  const domainLevels: Record<string, string> = {};
  for (const d of domains) {
    domainAverages[d.key] = Math.round((domainTotals[d.key] / count) * 10) / 10;
    domainLevels[d.key] = getLevelFromThresholds(domainAverages[d.key], thresholds);
  }

  const strengthCount = Math.min(2, Math.floor(domains.length / 2)) || 1;
  const weakest = domains.map((d) => d.key).sort((a, b) => (domainAverages[a] ?? 0) - (domainAverages[b] ?? 0)).slice(0, strengthCount);
  const weakestLevels: Record<string, string> = {};
  for (const d of weakest) weakestLevels[d] = domainLevels[d];
  const interventions = await getInterventionsForDomains(weakestLevels, tier, "teacher", framework.id);

  const labelMap: Record<string, string> = {};
  for (const d of domains) labelMap[d.key] = d.label;

  const levelColors: Record<string, string> = {
    Advanced: "color: #059669",
    Secure: "color: #2563eb",
    Developing: "color: #d97706",
    Emerging: "color: #dc2626",
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="print:hidden mb-6 flex items-center justify-between">
        <a href={`/teacher/class/${params.classGroupId}`} className="text-sm text-meq-sky hover:underline">&larr; Back to Results</a>
        <PrintButton />
      </div>

      {/* Print-friendly report */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 print:border-0 print:shadow-none print:p-0">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {classGroup.yearGroup.name} — {classGroup.name}
              </h1>
              <p className="text-gray-500 mt-1">
                {framework.name} Class Report — {TERM_LABELS[school.currentTerm]} {school.academicYear}
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>{school.name}</p>
              <p>{completedStudents.length} of {classGroup.students.length} assessments</p>
            </div>
          </div>
        </div>

        {/* Class Averages */}
        <h2 className="font-bold text-gray-900 mb-3">Class Domain Averages</h2>
        <table className="w-full mb-6 border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              {domains.map((d) => (
                <th key={d.key} className="px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200">{d.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {domains.map((d) => (
                <td key={d.key} className="px-3 py-2 text-center border border-gray-200">
                  <span className="text-lg font-bold">{domainAverages[d.key]}</span>
                  <br />
                  <span className="text-xs font-medium" style={{ color: levelColors[domainLevels[d.key]]?.replace("color: ", "") || "#6b7280" }}>
                    {domainLevels[d.key]}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Student Results Table */}
        <h2 className="font-bold text-gray-900 mb-3">Individual Student Results</h2>
        <table className="w-full mb-6 border border-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2 border border-gray-200 text-xs font-semibold text-gray-600">Student</th>
              <th className="text-center px-2 py-2 border border-gray-200 text-xs font-semibold text-gray-600">SEN</th>
              {domains.map((d) => (
                <th key={d.key} className="text-center px-2 py-2 border border-gray-200 text-xs font-semibold text-gray-600">{d.label}</th>
              ))}
              <th className="text-center px-2 py-2 border border-gray-200 text-xs font-semibold text-gray-600">Overall</th>
            </tr>
          </thead>
          <tbody>
            {classGroup.students.map((student) => {
              const a = student.assessments[0];
              return (
                <tr key={student.id}>
                  <td className="px-3 py-1.5 border border-gray-200 font-medium">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="text-center px-2 py-1.5 border border-gray-200">
                    {student.sen ? "Yes" : ""}
                  </td>
                  {a ? (() => {
                    const scores: Record<string, number> = a.domainScoresJson ? JSON.parse(a.domainScoresJson) : {};
                    const levels: Record<string, string> = a.domainLevelsJson ? JSON.parse(a.domainLevelsJson) : {};
                    return domains.map((d) => (
                      <td key={d.key} className="text-center px-2 py-1.5 border border-gray-200 text-xs">
                        {levels[d.key] || getLevelFromThresholds(scores[d.key] ?? 0, thresholds)}
                      </td>
                    ));
                  })() : (
                    <td colSpan={domains.length} className="text-center px-2 py-1.5 border border-gray-200 text-gray-400 text-xs">
                      Not completed
                    </td>
                  )}
                  <td className="text-center px-2 py-1.5 border border-gray-200 text-xs font-medium">
                    {a ? (a.overallLevel ?? "—") : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Strategies */}
        <h2 className="font-bold text-gray-900 mb-3">Recommended Class Strategies</h2>
        <p className="text-sm text-gray-500 mb-4">
          Based on the class&apos;s areas for development: {weakest.map((d) => labelMap[d] || d).join(" and ")}
        </p>
        {weakest.map((domain) => {
          const domainInterventions = interventions[domain] || [];
          return (
            <div key={domain} className="mb-4 last:mb-0">
              <h3 className="font-semibold text-gray-900 mb-1">
                {labelMap[domain] || domain} ({domainLevels[domain]})
              </h3>
              {domainInterventions.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {domainInterventions.map((int) => (
                    <li key={int.id} className="text-sm text-gray-700">
                      <span className="font-medium">{int.title}</span> — {int.description}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No specific strategies available.</p>
              )}
            </div>
          );
        })}

        <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 print:mt-12">
          Generated by MeQ — {new Date().toLocaleDateString("en-GB")}
        </div>
      </div>
    </div>
  );
}
