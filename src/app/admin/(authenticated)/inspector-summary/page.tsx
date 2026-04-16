import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { getSchoolFramework } from "@/lib/framework";
import { getInspectorate, translateLevelLabel } from "@/lib/inspectorates";
import PrintButton from "@/components/student-overview/PrintButton";
import Link from "next/link";

export default async function InspectorSummaryPage() {
  const session = await getAdminSession();
  const school = await getSchoolSettings(session.schoolId);
  const inspectorate = getInspectorate(school.inspectorate);
  const framework = await getSchoolFramework(session.schoolId);
  const scoringModel =
    framework.scoringModels.standard ?? Object.values(framework.scoringModels)[0];
  const maxTotal = scoringModel?.maxTotalScore ?? 130;

  // Current-term data
  const [totalStudents, assessments, openAlerts, flaggedAlerts] = await Promise.all([
    prisma.student.count({ where: { schoolId: session.schoolId } }),
    prisma.assessment.findMany({
      where: {
        status: "completed",
        term: school.currentTerm,
        academicYear: school.academicYear,
        student: { schoolId: session.schoolId },
      },
      select: { totalScore: true, overallLevel: true, domainScoresJson: true, domainLevelsJson: true },
    }),
    prisma.safeguardingAlert.count({
      where: { schoolId: session.schoolId, status: "open" },
    }),
    prisma.safeguardingAlert.count({
      where: {
        schoolId: session.schoolId,
        status: { in: ["resolved", "dismissed"] },
        createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) },
      },
    }),
  ]);

  const completedCount = assessments.length;
  const completionPct =
    totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;
  const avgScore =
    completedCount > 0
      ? Math.round(
          (assessments.reduce((s, a) => s + (a.totalScore ?? 0), 0) / completedCount) * 10
        ) / 10
      : null;

  // Level distribution (overall)
  const levelCounts: Record<string, number> = { Advanced: 0, Secure: 0, Developing: 0, Emerging: 0 };
  for (const a of assessments) {
    const lvl = a.overallLevel ?? "Emerging";
    if (levelCounts[lvl] !== undefined) levelCounts[lvl]++;
  }

  // Per-domain averages
  const domainAverages: Record<string, number> = {};
  for (const d of framework.domains) {
    const scores: number[] = [];
    for (const a of assessments) {
      if (!a.domainScoresJson) continue;
      try {
        const parsed = JSON.parse(a.domainScoresJson) as Record<string, number>;
        const v = parsed[d.key];
        if (typeof v === "number") scores.push(v);
      } catch { /* ignore */ }
    }
    domainAverages[d.key] =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;
  }

  const levelOrder = ["Advanced", "Secure", "Developing", "Emerging"];

  return (
    <div className="max-w-3xl inspector-summary">
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <Link href="/admin" className="text-sm text-meq-sky hover:underline">
          &larr; Back to Dashboard
        </Link>
        <PrintButton />
      </div>

      {/* Header */}
      <div className="mt-4 mb-6">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
          {inspectorate.frameworkName}
        </p>
        <h1 className="text-3xl font-bold text-gray-900">{school.name}</h1>
        <p className="text-gray-600 mt-1">
          {inspectorate.label} · {inspectorate.jurisdiction} · {TERM_LABELS[school.currentTerm]} {school.academicYear}
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-900 leading-relaxed">
          <strong>{inspectorate.relevantStandard}</strong> — {inspectorate.headline}
        </p>
      </div>

      {/* Key metrics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">Key metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Metric label="Students" value={String(totalStudents)} />
          <Metric label="Assessments completed" value={`${completedCount} (${completionPct}%)`} />
          <Metric
            label="Average wellbeing score"
            value={avgScore !== null ? `${avgScore} / ${maxTotal}` : "—"}
          />
          <Metric
            label="Safeguarding alerts (YTD)"
            value={`${flaggedAlerts} actioned · ${openAlerts} open`}
          />
        </div>
      </div>

      {/* Domain averages */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">Provision by domain</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-2 py-2 text-xs font-semibold text-gray-500 uppercase">Domain</th>
              <th className="text-right px-2 py-2 text-xs font-semibold text-gray-500 uppercase">
                School average
              </th>
              <th className="text-right px-2 py-2 text-xs font-semibold text-gray-500 uppercase">Max</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {framework.domains.map((d) => (
              <tr key={d.key}>
                <td className="px-2 py-2 text-sm font-medium text-gray-900">{d.label}</td>
                <td className="px-2 py-2 text-right text-sm font-bold text-gray-900">
                  {completedCount > 0 ? domainAverages[d.key] : "—"}
                </td>
                <td className="px-2 py-2 text-right text-xs text-gray-500">
                  {scoringModel?.maxDomainScore ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Level distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">Pupil distribution by attainment level</h2>
        <p className="text-xs text-gray-500 mb-4">
          Based on overall score bands. Categories shown in
          {inspectorate.levelTerminology === "khda" ? " KHDA terminology." : " MeQ internal terminology."}
        </p>
        <div className="space-y-3">
          {levelOrder.map((lvl) => {
            const count = levelCounts[lvl] ?? 0;
            const pct = completedCount > 0 ? Math.round((count / completedCount) * 100) : 0;
            const label = translateLevelLabel(lvl, inspectorate.levelTerminology);
            return (
              <div key={lvl}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900">{label}</span>
                  <span className="text-gray-500">{count} ({pct}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-meq-sky rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safeguarding */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-2">Safeguarding oversight</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          MeQ automatically scans free-text responses for safeguarding keywords and flags
          pupils whose wellbeing pulse shows concern. Designated Safeguarding Leads receive
          automatic email alerts, and every alert is recorded in the safeguarding dashboard
          where it must be actioned or dismissed — creating a clear audit trail.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Metric label="Open alerts" value={String(openAlerts)} />
          <Metric label="Actioned this year" value={String(flaggedAlerts)} />
        </div>
      </div>

      {/* Practice statement */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-2">How MeQ supports this standard</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 leading-relaxed">
          <li>
            <strong>Pupil voice:</strong> every child completes a termly self-assessment
            covering {framework.domains.length} domains of wellbeing, giving a direct signal
            from pupils themselves rather than inferred behaviour alone.
          </li>
          <li>
            <strong>Weekly pulse:</strong> short check-ins identify pupils who may be
            struggling, with automatic safeguarding alerts if scores or free text indicate concern.
          </li>
          <li>
            <strong>Targeted intervention:</strong> results map directly to a bank of evidence-aligned
            strategies which teachers log against individual pupils. Progress is measurable term-over-term.
          </li>
          <li>
            <strong>Staff wellbeing:</strong> teachers complete an equivalent check-in, reported
            aggregate-only for privacy, giving leadership a dual-lens view of the school community.
          </li>
          <li>
            <strong>Anonymised bespoke surveys:</strong> schools can run custom surveys targeted to
            cohorts, with moderation on responses to surface concerns safely.
          </li>
        </ul>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Generated by MeQ on {new Date().toLocaleDateString()} · {school.academicYear}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
