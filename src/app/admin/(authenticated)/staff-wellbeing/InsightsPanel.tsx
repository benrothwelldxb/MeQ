"use client";

import { useFormState, useFormStatus } from "react-dom";
import { generateStaffWellbeingInsight } from "@/app/actions/staff-wellbeing-insight";

type Narrative = {
  summary: string;
  strengths: { title: string; detail: string }[];
  developmentAreas: { title: string; detail: string }[];
  nextSteps: string[];
};

function GenerateButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50"
    >
      {pending ? "Thinking..." : label}
    </button>
  );
}

export default function InsightsPanel({
  isDsl,
  cohortReady,
  initialNarrative,
  initialGeneratedAt,
}: {
  isDsl: boolean;
  cohortReady: boolean;
  initialNarrative: Narrative | null;
  initialGeneratedAt: Date | null;
}) {
  const [state, formAction] = useFormState(generateStaffWellbeingInsight, null);
  const narrative =
    state && "success" in state && state.success ? state.narrative : initialNarrative;
  const error = state && "error" in state ? state.error : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h2 className="font-bold text-gray-900">AI-generated commentary</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            A starting point for discussion — generated from aggregated data only, no
            individual staff responses are sent.
          </p>
        </div>
        {isDsl && cohortReady && (
          <form action={formAction} className="flex-shrink-0">
            <input type="hidden" name="force" value={narrative ? "true" : "false"} />
            <GenerateButton label={narrative ? "Regenerate" : "Generate insights"} />
          </form>
        )}
      </div>

      {!isDsl && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
          Only Designated Safeguarding Leads can generate or view staff wellbeing commentary.
        </div>
      )}

      {isDsl && !cohortReady && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
          Commentary will be available once at least 5 staff have completed the term&apos;s check-in.
        </div>
      )}

      {isDsl && cohortReady && error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}

      {isDsl && narrative && (
        <div className="mt-4 space-y-5">
          {/* Summary */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Overall
            </p>
            <p className="text-sm text-gray-800 leading-relaxed">{narrative.summary}</p>
          </div>

          {/* Strengths */}
          {narrative.strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">
                Strengths
              </p>
              <ul className="space-y-2">
                {narrative.strengths.map((s, i) => (
                  <li key={i} className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    <p className="text-sm font-semibold text-emerald-900">{s.title}</p>
                    <p className="text-sm text-emerald-800 mt-0.5">{s.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Development areas */}
          {narrative.developmentAreas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
                Areas to develop
              </p>
              <ul className="space-y-2">
                {narrative.developmentAreas.map((d, i) => (
                  <li key={i} className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <p className="text-sm font-semibold text-amber-900">{d.title}</p>
                    <p className="text-sm text-amber-800 mt-0.5">{d.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next steps */}
          {narrative.nextSteps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
                Practical next steps
              </p>
              <ol className="space-y-1.5 list-decimal pl-5">
                {narrative.nextSteps.map((step, i) => (
                  <li key={i} className="text-sm text-gray-800 leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p className="text-xs text-gray-400 italic">
            Generated{" "}
            {initialGeneratedAt ? new Date(initialGeneratedAt).toLocaleDateString() : "just now"}
            . This is AI-generated from aggregate data — use it as a starting point for team
            discussion, not as a definitive assessment.
          </p>
        </div>
      )}

      {isDsl && cohortReady && !narrative && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 mt-2">
          Click <strong>Generate insights</strong> above to produce a written commentary on your
          school&apos;s staff wellbeing data for this term. You can regenerate any time.
        </div>
      )}
    </div>
  );
}
