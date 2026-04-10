"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SURVEY_TEMPLATES } from "@/lib/surveys";
import { createSurveyFromTemplate, createBlankSurvey } from "@/app/actions/surveys";

export default function NewSurveyPage() {
  const router = useRouter();
  const [creating, setCreating] = useState<string | null>(null);
  const [blankTitle, setBlankTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleTemplate = async (key: string) => {
    setCreating(key);
    setError(null);
    const res = await createSurveyFromTemplate(key);
    if ("error" in res && res.error) {
      setError(res.error);
      setCreating(null);
      return;
    }
    if (res.surveyId) {
      router.push(`/admin/surveys/${res.surveyId}`);
    }
  };

  const handleBlank = async () => {
    if (!blankTitle.trim()) {
      setError("Title is required");
      return;
    }
    setCreating("blank");
    setError(null);
    const res = await createBlankSurvey(blankTitle);
    if ("error" in res && res.error) {
      setError(res.error);
      setCreating(null);
      return;
    }
    if (res.surveyId) {
      router.push(`/admin/surveys/${res.surveyId}`);
    }
  };

  // Group templates by category
  const byCategory: Record<string, typeof SURVEY_TEMPLATES> = {};
  for (const t of SURVEY_TEMPLATES) {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  }

  return (
    <div className="max-w-4xl">
      <Link href="/admin/surveys" className="text-sm text-meq-sky hover:underline">&larr; Back to Surveys</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Create Survey</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Blank survey */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="font-bold text-gray-900 mb-1">Start from scratch</h2>
        <p className="text-sm text-gray-500 mb-4">Build your own survey from a blank template.</p>
        <div className="flex gap-3">
          <input
            value={blankTitle}
            onChange={(e) => setBlankTitle(e.target.value)}
            placeholder="Survey title (e.g. End of Term Feedback)"
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none"
            disabled={creating !== null}
          />
          <button
            onClick={handleBlank}
            disabled={creating !== null || !blankTitle.trim()}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
          >
            {creating === "blank" ? "Creating..." : "Create Blank"}
          </button>
        </div>
      </div>

      {/* Templates */}
      <div>
        <h2 className="font-bold text-gray-900 mb-1">Start from a template</h2>
        <p className="text-sm text-gray-500 mb-4">Pre-built surveys you can clone and customise.</p>

        {Object.entries(byCategory).map(([category, templates]) => (
          <div key={category} className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{category}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {templates.map((t) => (
                <div key={t.key} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-meq-sky transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 text-sm">{t.title}</h4>
                    {t.anonymous && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Anonymous</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{t.description}</p>
                  <p className="text-[10px] text-gray-400 mb-3">{t.questions.length} questions</p>
                  <button
                    onClick={() => handleTemplate(t.key)}
                    disabled={creating !== null}
                    className="w-full px-3 py-2 rounded-lg text-xs font-bold text-meq-sky bg-meq-sky-light hover:bg-meq-sky hover:text-white disabled:opacity-50 transition-all"
                  >
                    {creating === t.key ? "Creating..." : "Use Template"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
