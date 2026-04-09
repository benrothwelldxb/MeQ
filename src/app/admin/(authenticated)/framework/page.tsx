import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolFramework } from "@/lib/framework";

const COLOR_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  pink: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
};

export default async function FrameworkPage() {
  const session = await getAdminSession();
  const framework = await getSchoolFramework(session.schoolId);
  const domains = framework.domains;

  // Count questions per tier
  const questionCounts = await prisma.frameworkQuestion.groupBy({
    by: ["tier"],
    where: { frameworkId: framework.id },
    _count: true,
  });
  const stdCount = questionCounts.find((q) => q.tier === "standard")?._count ?? 0;
  const jnrCount = questionCounts.find((q) => q.tier === "junior")?._count ?? 0;

  // Count interventions
  const interventionCount = await prisma.intervention.count({
    where: { frameworkId: framework.id },
  });

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {framework.name}
      </h1>
      <p className="text-gray-500 mb-8">
        {framework.config.levels ? `${domains.length} domains \u00b7 ${framework.config.levels.length} levels` : `${domains.length} domains`}
        {` \u00b7 ${stdCount + jnrCount} questions \u00b7 ${interventionCount} interventions`}
      </p>

      {/* Framework Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-meq-sky-light flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-extrabold text-meq-sky">{domains.length}</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {domains.length} Assessment Domains
            </h2>
            {framework.isDefault ? (
              <p className="text-gray-600 mt-1">
                The MeQ framework maps to the internationally recognised{" "}
                <strong>CASEL Social and Emotional Learning</strong> competencies.
                Each domain measures a core emotional skill using child-friendly language.
              </p>
            ) : (
              <p className="text-gray-600 mt-1">
                {framework.config.levels
                  ? `Students are assessed across ${domains.length} domains and placed into ${framework.config.levels.length} levels: ${framework.config.levels.join(", ")}.`
                  : `Students are assessed across ${domains.length} domains.`}
              </p>
            )}
          </div>
        </div>

        <div className="bg-meq-sky-light rounded-lg p-4">
          <p className="text-sm text-meq-sky font-medium">
            Assessments are a <strong>developmental snapshot</strong>, not a diagnosis.
            They capture how a child currently perceives their skills,
            helping schools identify strengths, growth areas, and where to focus support.
          </p>
        </div>
      </div>

      {/* Domain Cards */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Domains</h2>
      <div className="space-y-6 mb-8">
        {domains.map((domain) => {
          const colors = COLOR_STYLES[domain.color] || COLOR_STYLES.blue;
          const strengthMsgs = framework.messages[domain.key]?.["strength"] || [];
          const nextSteps = framework.messages[domain.key]?.["next_step"] || [];

          return (
            <div key={domain.key} className={`rounded-xl border-2 ${colors.border} overflow-hidden`}>
              <div className={`${colors.bg} px-6 py-4`}>
                <h3 className={`text-lg font-bold ${colors.text}`}>{domain.label}</h3>
                {domain.description && (
                  <p className="text-sm text-gray-600 mt-0.5">{domain.description}</p>
                )}
              </div>
              <div className="bg-white px-6 py-5">
                {strengthMsgs.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Strength Message
                    </h4>
                    <p className="text-sm text-gray-700">{strengthMsgs[0]}</p>
                  </div>
                )}
                {nextSteps.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Next Steps
                    </h4>
                    <ul className="space-y-1">
                      {nextSteps.map((step, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className={`${colors.text} mt-0.5`}>&bull;</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {strengthMsgs.length === 0 && nextSteps.length === 0 && (
                  <p className="text-sm text-gray-400">No messages configured for this domain yet.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scoring */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Scoring</h2>
      <div className={`grid gap-6 mb-6 ${Object.keys(framework.scoringModels).length > 1 ? "md:grid-cols-2" : ""}`}>
        {Object.values(framework.scoringModels).map((model) => (
          <div key={model.key} className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-3">{model.name}</h3>
            <div className="space-y-2 text-sm mb-4">
              <p className="text-gray-600">
                Max domain score: <strong>{model.maxDomainScore}</strong>
              </p>
              <p className="text-gray-600">
                Max total score: <strong>{model.maxTotalScore}</strong>
              </p>
            </div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Level Thresholds (per domain)
            </h4>
            <div className="space-y-1">
              {[...model.thresholds].reverse().map((t) => (
                <div key={t.level} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{t.level}</span>
                  <span className="font-mono text-gray-500">{t.min}+</span>
                </div>
              ))}
            </div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">
              Overall Thresholds
            </h4>
            <div className="space-y-1">
              {[...model.overallThresholds].reverse().map((t) => (
                <div key={t.level} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{t.level}</span>
                  <span className="font-mono text-gray-500">{t.min}+</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Question counts */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-3">Question Bank</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 mb-1">Standard Tier</p>
            <p className="text-lg font-bold text-gray-900">{stdCount} questions</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 mb-1">Junior Tier</p>
            <p className="text-lg font-bold text-gray-900">{jnrCount} questions</p>
          </div>
        </div>
      </div>

      {/* Reliability */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-3">Reliability Scoring</h3>
        <p className="text-sm text-gray-600 mb-4">
          Built-in reliability checks help interpret results with confidence.
          Reliability is visible to teachers and admins only.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">High</span>
            <p className="text-sm text-gray-600">Answers are internally consistent. Validation questions align with core questions.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">Medium</span>
            <p className="text-sm text-gray-600">Some minor inconsistencies between validation and core questions.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700 flex-shrink-0">Low</span>
            <p className="text-sm text-gray-600">Significant inconsistencies suggest the student may have rushed or responded randomly.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">Lite</span>
            <p className="text-sm text-gray-600">Reduced question mode — no validation or trap questions included.</p>
          </div>
        </div>
      </div>

      {/* Principles */}
      <div className="bg-meq-sky-light rounded-xl p-6">
        <h3 className="font-bold text-meq-sky mb-3">Key Principles</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-meq-sky font-bold">1.</span>
            <span><strong>Developmental, not diagnostic.</strong> Identifies where a child is on their learning journey, not what is wrong with them.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-meq-sky font-bold">2.</span>
            <span><strong>Strengths-based.</strong> Results always highlight what a child does well alongside areas for growth.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-meq-sky font-bold">3.</span>
            <span><strong>Growth-oriented.</strong> Termly assessments track progress, showing that skills develop with the right support.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-meq-sky font-bold">4.</span>
            <span><strong>Actionable.</strong> Every result links to specific, tiered intervention strategies teachers can implement immediately.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
