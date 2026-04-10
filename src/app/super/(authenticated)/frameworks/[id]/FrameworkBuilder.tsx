"use client";

import { useState } from "react";
import {
  updateFrameworkConfig,
  addFrameworkQuestion,
  deleteFrameworkQuestion,
  updateFrameworkDomain,
  addFrameworkDomain,
  deleteFrameworkDomain,
  addFrameworkIntervention,
  deleteFrameworkIntervention,
  upsertPulseQuestion,
  deletePulseQuestion,
  updateFrameworkSchedule,
} from "@/app/actions/frameworks";
import { uploadFrameworkQuestions } from "@/app/actions/framework-questions-upload";
import { uploadFrameworkInterventions, uploadFrameworkPulseQuestions } from "@/app/actions/framework-bulk-upload";
import QuestionMediaButton from "@/components/QuestionMediaButton";

interface Domain {
  id: string;
  key: string;
  label: string;
  description: string | null;
  color: string;
  sortOrder: number;
}

interface Question {
  id: string;
  domainKey: string;
  tier: string;
  orderIndex: number;
  prompt: string;
  type: string;
  questionFormat: string;
  weight: number;
  audioUrl?: string | null;
  symbolImageUrl?: string | null;
}

interface InterventionData {
  id: string;
  domain: string;
  level: string;
  audience: string;
  title: string;
  description: string;
}

interface PulseQuestionData {
  id: string;
  tier: string;
  domain: string;
  prompt: string;
  emoji: string | null;
  orderIndex: number;
}

interface FrameworkConfig {
  levels?: string[];
  tiers?: Record<string, {
    levelThresholds?: Array<{ level: string; min: number }>;
    overallThresholds?: Array<{ level: string; min: number }>;
    maxDomainScore?: number;
    maxTotalScore?: number;
  }>;
  strengthMessages?: Record<string, string>;
  nextSteps?: Record<string, string[]>;
}

const COLORS = ["blue", "emerald", "purple", "amber", "rose", "red", "green", "indigo", "pink", "teal"];
const COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-500/20 text-blue-400",
  emerald: "bg-emerald-500/20 text-emerald-400",
  purple: "bg-purple-500/20 text-purple-400",
  amber: "bg-amber-500/20 text-amber-400",
  rose: "bg-rose-500/20 text-rose-400",
  red: "bg-red-500/20 text-red-400",
  green: "bg-green-500/20 text-green-400",
  indigo: "bg-indigo-500/20 text-indigo-400",
  pink: "bg-pink-500/20 text-pink-400",
  teal: "bg-teal-500/20 text-teal-400",
};

const DEFAULT_ANSWER_OPTIONS = JSON.stringify([
  { label: "Not like me at all", value: 1 },
  { label: "A little like me", value: 2 },
  { label: "Quite like me", value: 3 },
  { label: "Very much like me", value: 4 },
]);

const DEFAULT_SCORE_MAP = JSON.stringify({ "1": 0, "2": 1, "3": 2, "4": 3 });

