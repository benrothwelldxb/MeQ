"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateSurvey,
  addSurveyQuestion,
  deleteSurveyQuestion,
  activateSurvey,
  closeSurvey,
  deleteSurvey,
} from "@/app/actions/surveys";
import { QUESTION_TYPE_LABELS } from "@/lib/surveys";

interface SurveyData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  anonymous: boolean;
  allowRetake: boolean;
}

interface QuestionData {
  id: string;
  orderIndex: number;
  prompt: string;
  questionType: string;
  options: string | null;
  required: boolean;
}

const QUESTION_TYPES = [
  { key: "likert_5", label: "Agreement (5-point)" },
  { key: "multiple_choice", label: "Multiple choice" },
  { key: "yes_no", label: "Yes / No" },
  { key: "rating_10", label: "Rating (1-10)" },
  { key: "free_text", label: "Free text" },
];

export default function SurveyEditor({
  survey,
  questions: initialQuestions,
}: {
  survey: SurveyData;
  questions: QuestionData[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(survey.title);
  const [description, setDescription] = useState(survey.description || "");
  const [anonymous, setAnonymous] = useState(survey.anonymous);
  const [allowRetake, setAllowRetake] = useState(survey.allowRetake);
  const [questions, setQuestions] = useState(initialQuestions);

  const [newPrompt, setNewPrompt] = useState("");
  const [newType, setNewType] = useState("likert_5");
  const [newOptions, setNewOptions] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveSettings = async () => {
    setSaving(true);
    await updateSurvey(survey.id, { title, description, anonymous, allowRetake });
    setSaving(false);
  };

  const handleAddQuestion = async () => {
    if (!newPrompt.trim()) return;
    setAdding(true);
    const options = newType === "multiple_choice"
      ? newOptions.split("\n").map((o) => o.trim()).filter(Boolean)
      : undefined;
    await addSurveyQuestion(survey.id, {
      prompt: newPrompt.trim(),
      questionType: newType,
      options,
    });
    setNewPrompt("");
    setNewOptions("");
    setAdding(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await deleteSurveyQuestion(id, survey.id);
    setQuestions((q) => q.filter((x) => x.id !== id));
  };

  const handleActivate = async () => {
    if (questions.length === 0) {
      alert("Add at least one question before activating.");
      return;
    }
    if (!confirm("Activate this survey? Students will be able to complete it.")) return;
    await activateSurvey(survey.id);
    router.refresh();
  };

  const handleClose = async () => {
    if (!confirm("Close this survey? No further responses will be accepted.")) return;
    await closeSurvey(survey.id);
    router.refresh();
  };

  const handleDeleteSurvey = async () => {
    if (!confirm("Delete this survey permanently? All responses will be lost.")) return;
    await deleteSurvey(survey.id);
    router.push("/admin/surveys");
  };

  const isDraft = survey.status === "draft";
  const isActive = survey.status === "active";

  return (
    <div className="max-w-3xl space-y-6">
      {/* Status + actions */}
      <div className={`rounded-xl p-4 border flex items-center justify-between ${
        isActive ? "bg-emerald-50 border-emerald-200" : survey.status === "closed" ? "bg-slate-50 border-slate-200" : "bg-gray-50 border-gray-200"
      }`}>
        <div>
          <p className="text-sm font-medium capitalize">{survey.status}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isDraft && "Not yet live — add questions and activate when ready"}
            {isActive && "Live — students can complete this survey"}
            {survey.status === "closed" && "No longer accepting responses"}
          </p>
        </div>
        <div className="flex gap-2">
          {isDraft && (
            <button
              onClick={handleActivate}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
            >
              Activate
            </button>
          )}
          {isActive && (
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-slate-600 hover:bg-slate-700 transition-all"
            >
              Close
            </button>
          )}
          <button
            onClick={handleDeleteSurvey}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-all"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isDraft}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isDraft}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none disabled:bg-gray-50"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="anonymous"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              disabled={!isDraft}
              className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky"
            />
            <label htmlFor="anonymous" className="text-sm text-gray-700">
              <span className="font-medium">Anonymous responses</span>
              <span className="text-gray-500 block text-xs">Student identities will not be recorded. Use for sensitive topics.</span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allowRetake"
              checked={allowRetake}
              onChange={(e) => setAllowRetake(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky"
            />
            <label htmlFor="allowRetake" className="text-sm text-gray-700">
              <span className="font-medium">Allow retakes</span>
              <span className="text-gray-500 block text-xs">Students can submit responses multiple times. If off, only one per student.</span>
            </label>
          </div>
          {isDraft && (
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Questions ({questions.length})</h2>

        <div className="space-y-2 mb-4">
          {questions.length === 0 && (
            <p className="text-sm text-gray-500 py-6 text-center">No questions yet. Add your first question below.</p>
          )}
          {questions.map((q) => (
            <div key={q.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xs font-mono text-gray-400 mt-1">{q.orderIndex}</span>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{q.prompt}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {QUESTION_TYPE_LABELS[q.questionType] || q.questionType}
                  {q.required && " · required"}
                </p>
                {q.options && (
                  <p className="text-xs text-gray-400 mt-1">
                    Options: {(JSON.parse(q.options) as string[]).join(" · ")}
                  </p>
                )}
              </div>
              {isDraft && (
                <button
                  onClick={() => handleDelete(q.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>

        {isDraft && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add Question</h3>
            <div className="space-y-3">
              <input
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Question prompt..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
              {newType === "multiple_choice" && (
                <textarea
                  value={newOptions}
                  onChange={(e) => setNewOptions(e.target.value)}
                  placeholder="Options (one per line)"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none text-sm"
                />
              )}
              <button
                onClick={handleAddQuestion}
                disabled={adding || !newPrompt.trim()}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
              >
                {adding ? "Adding..." : "Add Question"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
