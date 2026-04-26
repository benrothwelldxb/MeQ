import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings } from "@/lib/school";
import { getSchoolFramework } from "@/lib/framework";
import StudentTagPills from "@/components/StudentTagPills";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function ScoreDot({ value }: { value: number }) {
  // Colour conveys severity at a glance; the number inside makes the score
  // accessible to colour-blind readers and prints legibly in greyscale.
  const styles = value >= 4
    ? "bg-emerald-100 text-emerald-800 ring-emerald-300"
    : value >= 3
    ? "bg-amber-100 text-amber-800 ring-amber-300"
    : "bg-red-100 text-red-800 ring-red-300";
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ring-1 ${styles}`}
      aria-label={`Score ${value} of 5`}
      title={`${value} / 5`}
    >
      {value}
    </span>
  );
}

export default async function AdminPulsePage() {
  const session = await getAdminSession();
  const school = await getSchoolSettings(session.schoolId);

  const framework = await getSchoolFramework(session.schoolId);
  const domains = framework.domains;

  const COLOR_STYLES: Record<string, { text: string }> = {
    blue: { text: "text-blue-700" }, emerald: { text: "text-emerald-700" }, purple: { text: "text-purple-700" },
    amber: { text: "text-amber-700" }, rose: { text: "text-rose-700" }, red: { text: "text-red-700" },
    green: { text: "text-green-700" }, indigo: { text: "text-indigo-700" }, pink: { text: "text-pink-700" }, teal: { text: "text-teal-700" },
  };

  const labelMap: Record<string, string> = {};
  const colorMap: Record<string, string> = {};
  for (const d of domains) {
    labelMap[d.key] = d.label;
    colorMap[d.key] = COLOR_STYLES[d.color]?.text || "text-gray-700";
  }

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
    select: { id: true, firstName: true, lastName: true, yearGroup: true, className: true, sen: true, magt: true, eal: true },
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

  // Load pulse questions for question text
  const pulseQuestions = await prisma.pulseQuestion.findMany();
  const pulseQuestionMap: Record<string, string> = {};
  for (const pq of pulseQuestions) {
    pulseQuestionMap[pq.domain] = pq.prompt;
  }

  // Tips per domain — from framework messages (pulse_tip type) or fallback
  const defaultTips: Record<string, string> = {
    KnowMe: "Try a quiet check-in with this student. Ask them to name how they're feeling using a feelings chart or emoji cards.",
    ManageMe: "This student may benefit from a calm-down strategy reminder — breathing exercises, a sensory break, or a visit to a safe space.",
    UnderstandOthers: "Consider pairing this student with a buddy for group activities. Model empathy language: 'I can see that made you feel...'",
    WorkWithOthers: "Try giving this student a specific role in group work. Praise collaborative moments and scaffold turn-taking.",
    ChooseWell: "Help this student practise decision-making with simple choices. Use 'What would happen if...' scenarios during circle time.",
  };
  const domainTips: Record<string, string> = {};
  for (const d of domains) {
    const fwTips = framework.messages[d.key]?.["pulse_tip"];
    domainTips[d.key] = fwTips?.[0] || defaultTips[d.key] || `Check in with this student about their ${d.label} skills.`;
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
    for (const domain of domains.map((d) => d.key)) {
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
          <div className="space-y-4">
            {flagged.map((f, i) => (
              <div key={i} className="bg-white/60 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-red-900">
                    {f.student.firstName} {f.student.lastName}
                  </span>
                  {f.student.sen && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">SEN</span>
                  )}
                  <span className="text-xs text-red-400">
                    {f.student.yearGroup}{f.student.className ? ` / ${f.student.className}` : ""}
                  </span>
                </div>
                <p className="text-sm text-red-700 mb-1">
                  <span className="font-medium">{labelMap[f.domain] || f.domain}</span>
                  {" — scored "}
                  <span className="font-bold">{f.score}/5</span>
                  {pulseQuestionMap[f.domain] && (
                    <span className="text-red-500 italic"> &quot;{pulseQuestionMap[f.domain]}&quot;</span>
                  )}
                </p>
                {domainTips[f.domain] && (
                  <p className="text-xs text-red-600 bg-red-100/50 rounded px-3 py-2 mt-2">
                    <span className="font-semibold">Tip:</span> {domainTips[f.domain]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Free text responses */}
      {thisWeekChecks.some((c) => c.freeText) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-3">Student Comments — This Week</h2>
          <div className="space-y-3">
            {thisWeekChecks
              .filter((c) => c.freeText)
              .map((check) => {
                const student = students.find((s) => s.id === check.studentId);
                if (!student) return null;
                return (
                  <div key={check.id} className="border-l-4 border-meq-sky pl-4 py-1">
                    <p className="text-sm text-gray-700 italic">&ldquo;{check.freeText}&rdquo;</p>
                    <p className="text-xs text-gray-400 mt-1">
                      — {student.firstName} {student.lastName}
                      {student.yearGroup && ` · ${student.yearGroup}${student.className ? ` / ${student.className}` : ""}`}
                    </p>
                  </div>
                );
              })}
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
                {domains.map((d) => (
                  <th key={d.key} className={`text-center px-2 py-2 text-xs font-semibold ${colorMap[d.key]}`}>
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {weeklyAverages.map((row, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900">{row.label}</td>
                  <td className="text-center px-2 py-2 text-sm text-gray-500">{row.count}</td>
                  {domains.map((d) => {
                    const val = row.averages[d.key];
                    const color = val >= 4 ? "text-emerald-600" : val >= 3 ? "text-gray-700" : val >= 2 ? "text-amber-600" : val > 0 ? "text-red-600" : "text-gray-300";
                    return (
                      <td key={d.key} className={`text-center px-2 py-2 text-sm font-medium ${color}`}>
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
                {domains.map((d) => (
                  <th key={d.key} className="text-center px-2 py-2 text-xs font-semibold text-gray-500">
                    {d.label}
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
                        <StudentTagPills sen={student.sen} magt={student.magt} eal={student.eal} />
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      {student.yearGroup}{student.className ? ` / ${student.className}` : ""}
                    </td>
                    {answers ? domains.map((d) => (
                      <td key={d.key} className="text-center px-2 py-3">
                        {answers[d.key] ? <ScoreDot value={answers[d.key]} /> : <span className="text-gray-300">—</span>}
                      </td>
                    )) : (
                      <td colSpan={domains.length} className="text-center px-2 py-3 text-xs text-gray-400">
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
