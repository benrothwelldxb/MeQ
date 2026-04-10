import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { getSchoolFramework } from "@/lib/framework";
import { redirect } from "next/navigation";
import Link from "next/link";

const COLOR_STYLES: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
  amber: "bg-amber-50 border-amber-200 text-amber-700",
  rose: "bg-rose-50 border-rose-200 text-rose-700",
  red: "bg-red-50 border-red-200 text-red-700",
  green: "bg-green-50 border-green-200 text-green-700",
  indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
  pink: "bg-pink-50 border-pink-200 text-pink-700",
  teal: "bg-teal-50 border-teal-200 text-teal-700",
};

export default async function StaffWellbeingPage() {
  const session = await getTeacherSession();
  if (!session.teacherId) redirect("/teacher/login");

  const school = await getSchoolSettings(session.schoolId);
  if (!school.staffWellbeingEnabled) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Staff Wellbeing</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Staff wellbeing is not enabled at your school.</p>
        </div>
      </div>
    );
  }

  const framework = await getSchoolFramework(session.schoolId);

  // Find current assessment
  const assessment = await prisma.staffAssessment.findUnique({
    where: {
      teacherId_term_academicYear: {
        teacherId: session.teacherId,
        term: school.currentTerm,
        academicYear: school.academicYear,
      },
    },
  });

  // Load all completed assessments for history
  const history = await prisma.staffAssessment.findMany({
    where: { teacherId: session.teacherId, status: "completed" },
    orderBy: [{ academicYear: "desc" }, { term: "desc" }],
    take: 6,
  });

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Your Wellbeing</h1>
      <p className="text-gray-500 mb-6">
        {TERM_LABELS[school.currentTerm]} — {school.academicYear}
      </p>

      {/* Privacy notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-900">Your responses are confidential</p>
            <p className="text-xs text-blue-700 mt-1">
              Your individual answers are visible only to you. School leadership sees aggregated, anonymised data only —
              and only when at least 5 staff members have responded.
            </p>
          </div>
        </div>
      </div>

      {/* Current assessment */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-2">This Term&apos;s Assessment</h2>
        <p className="text-sm text-gray-500 mb-4">
          A {framework.name} wellbeing check-in. Takes around 5 minutes.
        </p>

        {!assessment || assessment.status === "in_progress" ? (
          <Link
            href="/teacher/wellbeing/assess"
            className="inline-block px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all"
          >
            {assessment ? "Continue Assessment" : "Start Assessment"}
          </Link>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-emerald-700">Completed this term</span>
            </div>

            {/* Your results */}
            {assessment.domainScoresJson && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {framework.domains.map((d) => {
                  const scores = JSON.parse(assessment.domainScoresJson!) as Record<string, number>;
                  const levels = JSON.parse(assessment.domainLevelsJson || "{}") as Record<string, string>;
                  const colorClass = COLOR_STYLES[d.color] || COLOR_STYLES.blue;
                  return (
                    <div key={d.key} className={`${colorClass} rounded-lg border p-3 text-center`}>
                      <p className="text-xs font-semibold">{d.label}</p>
                      <p className="text-xl font-bold">{scores[d.key] ?? 0}</p>
                      <p className="text-xs">{levels[d.key] || "Emerging"}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Your History</h2>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">
                  {TERM_LABELS[h.term] || h.term} {h.academicYear}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Score: {h.totalScore ?? "—"}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {h.overallLevel || "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
