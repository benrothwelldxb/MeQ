import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { getInterventionsForDomains } from "@/lib/interventions";
import {
  DOMAINS,
  DOMAIN_LABELS,
  type Domain,
  type Level,
} from "@/lib/constants";
import { getLevel } from "@/lib/scoring";
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

  const tier = classGroup.yearGroup.tier as "junior" | "standard";
  const completedStudents = classGroup.students.filter((s) => s.assessments.length > 0);
  const count = completedStudents.length || 1;

  const domainTotals: Record<Domain, number> = { KnowMe: 0, ManageMe: 0, UnderstandOthers: 0, WorkWithOthers: 0, ChooseWell: 0 };
  for (const student of completedStudents) {
    const a = student.assessments[0];
    domainTotals.KnowMe += a.knowMeScore ?? 0;
    domainTotals.ManageMe += a.manageMeScore ?? 0;
    domainTotals.UnderstandOthers += a.understandOthersScore ?? 0;
    domainTotals.WorkWithOthers += a.workWithOthersScore ?? 0;
    domainTotals.ChooseWell += a.chooseWellScore ?? 0;
  }

  const domainAverages: Record<Domain, number> = {} as Record<Domain, number>;
  const domainLevels: Record<string, string> = {};
  for (const domain of DOMAINS) {
    domainAverages[domain] = Math.round((domainTotals[domain] / count) * 10) / 10;
    domainLevels[domain] = getLevel(domainAverages[domain], tier);
  }

  const weakest = [...DOMAINS].sort((a, b) => domainAverages[a] - domainAverages[b]).slice(0, 2);
  const weakestLevels: Record<string, string> = {};
  for (const d of weakest) weakestLevels[d] = domainLevels[d];
  const interventions = await getInterventionsForDomains(weakestLevels, tier, "teacher");

  const levelColors: Record<Level, string> = {
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
                MeQ Class Report — {TERM_LABELS[school.currentTerm]} {school.academicYear}
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
              {DOMAINS.map((d) => (
                <th key={d} className="px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200">{DOMAIN_LABELS[d]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {DOMAINS.map((d) => (
                <td key={d} className="px-3 py-2 text-center border border-gray-200">
                  <span className="text-lg font-bold">{domainAverages[d]}</span>
                  <br />
                  <span className="text-xs font-medium" style={{ ...(levelColors[domainLevels[d] as Level] ? { color: levelColors[domainLevels[d] as Level].replace("color: ", "") } : {}) }}>
                    {domainLevels[d]}
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
              {DOMAINS.map((d) => (
                <th key={d} className="text-center px-2 py-2 border border-gray-200 text-xs font-semibold text-gray-600">{DOMAIN_LABELS[d]}</th>
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
                  {a ? DOMAINS.map((domain) => {
                    const scoreKey = `${domain.charAt(0).toLowerCase()}${domain.slice(1)}Score` as keyof typeof a;
                    const score = (a[scoreKey] as number | null) ?? 0;
                    const level = getLevel(score, tier);
                    return (
                      <td key={domain} className="text-center px-2 py-1.5 border border-gray-200 text-xs">
                        {level}
                      </td>
                    );
                  }) : (
                    <td colSpan={5} className="text-center px-2 py-1.5 border border-gray-200 text-gray-400 text-xs">
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
          Based on the class&apos;s two areas for development: {weakest.map((d) => DOMAIN_LABELS[d]).join(" and ")}
        </p>
        {weakest.map((domain) => {
          const domainInterventions = interventions[domain] || [];
          return (
            <div key={domain} className="mb-4 last:mb-0">
              <h3 className="font-semibold text-gray-900 mb-1">
                {DOMAIN_LABELS[domain]} ({domainLevels[domain]})
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
