"use client";

import { useState } from "react";
import {
  updateFrameworkConfig,
  addFrameworkQuestion,
  deleteFrameworkQuestion,
  updateFrameworkDomain,
  addFrameworkDomain,
  deleteFrameworkDomain,
} from "@/app/actions/frameworks";

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
}: {
  framework: { id: string; name: string; config: string; isDefault: boolean };
  domains: Domain[];
  questions: Question[];
}) {
  const [tab, setTab] = useState<"domains" | "questions" | "scoring">("domains");
  const [selectedTier, setSelectedTier] = useState("standard");
  const config: FrameworkConfig = JSON.parse(framework.config || "{}");

  const tabs = [
    { key: "domains", label: "Domains" },
    { key: "questions", label: "Questions" },
    { key: "scoring", label: "Scoring & Messages" },
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

          <div className="space-y-2 mb-4">
            {tierQuestions.length === 0 && (
              <p className="text-gray-500 text-sm py-8 text-center">No questions for this tier yet.</p>
            )}
            {tierQuestions.map((q) => {
              const domain = domains.find((d) => d.key === q.domainKey);
              return (
                <div key={q.id} className="bg-gray-800 rounded-lg border border-gray-700 px-4 py-3 flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-mono w-8">Q{q.orderIndex}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${COLOR_CLASSES[domain?.color || "blue"]}`}>
                    {domain?.label || q.domainKey}
                  </span>
                  <span className="text-sm text-gray-300 flex-1">{q.prompt}</span>
                  <span className="text-xs text-gray-500">{q.type} &middot; w{q.weight}</span>
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
            <AddQuestionForm
              frameworkId={framework.id}
              domains={domains}
              tier={selectedTier}
            />
          )}
        </div>
      )}

      {/* Scoring Tab */}
      {tab === "scoring" && (
        <ScoringConfig
          frameworkId={framework.id}
          config={config}
          domains={domains}
        />
      )}
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
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!prompt.trim() || !domainKey) return;
    setAdding(true);
    await addFrameworkQuestion(frameworkId, {
      domainKey,
      tier,
      prompt: prompt.trim(),
      questionFormat: "self-report",
      answerOptions: DEFAULT_ANSWER_OPTIONS,
      scoreMap: DEFAULT_SCORE_MAP,
      weight: 1.0,
      type,
    });
    setPrompt("");
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
      <p className="text-xs text-gray-500 mt-2">Uses default 4-point Likert scale. Questions can be customised later.</p>
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
