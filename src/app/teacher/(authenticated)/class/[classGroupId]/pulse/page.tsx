import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { getSchoolSettings } from "@/lib/school";
import { getSchoolFramework } from "@/lib/framework";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function ScoreBadge({ value }: { value: number }) {
  const styles = value >= 4
    ? "bg-emerald-100 text-emerald-700"
    : value >= 3
    ? "bg-gray-100 text-gray-700"
    : "bg-red-100 text-red-700";
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles}`}>{value}</span>;
}

export default async function TeacherPulsePage({
  params,
}: {
  params: { classGroupId: string };
}) {
  const session = await getTeacherSession();
  if (!session.teacherId) redirect("/teacher/login");

  const school = await getSchoolSettings(session.schoolId);
  const framework = await getSchoolFramework(session.schoolId);
  const domains = framework.domains;
  const COLOR_STYLES: Record<string, { text: string }> = {
    blue: { text: "text-blue-700" }, emerald: { text: "text-emerald-700" }, purple: { text: "text-purple-700" },
    amber: { text: "text-amber-700" }, rose: { text: "text-rose-700" }, red: { text: "text-red-700" },
    green: { text: "text-green-700" }, indigo: { text: "text-indigo-700" }, pink: { text: "text-pink-700" }, teal: { text: "text-teal-700" },
  };

  if (!school.pulseEnabled) {
    return (
      <div className="max-w-3xl">
        <Link href="/teacher" className="text-sm text-meq-sky hover:underline">&larr; Back to Classes</Link>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mt-4">
          <p className="text-gray-500">Pulse is not enabled for this school.</p>
        </div>
      </div>
    );
  }

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: params.classGroupId },
    include: {
      yearGroup: true,
      teachers: { where: { id: session.teacherId } },
      students: {
        orderBy: { lastName: "asc" },
        select: { id: true, firstName: true, lastName: true, sen: true },
      },
    },
  });

  if (!classGroup || classGroup.teachers.length === 0) return notFound();

  const studentIds = classGroup.students.map((s) => s.id);
  const thisMonday = getMonday(new Date());
  const sixWeeksAgo = new Date(thisMonday);
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

  const pulseChecks = await prisma.pulseCheck.findMany({
    where: {
      studentId: { in: studentIds },
      weekOf: { gte: sixWeeksAgo },
      completedAt: { not: null },
    },
    orderBy: { weekOf: "desc" },
  });

  // Build weeks
  const weeks: Date[] = [];
  for (let i = 0; i < 6; i++) {
    const w = new Date(thisMonday);
    w.setDate(w.getDate() - i * 7);
    weeks.push(w);
  }

  const thisWeekChecks = pulseChecks.filter(
    (p) => p.weekOf.toISOString() === thisMonday.toISOString()
  );

  return (
    <div className="max-w-4xl">
      <Link href={`/teacher/class/${params.classGroupId}`} className="text-sm text-meq-sky hover:underline">&larr; Back to Class Results</Link>

      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">
        {classGroup.yearGroup.name} — {classGroup.name}
      </h1>
      <p className="text-gray-500 mb-6">Weekly Pulse Check-ins</p>

      {/* This week's individual responses */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">This Week</h2>
          <p className="text-xs text-gray-400">
            {thisWeekChecks.length} of {classGroup.students.length} completed
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Student</th>
                {domains.map((d) => (
                  <th key={d.key} className={`text-center px-2 py-2 text-xs font-semibold ${COLOR_STYLES[d.color]?.text || "text-gray-700"}`}>
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {classGroup.students.map((student) => {
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
                    {answers ? domains.map((d) => (
                      <td key={d.key} className="text-center px-2 py-3">
                        {answers[d.key] ? <ScoreBadge value={answers[d.key]} /> : <span className="text-gray-300">—</span>}
                      </td>
                    )) : (
                      <td colSpan={domains.length} className="text-center px-2 py-3 text-xs text-gray-400">Not completed</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6-week trend per student */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">6-Week Overview</h2>
          <p className="text-xs text-gray-400">Average score per student per week (1-5 scale)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Student</th>
                {weeks.map((w) => (
                  <th key={w.toISOString()} className="text-center px-2 py-2 text-xs font-semibold text-gray-500">
                    {w.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {classGroup.students.map((student) => {
                return (
                  <tr key={student.id}>
                    <td className="px-4 py-3 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{student.firstName} {student.lastName}</span>
                        {student.sen && <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">SEN</span>}
                      </span>
                    </td>
                    {weeks.map((w) => {
                      const check = pulseChecks.find(
                        (p) => p.studentId === student.id && p.weekOf.toISOString() === w.toISOString()
                      );
                      if (!check) {
                        return <td key={w.toISOString()} className="text-center px-2 py-3 text-gray-300 text-xs">—</td>;
                      }
                      const answers = JSON.parse(check.answers) as Record<string, number>;
                      const values = Object.values(answers).filter((v) => v > 0);
                      const avg = values.length > 0
                        ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
                        : 0;
                      return (
                        <td key={w.toISOString()} className="text-center px-2 py-3">
                          {avg > 0 ? <ScoreBadge value={avg} /> : <span className="text-gray-300">—</span>}
                        </td>
                      );
                    })}
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