export default function FrameworkBuilder({
  framework,
  domains,
  questions,
  interventions,
  pulseQuestions,
}: {
  framework: { id: string; name: string; config: string; isDefault: boolean; assessmentFrequency: string; activeTerms: string };
  domains: Domain[];
  questions: Question[];
  interventions: InterventionData[];
  pulseQuestions: PulseQuestionData[];
}) {
  const [tab, setTab] = useState<"domains" | "questions" | "interventions" | "pulse" | "scoring" | "schedule">("domains");
  const [selectedTier, setSelectedTier] = useState("standard");
  const config: FrameworkConfig = JSON.parse(framework.config || "{}");

  const tabs = [
    { key: "domains", label: "Domains" },
    { key: "questions", label: "Questions" },
    { key: "interventions", label: `Interventions (${interventions.length})` },
    { key: "pulse", label: `Pulse (${pulseQuestions.length})` },
    { key: "scoring", label: "Scoring & Messages" },
    { key: "schedule", label: "Schedule" },
  ];

  const tierQuestions = questions.filter((q) => q.tier === selectedTier);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-meq-sky text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Domains Tab */}
      {tab === "domains" && (
        <div className="space-y-4">
          {domains.map((d) => (
            <div key={d.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${COLOR_CLASSES[d.color] || COLOR_CLASSES.blue}`}>
                    {d.label}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">{d.key}</span>
                </div>
                {!framework.isDefault && (
                  <button
                    onClick={async () => {
                      if (confirm(`Delete domain "${d.label}"?`)) {
                        await deleteFrameworkDomain(d.id, framework.id);
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  defaultValue={d.label}
                  onBlur={async (e) => {
                    if (e.target.value !== d.label) {
                      await updateFrameworkDomain(d.id, framework.id, { label: e.target.value });
                    }
                  }}
                  placeholder="Label"
                  className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
                />
                <select
                  defaultValue={d.color}
                  onChange={async (e) => {
                    await updateFrameworkDomain(d.id, framework.id, { color: e.target.value });
                  }}
                  className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
                >
                  {COLORS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <textarea
                defaultValue={d.description || ""}
                onBlur={async (e) => {
                  await updateFrameworkDomain(d.id, framework.id, { description: e.target.value || undefined });
                }}
                placeholder="Description (optional)"
                rows={2}
                className="mt-3 w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                {questions.filter((q) => q.domainKey === d.key).length} questions
              </p>
            </div>
          ))}

          {!framework.isDefault && (
            <button
              onClick={async () => {
                const label = prompt("Domain name:");
                if (!label) return;
                const key = label.replace(/\s+/g, "").replace(/[^a-zA-Z]/g, "");
                await addFrameworkDomain(framework.id, {
                  key,
                  label,
                  color: COLORS[domains.length % COLORS.length],
                });
              }}
              className="w-full py-3 rounded-xl border-2 border-dashed border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 text-sm font-medium transition-colors"
            >
              + Add Domain
            </button>
          )}
        </div>
      )}

      {/* Questions Tab */}
      {tab === "questions" && (
        <div>
          <div className="flex gap-2 mb-4">
            {["standard", "junior"].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTier(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedTier === t
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t === "standard" ? "Standard (8-11)" : "Junior (5-7)"}
              </button>
            ))}
          </div>

          {/* Guidance Panel */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5 mb-4">
            <h3 className="font-semibold text-white text-sm mb-2">Question Guidelines</h3>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
              <div>
                <p className="font-medium text-gray-300 mb-1">Recommended per domain:</p>
                <ul className="space-y-0.5">
                  <li>{selectedTier === "standard" ? "5" : "3-4"} core questions (scored)</li>
                  <li>{selectedTier === "standard" ? "2" : "0"} validation questions (reliability check)</li>
                  <li>{selectedTier === "standard" ? "1" : "0"} trap question (attention check)</li>
                </ul>
                <p className="mt-2 text-gray-500">
                  {selectedTier === "standard"
                    ? `Total: ${domains.length * 8} questions (${domains.length} domains x 8)`
                    : `Total: ${domains.length * 4} questions (${domains.length} domains x 4)`}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-300 mb-1">Question types explained:</p>
                <ul className="space-y-1">
                  <li><span className="text-emerald-400 font-medium">Core</span> — directly measures the domain. These are scored.</li>
                  <li><span className="text-blue-400 font-medium">Validation</span> — rephrased version of a core question. Checks consistency (not scored).</li>
                  <li><span className="text-amber-400 font-medium">Trap</span> — extreme statement no one would honestly agree with. Flags inattentive responses.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Per-domain progress */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {domains.map((d) => {
              const domainQs = tierQuestions.filter((q) => q.domainKey === d.key);
              const coreCount = domainQs.filter((q) => q.type === "core").length;
              const valCount = domainQs.filter((q) => q.type === "validation").length;
              const trapCount = domainQs.filter((q) => q.type === "trap").length;
              const minCore = selectedTier === "standard" ? 5 : 3;
              const isReady = coreCount >= minCore;
              return (
                <div key={d.key} className={`rounded-lg border px-3 py-2 ${isReady ? "bg-emerald-500/10 border-emerald-500/30" : "bg-gray-800 border-gray-700"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${COLOR_CLASSES[d.color] || ""}`}>{d.label}</span>
                    {isReady ? (
                      <span className="text-emerald-400 text-xs">Ready</span>
                    ) : (
                      <span className="text-amber-400 text-xs">{minCore - coreCount} more core needed</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {coreCount} core &middot; {valCount} validation &middot; {trapCount} trap
                  </p>
                </div>
              );
            })}
          </div>

          {/* Question list */}
          <div className="space-y-2 mb-4">
            {tierQuestions.length === 0 && (
              <p className="text-gray-500 text-sm py-8 text-center">No questions for this tier yet. Add at least {selectedTier === "standard" ? 5 : 3} core questions per domain.</p>
            )}
            {tierQuestions.map((q) => {
              const domain = domains.find((d) => d.key === q.domainKey);
              const typeColor = q.type === "core" ? "text-emerald-400" : q.type === "validation" ? "text-blue-400" : "text-amber-400";
              return (
                <div key={q.id} className="bg-gray-800 rounded-lg border border-gray-700 px-4 py-3 flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-mono w-8">Q{q.orderIndex}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${COLOR_CLASSES[domain?.color || "blue"]}`}>
                    {domain?.label || q.domainKey}
                  </span>
                  <span className="text-sm text-gray-300 flex-1">{q.prompt}</span>
                  <span className={`text-xs ${typeColor}`}>{q.type}</span>
                  <span className="text-xs text-gray-600">w{q.weight}</span>
                  <QuestionMediaButton
                    questionId={q.id}
                    frameworkId={framework.id}
                    mediaType="image"
                    currentUrl={q.symbolImageUrl}
                  />
                  <QuestionMediaButton
                    questionId={q.id}
                    frameworkId={framework.id}
                    mediaType="audio"
                    currentUrl={q.audioUrl}
                  />
                  {!framework.isDefault && (
                    <button
                      onClick={async () => {
                        await deleteFrameworkQuestion(q.id, framework.id);
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {!framework.isDefault && (
            <>
              <AddQuestionForm
                frameworkId={framework.id}
                domains={domains}
                tier={selectedTier}
              />
              <CSVQuestionUpload
                frameworkId={framework.id}
                tier={selectedTier}
                domainKeys={domains.map((d) => d.key)}
              />
            </>
          )}
        </div>
      )}

      {/* Interventions Tab */}
      {tab === "interventions" && (
        <InterventionsPanel
          frameworkId={framework.id}
          domains={domains}
          interventions={interventions}
        />
      )}

      {/* Pulse Tab */}
      {tab === "pulse" && (
        <PulsePanel
          frameworkId={framework.id}
          domains={domains}
          pulseQuestions={pulseQuestions}
        />
      )}

      {/* Scoring Tab */}
      {tab === "scoring" && (
        <ScoringConfig
          frameworkId={framework.id}
          config={config}
          domains={domains}
        />
      )}

      {/* Schedule Tab */}
      {tab === "schedule" && (
        <SchedulePanel
          frameworkId={framework.id}
          assessmentFrequency={framework.assessmentFrequency}
          activeTerms={framework.activeTerms}
        />
      )}
    </div>
  );
}

function SchedulePanel({
  frameworkId,
  assessmentFrequency: initialFrequency,
  activeTerms: initialTerms,
}: {
  frameworkId: string;
  assessmentFrequency: string;
  activeTerms: string;
}) {
  const [frequency, setFrequency] = useState(initialFrequency);
  const [terms, setTerms] = useState<string[]>(JSON.parse(initialTerms || "[]"));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const FREQUENCIES = [
    { key: "termly", label: "Termly (3x per year)", terms: ["term1", "term2", "term3"] },
    { key: "biannual", label: "Twice per year", terms: ["term1", "term3"] },
    { key: "annual", label: "Once per year", terms: ["term1"] },
    { key: "custom", label: "Custom", terms: [] },
  ];

  const TERM_OPTIONS = [
    { key: "term1", label: "Term 1" },
    { key: "term2", label: "Term 2" },
    { key: "term3", label: "Term 3" },
  ];

  const handleFrequencyChange = (newFreq: string) => {
    setFrequency(newFreq);
    const preset = FREQUENCIES.find((f) => f.key === newFreq);
    if (preset && newFreq !== "custom") {
      setTerms(preset.terms);
    }
  };

  const toggleTerm = (termKey: string) => {
    setTerms((prev) => prev.includes(termKey) ? prev.filter((t) => t !== termKey) : [...prev, termKey]);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateFrameworkSchedule(frameworkId, frequency, terms);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">
        Control how often students complete the full assessment.
        The Weekly Pulse and bespoke surveys run independently of this schedule.
      </p>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="font-bold text-white mb-3">Assessment Frequency</h3>
        <div className="space-y-2">
          {FREQUENCIES.map((f) => (
            <label key={f.key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-700/50 cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value={f.key}
                checked={frequency === f.key}
                onChange={() => handleFrequencyChange(f.key)}
                className="mt-0.5 w-4 h-4 text-meq-sky focus:ring-meq-sky"
              />
              <div>
                <p className="text-sm font-medium text-white">{f.label}</p>
                {f.terms.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Opens in {f.terms.map((t) => t.replace("term", "Term ")).join(", ")}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="font-bold text-white mb-3">Active Terms</h3>
        <p className="text-xs text-gray-400 mb-3">
          Which terms the assessment is available in. Students only see the assessment
          when the school&apos;s current term matches one of these.
        </p>
        <div className="flex gap-2 flex-wrap">
          {TERM_OPTIONS.map((t) => (
            <button
              key={t.key}
              onClick={() => toggleTerm(t.key)}
              disabled={frequency !== "custom"}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                terms.includes(t.key)
                  ? "bg-meq-sky text-white"
                  : "bg-gray-700 text-gray-400"
              } ${frequency !== "custom" ? "opacity-60 cursor-not-allowed" : "hover:opacity-80"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {frequency !== "custom" && (
          <p className="text-xs text-gray-500 mt-2">Switch to Custom to edit terms directly.</p>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save Schedule"}
      </button>
    </div>
  );
}

function AddQuestionForm({
  frameworkId,
  domains,
  tier,
}: {
  frameworkId: string;
  domains: Domain[];
  tier: string;
}) {
  const [prompt, setPrompt] = useState("");
  const [domainKey, setDomainKey] = useState(domains[0]?.key || "");
  const [type, setType] = useState("core");
  const [reversed, setReversed] = useState(false);
  const [adding, setAdding] = useState(false);

  const REVERSE_SCORE_MAP = JSON.stringify({ "1": 3, "2": 2, "3": 1, "4": 0 });

  const handleAdd = async () => {
    if (!prompt.trim() || !domainKey) return;
    setAdding(true);
    await addFrameworkQuestion(frameworkId, {
      domainKey,
      tier,
      prompt: prompt.trim(),
      questionFormat: "self-report",
      answerOptions: DEFAULT_ANSWER_OPTIONS,
      scoreMap: reversed ? REVERSE_SCORE_MAP : DEFAULT_SCORE_MAP,
      weight: 1.0,
      type,
    });
    setPrompt("");
    setReversed(false);
    setAdding(false);
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-3">Add Question</h3>
      <div className="flex gap-3 mb-3">
        <select
          value={domainKey}
          onChange={(e) => setDomainKey(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
        >
          {domains.map((d) => (
            <option key={d.key} value={d.key}>{d.label}</option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
        >
          <option value="core">Core</option>
          <option value="validation">Validation</option>
          <option value="trap">Trap</option>
        </select>
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 cursor-pointer">
          <input type="checkbox" checked={reversed} onChange={(e) => setReversed(e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-500 text-amber-500 focus:ring-amber-500" />
          <span className="text-xs text-gray-400 whitespace-nowrap">Reverse scored</span>
        </label>
      </div>
      <div className="flex gap-3">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Question prompt..."
          className="flex-1 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
        />
        <button
          onClick={handleAdd}
          disabled={adding || !prompt.trim()}
          className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
        >
          {adding ? "..." : "Add"}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">Uses 4-point Likert scale. Reverse scored = highest answer gives lowest score (prevents acquiescence bias).</p>
    </div>
  );
}

function ScoringConfig({
  frameworkId,
  config,
  domains,
}: {
  frameworkId: string;
  config: FrameworkConfig;
  domains: Domain[];
}) {
  const [localConfig, setLocalConfig] = useState(config);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateThreshold = (tier: string, type: "levelThresholds" | "overallThresholds", index: number, min: number) => {
    const newConfig = { ...localConfig };
    if (!newConfig.tiers) newConfig.tiers = {};
    if (!newConfig.tiers[tier]) newConfig.tiers[tier] = {};
    const arr = [...(newConfig.tiers[tier][type] || [])];
    arr[index] = { ...arr[index], min };
    newConfig.tiers[tier] = { ...newConfig.tiers[tier], [type]: arr };
    setLocalConfig(newConfig);
  };

  const updateMessage = (domain: string, message: string) => {
    const newConfig = { ...localConfig };
    if (!newConfig.strengthMessages) newConfig.strengthMessages = {};
    newConfig.strengthMessages[domain] = message;
    setLocalConfig(newConfig);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateFrameworkConfig(frameworkId, JSON.stringify(localConfig));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Thresholds per tier */}
      {["standard", "junior"].map((tier) => {
        const tierConfig = localConfig.tiers?.[tier];
        return (
          <div key={tier} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="font-bold text-white mb-3">{tier === "standard" ? "Standard Tier" : "Junior Tier"} Thresholds</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-2">Per-Domain Levels</p>
                {(tierConfig?.levelThresholds || []).map((t, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 w-24">{t.level}</span>
                    <input
                      type="number"
                      value={t.min}
                      onChange={(e) => updateThreshold(tier, "levelThresholds", i, parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 rounded bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Overall Levels</p>
                {(tierConfig?.overallThresholds || []).map((t, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 w-24">{t.level}</span>
                    <input
                      type="number"
                      value={t.min}
                      onChange={(e) => updateThreshold(tier, "overallThresholds", i, parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 rounded bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Strength messages */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <h3 className="font-bold text-white mb-3">Strength Messages</h3>
        <p className="text-xs text-gray-400 mb-3">Shown to students when a domain is identified as a strength.</p>
        <div className="space-y-3">
          {domains.map((d) => (
            <div key={d.key}>
              <label className="text-xs text-gray-400 mb-1 block">{d.label}</label>
              <input
                defaultValue={localConfig.strengthMessages?.[d.key] || ""}
                onChange={(e) => updateMessage(d.key, e.target.value)}
                placeholder={`Strength message for ${d.label}...`}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save Configuration"}
      </button>
    </div>
  );
}

const LEVELS = ["Emerging", "Developing", "Secure", "Advanced"];

function InterventionsPanel({
  frameworkId,
  domains,
  interventions,
}: {
  frameworkId: string;
  domains: Domain[];
  interventions: InterventionData[];
}) {
  const [selectedDomain, setSelectedDomain] = useState(domains[0]?.key || "");
  const [selectedLevel, setSelectedLevel] = useState("Emerging");
  const [selectedAudience, setSelectedAudience] = useState("teacher");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!title.trim() || !description.trim()) return;
    setAdding(true);
    await addFrameworkIntervention(frameworkId, {
      domain: selectedDomain,
      level: selectedLevel,
      audience: selectedAudience,
      title: title.trim(),
      description: description.trim(),
    });
    setTitle("");
    setDescription("");
    setAdding(false);
  };

  // Group interventions by domain → level
  const grouped: Record<string, Record<string, InterventionData[]>> = {};
  for (const iv of interventions) {
    if (!grouped[iv.domain]) grouped[iv.domain] = {};
    if (!grouped[iv.domain][iv.level]) grouped[iv.domain][iv.level] = [];
    grouped[iv.domain][iv.level].push(iv);
  }

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        {interventions.length} interventions across {domains.length} domains.
        Interventions are suggested strategies shown to teachers based on class-level domain scores.
      </p>

      {/* Intervention list grouped by domain → level */}
      {domains.map((d) => {
        const domainIvs = grouped[d.key];
        if (!domainIvs || Object.keys(domainIvs).length === 0) {
          return (
            <div key={d.key} className="mb-4">
              <h3 className={`text-sm font-semibold mb-2 ${COLOR_CLASSES[d.color] || "text-gray-400"}`}>{d.label}</h3>
              <p className="text-xs text-gray-500 bg-gray-800 rounded-lg px-4 py-3">No interventions yet for this domain.</p>
            </div>
          );
        }
        return (
          <div key={d.key} className="mb-6">
            <h3 className={`text-sm font-semibold mb-2 ${COLOR_CLASSES[d.color] || "text-gray-400"}`}>{d.label}</h3>
            {LEVELS.map((level) => {
              const items = domainIvs[level] || [];
              if (items.length === 0) return null;
              return (
                <div key={level} className="bg-gray-800 rounded-lg border border-gray-700 p-3 mb-2">
                  <p className="text-xs font-medium text-gray-400 mb-2">{level}</p>
                  {items.map((iv) => (
                    <div key={iv.id} className="flex items-start justify-between gap-2 mb-1.5 last:mb-0">
                      <div className="flex-1">
                        <span className="text-sm text-white font-medium">{iv.title}</span>
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${
                          iv.audience === "student" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                        }`}>{iv.audience}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{iv.description}</p>
                      </div>
                      <button
                        onClick={async () => { await deleteFrameworkIntervention(iv.id, frameworkId); }}
                        className="text-xs text-red-400 hover:text-red-300 flex-shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Add intervention form */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mt-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Add Intervention</h3>
        <div className="flex gap-2 mb-3 flex-wrap">
          <select value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)} className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none">
            {domains.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
          <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none">
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={selectedAudience} onChange={(e) => setSelectedAudience(e.target.value)} className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none">
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Intervention title"
          className="w-full mb-2 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description / instructions"
          rows={2}
          className="w-full mb-3 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !title.trim() || !description.trim()}
          className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
        >
          {adding ? "Adding..." : "Add Intervention"}
        </button>
      </div>

      <CSVInterventionUpload frameworkId={frameworkId} domainKeys={domains.map((d) => d.key)} />
    </div>
  );
}

function CSVInterventionUpload({
  frameworkId,
  domainKeys,
}: {
  frameworkId: string;
  domainKeys: string[];
}) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ count?: number; errors?: string[]; error?: string } | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    const text = await file.text();
    const res = await uploadFrameworkInterventions(frameworkId, text);
    setResult(res);
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mt-4">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Bulk Upload Interventions via CSV</h3>
      <div className="bg-gray-700/50 rounded-lg p-3 mb-3">
        <p className="text-xs text-gray-400 mb-1">Required columns: <code className="text-gray-300">domain</code>, <code className="text-gray-300">level</code>, <code className="text-gray-300">title</code>, <code className="text-gray-300">description</code></p>
        <p className="text-xs text-gray-400">Optional: <code className="text-gray-300">audience</code> (teacher/student, default: teacher)</p>
        <p className="text-xs text-gray-500 mt-2">Levels: Emerging, Developing, Secure, Advanced</p>
        <p className="text-xs text-gray-500">Domains: {domainKeys.join(", ")}</p>
      </div>
      <input
        type="file"
        accept=".csv"
        onChange={handleUpload}
        disabled={uploading}
        className="block w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600 cursor-pointer disabled:opacity-50"
      />
      {uploading && <p className="text-xs text-gray-400 mt-2">Uploading...</p>}
      {result?.error && <p className="text-xs text-red-400 mt-2">{result.error}</p>}
      {result?.count !== undefined && (
        <div className="mt-2">
          <p className="text-xs text-emerald-400">{result.count} interventions added successfully.</p>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-1">
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-amber-400">{err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CSVQuestionUpload({
  frameworkId,
  tier,
  domainKeys,
}: {
  frameworkId: string;
  tier: string;
  domainKeys: string[];
}) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ count?: number; errors?: string[]; error?: string } | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    const text = await file.text();
    const res = await uploadFrameworkQuestions(frameworkId, tier, text);
    setResult(res);
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mt-4">
      <h3 className="text-sm font-medium text-gray-400 mb-2">
        Bulk Upload via CSV
        <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded bg-gray-700 text-gray-300">
          {tier === "standard" ? "Standard (8-11)" : "Junior (5-7)"}
        </span>
      </h3>
      <div className="bg-gray-700/50 rounded-lg p-3 mb-3">
        <p className="text-xs text-gray-400 mb-1">Required columns: <code className="text-gray-300">domain</code>, <code className="text-gray-300">prompt</code></p>
        <p className="text-xs text-gray-400">Optional: <code className="text-gray-300">type</code> (core/validation/trap), <code className="text-gray-300">weight</code>, <code className="text-gray-300">reverse</code> (yes/no)</p>
        <p className="text-xs text-gray-500 mt-2">Domain values can use names or keys (case-insensitive): {domainKeys.join(", ")}</p>
      </div>

      <input
        type="file"
        accept=".csv"
        onChange={handleUpload}
        disabled={uploading}
        className="block w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600 cursor-pointer disabled:opacity-50"
      />

      {uploading && <p className="text-xs text-gray-400 mt-2">Uploading...</p>}

      {result?.error && (
        <p className="text-xs text-red-400 mt-2">{result.error}</p>
      )}

      {result?.count !== undefined && (
        <div className="mt-2">
          <p className="text-xs text-emerald-400">{result.count} questions added successfully.</p>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-1">
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-amber-400">{err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PulsePanel({
  frameworkId,
  domains,
  pulseQuestions,
}: {
  frameworkId: string;
  domains: Domain[];
  pulseQuestions: PulseQuestionData[];
}) {
  const [selectedTier, setSelectedTier] = useState("standard");
  const [saving, setSaving] = useState<string | null>(null);

  const tierQuestions = pulseQuestions.filter((pq) => pq.tier === selectedTier);

  // Build a map of existing questions by domain
  const existingByDomain: Record<string, PulseQuestionData> = {};
  for (const pq of tierQuestions) existingByDomain[pq.domain] = pq;

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        Weekly Pulse: a 5-minute check-in where students rate how they&apos;re feeling
        on each domain using a 1-5 emoji scale. One question per domain per tier.
        The optional emoji field sets a visual icon shown above the question
        (e.g. 🧐 for self-awareness, 😌 for managing emotions).
      </p>

      <div className="flex gap-2 mb-4">
        {["standard", "junior"].map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTier(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedTier === t ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t === "standard" ? "Standard (8-11)" : "Junior (5-7)"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {domains.map((d, idx) => {
          const existing = existingByDomain[d.key];
          const savingThis = saving === d.key;
          return (
            <div key={d.key} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${COLOR_CLASSES[d.color] || COLOR_CLASSES.blue}`}>
                  {d.label}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  key={`prompt-${selectedTier}-${d.key}-${existing?.id || "new"}`}
                  defaultValue={existing?.prompt || ""}
                  placeholder={selectedTier === "junior" ? `How are you feeling about ${d.label}?` : `I feel confident with ${d.label}`}
                  onBlur={async (e) => {
                    const prompt = e.target.value.trim();
                    if (!prompt || prompt === existing?.prompt) return;
                    setSaving(d.key);
                    await upsertPulseQuestion(frameworkId, {
                      tier: selectedTier,
                      domain: d.key,
                      prompt,
                      emoji: existing?.emoji || undefined,
                      orderIndex: existing?.orderIndex ?? idx + 1,
                    });
                    setSaving(null);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
                />
                <input
                  key={`emoji-${selectedTier}-${d.key}-${existing?.id || "new"}`}
                  defaultValue={existing?.emoji || ""}
                  placeholder="🧐"
                  title="Domain icon emoji (shown above the question)"
                  maxLength={3}
                  onBlur={async (e) => {
                    const emoji = e.target.value.trim();
                    if (emoji === (existing?.emoji || "")) return;
                    if (!existing?.prompt) return; // need prompt to save
                    setSaving(d.key);
                    await upsertPulseQuestion(frameworkId, {
                      tier: selectedTier,
                      domain: d.key,
                      prompt: existing.prompt,
                      emoji: emoji || undefined,
                      orderIndex: existing.orderIndex,
                    });
                    setSaving(null);
                  }}
                  className="w-16 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm text-center focus:border-meq-sky focus:outline-none"
                />
                {existing && (
                  <button
                    onClick={async () => {
                      if (confirm(`Delete pulse question for ${d.label}?`)) {
                        await deletePulseQuestion(existing.id, frameworkId);
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-300 px-2"
                  >
                    Delete
                  </button>
                )}
                {savingThis && <span className="text-xs text-gray-500 self-center">Saving...</span>}
              </div>
              {!existing && (
                <p className="text-xs text-gray-500 mt-2">Type a prompt and click outside to save.</p>
              )}
            </div>
          );
        })}
      </div>

      <CSVPulseUpload frameworkId={frameworkId} domainKeys={domains.map((d) => d.key)} />
    </div>
  );
}

function CSVPulseUpload({
  frameworkId,
  domainKeys,
}: {
  frameworkId: string;
  domainKeys: string[];
}) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ count?: number; errors?: string[]; error?: string } | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    const text = await file.text();
    const res = await uploadFrameworkPulseQuestions(frameworkId, text);
    setResult(res);
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mt-6">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Bulk Upload Pulse Questions via CSV</h3>
      <div className="bg-gray-700/50 rounded-lg p-3 mb-3">
        <p className="text-xs text-gray-400 mb-1">Required columns: <code className="text-gray-300">domain</code>, <code className="text-gray-300">prompt</code></p>
        <p className="text-xs text-gray-400">Optional: <code className="text-gray-300">tier</code> (standard/junior, default: standard), <code className="text-gray-300">emoji</code></p>
        <p className="text-xs text-gray-500 mt-2">Domains: {domainKeys.join(", ")}</p>
        <p className="text-xs text-gray-500">Note: One pulse question per domain per tier — existing ones will be updated.</p>
      </div>
      <input
        type="file"
        accept=".csv"
        onChange={handleUpload}
        disabled={uploading}
        className="block w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600 cursor-pointer disabled:opacity-50"
      />
      {uploading && <p className="text-xs text-gray-400 mt-2">Uploading...</p>}
      {result?.error && <p className="text-xs text-red-400 mt-2">{result.error}</p>}
      {result?.count !== undefined && (
        <div className="mt-2">
          <p className="text-xs text-emerald-400">{result.count} pulse questions saved.</p>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-1">
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-amber-400">{err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
