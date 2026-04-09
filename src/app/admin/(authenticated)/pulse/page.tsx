import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings } from "@/lib/school";
import { DOMAINS, DOMAIN_LABELS, DOMAIN_COLORS, type Domain } from "@/lib/constants";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function ScoreDot({ value }: { value: number }) {
  const color = value >= 4 ? "bg-emerald-400" : value >= 3 ? "bg-amber-300" : "bg-red-400";
  return <span className={`inline-block w-3 h-3 rounded-full ${color}`} title={String(value)} />;
}

export default async function AdminPulsePage() {
  const session = await getAdminSession();
  const school = await getSchoolSettings(session.schoolId);

  if (!school.pulseEnabled) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Weekly Pulse</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-2">Pulse is not enabled for this school.</p>
          <a href="/admin/settings" className="text-sm text-meq-sky hover:underline">Enable in Settings</a>
        </div>
      </div>
    );
  }

  const thisMonday = getMonday(new Date());
  const sixWeeksAgo = new Date(thisMonday);
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

  // Get all students for this school
  const students = await prisma.student.findMany({
    where: { schoolId: session.schoolId },
    select: { id: true, firstName: true, lastName: true, yearGroup: true, className: true, sen: true },
    orderBy: [{ yearGroup: "asc" }, { lastName: "asc" }],
  });

  const studentIds = students.map((s) => s.id);

  // Get all pulse checks for the last 6 weeks
  const pulseChecks = await prisma.pulseCheck.findMany({
    where: {
      studentId: { in: studentIds },
      weekOf: { gte: sixWeeksAgo },
      completedAt: { not: null },
    },
    orderBy: { weekOf: "desc" },
  });

  // This week's completion
  const thisWeekChecks = pulseChecks.filter(
    (p) => p.weekOf.toISOString() === thisMonday.toISOString()
  );
  const completedThisWeek = thisWeekChecks.length;
  const totalStudents = students.length;

  // Weeks for the table
  const weeks: Date[] = [];
  for (let i = 0; i < 6; i++) {
    const w = new Date(thisMonday);
    w.setDate(w.getDate() - i * 7);
    weeks.push(w);
  }

  // Identify flagged students — anyone who scored 1 or 2 on any domain this week
  const flagged: Array<{ student: typeof students[0]; domain: string; score: number }> = [];
  for (const check of thisWeekChecks) {
    const answers = JSON.parse(check.answers) as Record<string, number>;
    const student = students.find((s) => s.id === check.studentId);
    if (!student) continue;
    for (const [domain, score] of Object.entries(answers)) {
      if (score <= 2) {
        flagged.push({ student, domain, score });
      }
    }
  }

  // Weekly class averages per domain
  const weeklyAverages = weeks.map((week) => {
    const weekChecks = pulseChecks.filter(
      (p) => p.weekOf.toISOString() === week.toISOString()
    );
    const avgs: Record<string, number> = {};
    for (const domain of DOMAINS) {
      const values = weekChecks
        .map((p) => (JSON.parse(p.answers) as Record<string, number>)[domain])
        .filter((v) => v !== undefined);
      avgs[domain] = values.length > 0
        ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
        : 0;
    }
    return {
      week,
      label: week.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      count: weekChecks.length,
      averages: avgs,
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Weekly Pulse</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">This Week</p>
          <p className="text-2xl font-bold text-gray-900">
            {completedThisWeek} <span className="text-sm font-normal text-gray-400">/ {totalStudents}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">pulse check-ins completed</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Completion Rate</p>
          <p className="text-2xl font-bold text-gray-900">
            {totalStudents ? Math.round((completedThisWeek / totalStudents) * 100) : 0}%
          </p>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2">
            <div
              className="h-full bg-meq-sky rounded-full"
              style={{ width: `${totalStudents ? Math.round((completedThisWeek / totalStudents) * 100) : 0}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Flagged This Week</p>
          <p className={`text-2xl font-bold ${flagged.length > 0 ? "text-red-600" : "text-gray-900"}`}>
            {flagged.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">low scores (1-2) on any domain</p>
        </div>
      </div>

      {/* Flagged Students */}
      {flagged.length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-5 mb-6">
          <h2 className="font-bold text-red-800 mb-3">Students Needing Attention</h2>
          <div className="space-y-2">
            {flagged.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="font-medium text-red-900">
                  {f.student.firstName} {f.student.lastName}
                </span>
                {f.student.sen && (
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">SEN</span>
                )}
                <span className="text-red-600">
                  {DOMAIN_LABELS[f.domain as Domain] || f.domain}: scored {f.score}/5
                </span>
                <span className="text-red-400 text-xs">
                  {f.student.yearGroup}{f.student.className ? ` / ${f.student.className}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Trends Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">School-wide Weekly Averages</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Week</th>
                <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500">Responses</th>
                {DOMAINS.map((d) => (
                  <th key={d} className={`text-center px-2 py-2 text-xs font-semibold ${DOMAIN_COLORS[d].text}`}>
                    {DOMAIN_LABELS[d]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {weeklyAverages.map((row, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900">{row.label}</td>
                  <td className="text-center px-2 py-2 text-sm text-gray-500">{row.count}</td>
                  {DOMAINS.map((d) => {
                    const val = row.averages[d];
                    const color = val >= 4 ? "text-emerald-600" : val >= 3 ? "text-gray-700" : val >= 2 ? "text-amber-600" : val > 0 ? "text-red-600" : "text-gray-300";
                    return (
                      <td key={d} className={`text-center px-2 py-2 text-sm font-medium ${color}`}>
                        {val > 0 ? val : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Student Pulse (this week) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Individual Responses — This Week</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Student</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Year / Class</th>
                {DOMAINS.map((d) => (
                  <th key={d} className="text-center px-2 py-2 text-xs font-semibold text-gray-500">
                    {DOMAIN_LABELS[d]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((student) => {
                const check = thisWeekChecks.find((c) => c.studentId === student.id);
                const answers = check ? JSON.parse(check.answers) as Record<string, number> : null;
                return (
                  <tr key={student.id}>
                    <td className="px-4 py-3 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{student.firstName} {student.lastName}</span>
                        {student.sen && <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">SEN</span>}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      {student.yearGroup}{student.className ? ` / ${student.className}` : ""}
                    </td>
                    {answers ? DOMAINS.map((d) => (
                      <td key={d} className="text-center px-2 py-3">
                        {answers[d] ? <ScoreDot value={answers[d]} /> : <span className="text-gray-300">—</span>}
                      </td>
                    )) : (
                      <td colSpan={5} className="text-center px-2 py-3 text-xs text-gray-400">
                        Not completed
                      </td>
                    )}
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
