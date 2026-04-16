import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getSchoolFramework } from "@/lib/framework";
import { getDomainTailwind } from "@/lib/domain-colors";
import { TERM_LABELS } from "@/lib/school";
import MyPulseChart from "./MyPulseChart";
import MyLogoutButton from "./MyLogoutButton";
import Link from "next/link";

/**
 * Student-facing read-only dashboard. Friendly, positive framing —
 * shows the student's own progress across terms and pulse check-ins.
 * Deliberately does NOT show teacher notes, safeguarding flags, or
 * intervention logs.
 */
export default async function MyWellbeingPage() {
  const session = await getStudentSession();
  if (!session.studentId) redirect("/");

  const student = await prisma.student.findUnique({
    where: { id: session.studentId },
    select: {
      id: true,
      firstName: true,
      displayName: true,
      schoolId: true,
      tier: true,
      yearGroupId: true,
      classGroupId: true,
    },
  });
  if (!student) redirect("/");

  const framework = await getSchoolFramework(student.schoolId);
  const scoringModel =
    framework.scoringModels[student.tier] ??
    framework.scoringModels.standard ??
    Object.values(framework.scoringModels)[0];
  const maxDomain = scoringModel?.maxDomainScore ?? 26;

  // Latest + history of own assessments (completed only)
  const assessments = await prisma.assessment.findMany({
    where: { studentId: student.id, status: "completed" },
    orderBy: [{ academicYear: "asc" }, { term: "asc" }],
    select: {
      id: true,
      term: true,
      academicYear: true,
      totalScore: true,
      overallLevel: true,
      domainScoresJson: true,
      completedAt: true,
    },
  });

  const latest = assessments[assessments.length - 1];
  const prev = assessments.length >= 2 ? assessments[assessments.length - 2] : null;
  const latestScores: Record<string, number> = latest?.domainScoresJson
    ? JSON.parse(latest.domainScoresJson)
    : {};
  const prevScores: Record<string, number> | null = prev?.domainScoresJson
    ? JSON.parse(prev.domainScoresJson)
    : null;

  // Pulse history — last 12 weeks
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);
  const pulseChecks = await prisma.pulseCheck.findMany({
    where: { studentId: student.id, completedAt: { not: null, gte: twelveWeeksAgo } },
    orderBy: { weekOf: "asc" },
    select: { weekOf: true, answers: true },
  });

  // Active custom surveys the student hasn't completed yet
  const activeSurveys = await prisma.survey.findMany({
    where: { schoolId: student.schoolId, status: "active" },
    select: {
      id: true,
      title: true,
      description: true,
      targetType: true,
      targetIds: true,
      allowRetake: true,
      questions: { select: { id: true } },
    },
  });
  const pendingSurveys: { id: string; title: string; description: string | null }[] = [];
  for (const s of activeSurveys) {
    const targetIds: string[] = JSON.parse(s.targetIds);
    if (s.targetType === "year_group" && student.yearGroupId && !targetIds.includes(student.yearGroupId)) continue;
    if (s.targetType === "class" && student.classGroupId && !targetIds.includes(student.classGroupId)) continue;
    if (!s.allowRetake) {
      const existing = await prisma.surveyResponse.findFirst({
        where: { surveyId: s.id, studentId: student.id },
      });
      if (existing) continue;
    }
    pendingSurveys.push({ id: s.id, title: s.title, description: s.description });
  }

  const firstName = student.displayName || student.firstName;

  return (
    <main className="min-h-screen bg-meq-cloud p-4">
      <div className="max-w-2xl mx-auto pt-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-meq-slate">Hi {firstName}!</h1>
            <p className="text-gray-500 mt-1">
              {latest
                ? `Here's a look at how you've been doing.`
                : `Welcome back — you haven't finished a check-in yet.`}
            </p>
          </div>
          <MyLogoutButton />
        </div>

        {/* Pending surveys first — students shouldn't miss these */}
        {pendingSurveys.length > 0 && (
          <div className="bg-white rounded-2xl border border-meq-mist p-5 mb-4">
            <h2 className="font-bold text-meq-slate mb-3">Something to do</h2>
            <div className="space-y-2">
              {pendingSurveys.map((s) => (
                <Link
                  key={s.id}
                  href={`/survey/${s.id}`}
                  className="block bg-meq-sky-light/50 hover:bg-meq-sky-light rounded-xl p-4 transition-colors"
                >
                  <p className="font-semibold text-meq-slate">{s.title}</p>
                  {s.description && <p className="text-sm text-gray-600 mt-0.5">{s.description}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Latest overall */}
        {latest && (
          <div className="bg-white rounded-2xl border border-meq-mist p-6 mb-4">
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
              Your most recent check-in
            </p>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-4xl font-extrabold text-meq-slate">
                {latest.totalScore ?? "—"}
              </span>
              <span className="text-lg text-gray-500">/ {scoringModel?.maxTotalScore ?? 130}</span>
              <span className="ml-auto text-sm font-semibold text-meq-sky">
                {latest.overallLevel}
              </span>
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              How you did in each area
            </p>
            <div className="grid grid-cols-2 gap-3">
              {framework.domains.map((d) => {
                const score = latestScores[d.key] ?? 0;
                const prevVal = prevScores ? (prevScores[d.key] ?? 0) : null;
                const delta = prevVal !== null ? score - prevVal : null;
                const tw = getDomainTailwind(d.color);
                return (
                  <div key={d.key} className={`${tw.bg} ${tw.border} border rounded-xl p-3`}>
                    <p className={`text-xs font-semibold ${tw.text}`}>{d.label}</p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className={`text-2xl font-bold ${tw.text}`}>{score}</span>
                      <span className={`text-xs ${tw.text} opacity-70`}>/ {maxDomain}</span>
                    </div>
                    {delta !== null && delta !== 0 && (
                      <p className={`text-xs mt-1 ${delta > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {delta > 0 ? `↑ up ${delta.toFixed(1)}` : `↓ down ${Math.abs(delta).toFixed(1)}`} since last time
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Growth history — simple table, no heavy charts */}
        {assessments.length >= 2 && (
          <div className="bg-white rounded-2xl border border-meq-mist p-6 mb-4">
            <h2 className="font-bold text-meq-slate mb-3">Your growth over time</h2>
            <p className="text-xs text-gray-500 mb-4">
              Your score after each check-in, oldest to newest.
            </p>
            <div className="space-y-2">
              {assessments.map((a) => {
                const maxPct = scoringModel?.maxTotalScore ?? 130;
                const pct = maxPct > 0 ? Math.min(100, ((a.totalScore ?? 0) / maxPct) * 100) : 0;
                return (
                  <div key={a.id}>
                    <div className="flex items-baseline justify-between text-sm mb-1">
                      <span className="text-meq-slate font-medium">
                        {TERM_LABELS[a.term] ?? a.term} {a.academicYear}
                      </span>
                      <span className="text-gray-500">
                        {a.totalScore ?? "—"} · {a.overallLevel}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-meq-mist rounded-full overflow-hidden">
                      <div className="h-full bg-meq-sky rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pulse mood history */}
        {pulseChecks.length > 0 && (
          <div className="bg-white rounded-2xl border border-meq-mist p-6 mb-4">
            <h2 className="font-bold text-meq-slate mb-1">Your weekly check-ins</h2>
            <p className="text-xs text-gray-500 mb-4">
              Last {pulseChecks.length} weeks of mood check-ins.
            </p>
            <MyPulseChart
              domains={framework.domains}
              pulseChecks={pulseChecks.map((p) => ({
                weekOf: p.weekOf,
                answers: JSON.parse(p.answers),
              }))}
            />
          </div>
        )}

        {!latest && pendingSurveys.length === 0 && (
          <div className="bg-white rounded-2xl border border-meq-mist p-8 text-center">
            <p className="text-gray-500">
              Nothing to show yet. Your teacher will let you know when the next check-in is ready.
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-8">
          These are your own results and only you can see them here.
        </p>
      </div>
    </main>
  );
}
