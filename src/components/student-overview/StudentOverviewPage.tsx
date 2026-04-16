import { notFound } from "next/navigation";
import Link from "next/link";
import { getStudentOverview } from "@/app/actions/student-overview";
import { getDomainTailwind } from "@/lib/domain-colors";
import DomainRadarChart from "./DomainRadarChart";
import ScoreTrendChart from "./ScoreTrendChart";
import PulseTrendChart from "./PulseTrendChart";
import SelfVsTeacherChart from "./SelfVsTeacherChart";
import SurveyResponseCard from "./SurveyResponseCard";
import PrintButton from "./PrintButton";
import InterventionLogPanel from "./InterventionLogPanel";
import ExportDataButton from "./ExportDataButton";

const TERM_LABELS: Record<string, string> = {
  term1: "Term 1",
  term2: "Term 2",
  term3: "Term 3",
};

export default async function StudentOverviewPage({
  studentId,
  backHref,
  backLabel,
  isAdmin = false,
}: {
  studentId: string;
  backHref: string;
  backLabel: string;
  isAdmin?: boolean;
}) {
  const data = await getStudentOverview(studentId);
  if (!data) notFound();

  const { student, school, framework, assessments, teacherAssessments, pulseChecks, surveyResponses, interventionLogs } = data;

  const latestAssessment = assessments[assessments.length - 1];
  const latestTeacherAssessment = teacherAssessments[teacherAssessments.length - 1];

  // Recent pulse average (last 4 weeks)
  const recentPulse = pulseChecks.slice(-4);
  const pulseAverage =
    recentPulse.length > 0
      ? (() => {
          let sum = 0;
          let count = 0;
          for (const p of recentPulse) {
            for (const domain of framework.domains) {
              const val = p.answers[domain.key];
              if (typeof val === "number") {
                sum += val;
                count++;
              }
            }
          }
          return count > 0 ? (sum / count).toFixed(1) : null;
        })()
      : null;

  const displayName = student.displayName || `${student.firstName} ${student.lastName}`;

  return (
    <div className="student-360">
      <Link href={backHref} className="text-sm text-meq-sky hover:underline print:hidden">
        &larr; {backLabel}
      </Link>

      {/* Header */}
      <div className="mt-4 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-gray-500 mt-1">
              {student.yearGroup}
              {student.className && ` · ${student.className}`}
              {" · "}
              {school.name} · {school.academicYear}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {student.sen && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                SEN
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
              {student.tier} tier
            </span>
            <PrintButton />
            {isAdmin && <ExportDataButton studentId={student.id} studentName={displayName} />}
          </div>
        </div>
      </div>

      {/* Overview stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Latest MeQ Score"
          value={latestAssessment ? String(latestAssessment.totalScore) : "—"}
          sublabel={
            latestAssessment
              ? `${TERM_LABELS[latestAssessment.term] ?? latestAssessment.term} ${latestAssessment.academicYear}`
              : "No assessment yet"
          }
        />
        <StatCard
          label="Overall Level"
          value={latestAssessment?.overallLevel ?? "—"}
          sublabel={`Reliability: ${latestAssessment?.reliability ?? "—"}`}
        />
        <StatCard
          label="Pulse Average"
          value={pulseAverage ? `${pulseAverage}/5` : "—"}
          sublabel={`Last ${recentPulse.length} weeks`}
        />
        <StatCard
          label="Surveys Completed"
          value={String(surveyResponses.length)}
          sublabel={surveyResponses.length === 1 ? "1 response" : `${surveyResponses.length} responses`}
        />
      </div>

      {/* Radar + Trend */}
      {latestAssessment && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Section title="Domain Scores">
            <DomainRadarChart
              domains={framework.domains}
              selfScores={latestAssessment.domainScores}
              teacherScores={latestTeacherAssessment?.domainScores}
              maxDomainScore={framework.maxDomainScore}
            />
            <p className="text-xs text-gray-400 text-center mt-2">
              Scores shown as % of maximum
            </p>
          </Section>
          <Section title="Overall Score Trend">
            {assessments.length >= 2 ? (
              <ScoreTrendChart assessments={assessments} maxTotalScore={framework.maxTotalScore} />
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-gray-400">
                Complete at least two assessments to see trend.
              </div>
            )}
          </Section>
        </div>
      )}

      {/* Domain growth table */}
      {assessments.length >= 2 && (
        <Section title="Domain Growth">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Term</th>
                  {framework.domains.map((d) => {
                    const tw = getDomainTailwind(d.color);
                    return (
                      <th key={d.key} className={`text-center px-2 py-2 text-xs font-semibold ${tw.text}`}>
                        {d.label}
                      </th>
                    );
                  })}
                  <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Overall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assessments.map((a, i) => {
                  const prev = i > 0 ? assessments[i - 1] : null;
                  return (
                    <tr key={a.id}>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">
                        {TERM_LABELS[a.term] ?? a.term} {a.academicYear}
                      </td>
                      {framework.domains.map((d) => {
                        const score = a.domainScores[d.key] ?? 0;
                        const prevScore = prev ? (prev.domainScores[d.key] ?? 0) : null;
                        const diff = prevScore !== null ? score - prevScore : null;
                        return (
                          <td key={d.key} className="text-center px-2 py-2 text-sm">
                            {score}
                            {diff !== null && diff !== 0 && (
                              <span
                                className={`text-xs ml-1 ${diff > 0 ? "text-emerald-600" : "text-red-500"}`}
                              >
                                {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center px-3 py-2 text-sm font-medium">{a.totalScore}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Pulse trends */}
      {school.pulseEnabled && (
        <Section title="Pulse Mood Trends">
          <PulseTrendChart domains={framework.domains} pulseChecks={pulseChecks} />
        </Section>
      )}

      {/* Self vs teacher */}
      {latestAssessment && latestTeacherAssessment && (
        <Section title={`Self vs Teacher (${TERM_LABELS[latestTeacherAssessment.term] ?? latestTeacherAssessment.term})`}>
          <p className="text-xs text-gray-500 mb-3">
            Teacher: {latestTeacherAssessment.teacherName}. Both shown as % of maximum for comparison.
          </p>
          <SelfVsTeacherChart
            domains={framework.domains}
            selfScores={latestAssessment.domainScores}
            teacherScores={latestTeacherAssessment.domainScores}
            maxDomainScore={framework.maxDomainScore}
          />
        </Section>
      )}

      {/* Intervention log */}
      <InterventionLogPanel
        studentId={student.id}
        domains={framework.domains}
        logs={interventionLogs}
      />

      {/* Survey responses */}
      {surveyResponses.length > 0 && (
        <Section title="Custom Survey Responses">
          <div className="space-y-3">
            {surveyResponses.map((r) => (
              <SurveyResponseCard key={r.id} response={r} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function StatCard({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 className="font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}
