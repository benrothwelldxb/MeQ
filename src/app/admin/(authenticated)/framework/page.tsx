import {
  DOMAINS,
  DOMAIN_LABELS,
  DOMAIN_DESCRIPTIONS,
  DOMAIN_COLORS,
  CASEL_ALIGNMENT,
  LEVEL_THRESHOLDS,
  JUNIOR_LEVEL_THRESHOLDS,
  MAX_DOMAIN_SCORE,
  MAX_TOTAL_SCORE,
  type Domain,
} from "@/lib/constants";

export default function FrameworkPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        MeQ Framework & Scoring
      </h1>
      <p className="text-gray-500 mb-8">
        How MeQ measures emotional skills, aligned to the internationally
        recognised CASEL Social and Emotional Learning framework.
      </p>

      {/* CASEL Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-meq-sky-light flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-extrabold text-meq-sky">5</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Aligned to CASEL 5 SEL Competencies
            </h2>
            <p className="text-gray-600 mt-1">
              MeQ&apos;s five domains map directly to the{" "}
              <strong>
                Collaborative for Academic, Social, and Emotional Learning
                (CASEL)
              </strong>{" "}
              framework — the most widely adopted SEL model globally, used in
              over 110 countries. Each MeQ domain measures the same core
              competency using child-friendly language.
            </p>
          </div>
        </div>

        <div className="bg-meq-sky-light rounded-lg p-4">
          <p className="text-sm text-meq-sky font-medium">
            MeQ is a <strong>developmental snapshot</strong>, not a diagnosis.
            It captures how a child currently perceives their emotional skills,
            helping schools identify strengths, growth areas, and where to focus
            support.
          </p>
        </div>
      </div>

      {/* Domain Alignment Cards */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Domain Alignment
      </h2>
      <div className="space-y-6 mb-8">
        {DOMAINS.map((domain) => {
          const colors = DOMAIN_COLORS[domain];
          const casel = CASEL_ALIGNMENT[domain];

          return (
            <div
              key={domain}
              className={`rounded-xl border-2 ${colors.border} overflow-hidden`}
            >
              {/* Header */}
              <div className={`${colors.bg} px-6 py-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-lg font-bold ${colors.text}`}>
                      {DOMAIN_LABELS[domain as Domain]}
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {DOMAIN_DESCRIPTIONS[domain as Domain]}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      CASEL Competency
                    </span>
                    <p className={`font-bold ${colors.text}`}>
                      {casel.caselName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="bg-white px-6 py-5">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* CASEL Definition */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      CASEL Definition
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {casel.caselDefinition}
                    </p>

                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">
                      Key CASEL Skills
                    </h4>
                    <ul className="space-y-1">
                      {casel.caselSkills.map((skill, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-600 flex items-start gap-2"
                        >
                          <span className={`${colors.text} mt-0.5`}>
                            &bull;
                          </span>
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* MeQ Alignment */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      How MeQ Measures This
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {casel.meqAlignment}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scoring Explanation */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Scoring Methodology
      </h2>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-3">Question Types & Weights</h3>
        <p className="text-sm text-gray-600 mb-4">
          Each question contributes to its domain score using a weighted system that
          values deeper thinking more highly:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 font-semibold text-gray-700">Type</th>
                <th className="text-left py-2 font-semibold text-gray-700">Weight</th>
                <th className="text-left py-2 font-semibold text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td className="py-2 text-gray-900">Self-Report</td>
                <td className="py-2"><span className="font-mono bg-gray-100 px-2 py-0.5 rounded">x1.0</span></td>
                <td className="py-2 text-gray-600">&quot;I know when I feel happy&quot; — direct self-reflection</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-900">Behaviour</td>
                <td className="py-2"><span className="font-mono bg-gray-100 px-2 py-0.5 rounded">x1.5</span></td>
                <td className="py-2 text-gray-600">&quot;I think before I act when upset&quot; — observable actions</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-900">Scenario</td>
                <td className="py-2"><span className="font-mono bg-gray-100 px-2 py-0.5 rounded">x2.0</span></td>
                <td className="py-2 text-gray-600">&quot;Someone knocks your lunch off the table...&quot; — applied reasoning</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Junior tier (ages 5-7) uses uniform weighting (x1.0) across all question types for simplicity.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Standard Tier */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-3">
            Standard Tier (Ages 8-11)
          </h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">
              <strong>40 questions</strong>: 25 core, 10 validation, 5 trap
            </p>
            <p className="text-gray-600">
              Max domain score: <strong>{MAX_DOMAIN_SCORE.standard}</strong>
            </p>
            <p className="text-gray-600">
              Max total score: <strong>{MAX_TOTAL_SCORE.standard}</strong>
            </p>
          </div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">
            Level Thresholds (per domain)
          </h4>
          <div className="space-y-1">
            {[...LEVEL_THRESHOLDS].reverse().map((t) => (
              <div key={t.level} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{t.level}</span>
                <span className="font-mono text-gray-500">{t.min}+</span>
              </div>
            ))}
          </div>
        </div>

        {/* Junior Tier */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-3">
            Junior Tier (Ages 5-7)
          </h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">
              <strong>20 questions</strong>: all core (no validation/trap)
            </p>
            <p className="text-gray-600">
              Max domain score: <strong>{MAX_DOMAIN_SCORE.junior}</strong>
            </p>
            <p className="text-gray-600">
              Max total score: <strong>{MAX_TOTAL_SCORE.junior}</strong>
            </p>
          </div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">
            Level Thresholds (per domain)
          </h4>
          <div className="space-y-1">
            {[...JUNIOR_LEVEL_THRESHOLDS].reverse().map((t) => (
              <div key={t.level} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{t.level}</span>
                <span className="font-mono text-gray-500">{t.min}+</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reliability */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-3">Reliability Scoring</h3>
        <p className="text-sm text-gray-600 mb-4">
          MeQ includes built-in reliability checks to help interpret results with confidence.
          Reliability is visible to teachers and admins only — never shown to students.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">High</span>
            <p className="text-sm text-gray-600">Answers are internally consistent. Validation questions align with core questions. No suspicious trap responses.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">Medium</span>
            <p className="text-sm text-gray-600">Some minor inconsistencies between validation and core questions, or a small number of extreme trap responses.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700 flex-shrink-0">Low</span>
            <p className="text-sm text-gray-600">Significant inconsistencies suggest the student may have rushed, not understood the questions, or responded randomly. Results should be interpreted with caution.</p>
          </div>
        </div>
      </div>

      {/* Teacher Assessment */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-3">Dual-Lens Assessment</h3>
        <p className="text-sm text-gray-600 mb-4">
          MeQ provides two perspectives on each child&apos;s emotional skills:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-bold text-blue-700 text-sm mb-1">Student Self-Report</h4>
            <p className="text-sm text-gray-600">
              40 questions (standard) or 20 questions (junior) answered by the student.
              Captures how the child <em>sees themselves</em>.
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-bold text-purple-700 text-sm mb-1">Teacher Observation</h4>
            <p className="text-sm text-gray-600">
              10 questions (2 per domain) completed by the class teacher.
              Captures how the child <em>presents to others</em>.
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          The most valuable insights come from comparing both perspectives. A student who
          self-reports high self-management but whose teacher observes frequent emotional
          outbursts may benefit from different support than their self-report alone would suggest.
        </p>
      </div>

      {/* Principles */}
      <div className="bg-meq-sky-light rounded-xl p-6">
        <h3 className="font-bold text-meq-sky mb-3">Key Principles</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-meq-sky font-bold">1.</span>
            <span><strong>Developmental, not diagnostic.</strong> MeQ identifies where a child is on their emotional learning journey, not what is &quot;wrong&quot; with them.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-meq-sky font-bold">2.</span>
            <span><strong>Strengths-based.</strong> Every child has areas of strength. Results always highlight what a child does well alongside areas for growth.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-meq-sky font-bold">3.</span>
            <span><strong>Growth-oriented.</strong> Termly assessments track progress, showing that emotional skills can and do develop with the right support.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-meq-sky font-bold">4.</span>
            <span><strong>Evidence-informed.</strong> Aligned to the CASEL framework, the most widely researched SEL model, with built-in reliability checking.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-meq-sky font-bold">5.</span>
            <span><strong>Actionable.</strong> Every result links to specific, tiered intervention strategies that teachers can implement immediately.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
