"use client";

import { useState, useEffect, useRef, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  updateSurvey,
  addSurveyQuestion,
  updateSurveyQuestion,
  deleteSurveyQuestion,
  reorderSurveyQuestion,
  addBankQuestionToSurvey,
  activateSurvey,
  closeSurvey,
  deleteSurvey,
} from "@/app/actions/surveys";
import { saveQuestionToSchoolBank } from "@/app/actions/survey-bank";
import type { BankQuestionView } from "@/app/actions/survey-bank";
import { QUESTION_TYPE_LABELS, QUESTION_TYPE_OPTIONS } from "@/lib/surveys";

interface SurveyData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  anonymous: boolean;
  allowRetake: boolean;
  targetType: string;
  targetIds: string[];
  openAt: Date | null;
  closeAt: Date | null;
}

interface QuestionData {
  id: string;
  orderIndex: number;
  prompt: string;
  questionType: string;
  options: string[] | null;
  required: boolean;
}

interface YearGroupOption {
  id: string;
  name: string;
  classes: Array<{ id: string; name: string }>;
}

type Tab = "settings" | "questions" | "assign";
type SaveState = "idle" | "saving" | "saved" | "error";

export default function SurveyBuilder({
  survey,
  questions: initialQuestions,
  bankQuestions,
  yearGroups,
}: {
  survey: SurveyData;
  questions: QuestionData[];
  bankQuestions: BankQuestionView[];
  yearGroups: YearGroupOption[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("questions");
  const [questions, setQuestions] = useState(initialQuestions);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Re-sync local questions when the server payload changes (after refresh).
  useEffect(() => setQuestions(initialQuestions), [initialQuestions]);

  const isDraft = survey.status === "draft";
  const isActive = survey.status === "active";

  const markSaving = () => setSaveState("saving");
  const markSaved = () => {
    setSaveState("saved");
    setSavedAt(new Date());
  };
  const markError = () => setSaveState("error");

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

  return (
    <div className="space-y-4">
      {/* Status + actions header */}
      <div className={`rounded-xl p-4 border flex items-center justify-between gap-4 flex-wrap ${
        isActive ? "bg-emerald-50 border-emerald-200" : survey.status === "closed" ? "bg-slate-50 border-slate-200" : "bg-gray-50 border-gray-200"
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              isActive ? "bg-emerald-100 text-emerald-700" : survey.status === "closed" ? "bg-slate-200 text-slate-700" : "bg-gray-200 text-gray-700"
            }`}>{survey.status}</span>
            <SaveIndicator state={saveState} savedAt={savedAt} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isDraft && "Not yet live — add questions, then activate when ready."}
            {isActive && "Live — students can complete this survey."}
            {survey.status === "closed" && "No longer accepting responses."}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/admin/preview/survey/${survey.id}`}
            target="_blank"
            className="px-4 py-2 rounded-lg text-sm font-medium text-meq-sky bg-white border border-meq-sky hover:bg-meq-sky hover:text-white transition-all"
          >
            Preview
          </Link>
          {isDraft && (
            <button
              onClick={handleActivate}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Activate
            </button>
          )}
          {isActive && (
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-slate-600 hover:bg-slate-700"
            >
              Close
            </button>
          )}
          <button
            onClick={handleDeleteSurvey}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tab strip */}
      <div className="border-b border-gray-200 flex gap-1">
        {(["settings", "questions", "assign"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-meq-sky text-meq-sky"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "settings" && "Settings"}
            {t === "questions" && `Questions (${questions.length})`}
            {t === "assign" && "Assign"}
          </button>
        ))}
      </div>

      {tab === "settings" && (
        <SettingsTab survey={survey} isDraft={isDraft} markSaving={markSaving} markSaved={markSaved} markError={markError} />
      )}

      {tab === "questions" && (
        <QuestionsTab
          surveyId={survey.id}
          questions={questions}
          bankQuestions={bankQuestions}
          isDraft={isDraft}
          onChange={(next) => setQuestions(next)}
          markSaving={markSaving}
          markSaved={markSaved}
          markError={markError}
        />
      )}

      {tab === "assign" && (
        <AssignTab survey={survey} yearGroups={yearGroups} isDraft={isDraft} markSaving={markSaving} markSaved={markSaved} markError={markError} />
      )}
    </div>
  );
}

// ============================================================================
// Save indicator
// ============================================================================

function SaveIndicator({ state, savedAt }: { state: SaveState; savedAt: Date | null }) {
  if (state === "saving") return <span className="text-xs text-gray-500">Saving…</span>;
  if (state === "error") return <span className="text-xs text-red-600">Save failed</span>;
  if (state === "saved" && savedAt) {
    const secs = Math.max(0, Math.floor((Date.now() - savedAt.getTime()) / 1000));
    return <span className="text-xs text-emerald-600">Saved {secs < 5 ? "just now" : `${secs}s ago`}</span>;
  }
  return null;
}

// ============================================================================
// Settings tab
// ============================================================================

function SettingsTab({
  survey,
  isDraft,
  markSaving,
  markSaved,
  markError,
}: {
  survey: SurveyData;
  isDraft: boolean;
  markSaving: () => void;
  markSaved: () => void;
  markError: () => void;
}) {
  const { queue: queueSave } = useDebouncedFieldSave<Parameters<typeof updateSurvey>[1]>(
    async (data) => {
      markSaving();
      const res = await updateSurvey(survey.id, data);
      if ("error" in res && res.error) markError();
      else markSaved();
    }
  );

  const checkboxSave = (data: Parameters<typeof updateSurvey>[1]) => {
    markSaving();
    updateSurvey(survey.id, data).then((res) => {
      if (res && "error" in res && res.error) markError();
      else markSaved();
    }).catch(markError);
  };

  const [title, setTitle] = useState(survey.title);
  const [description, setDescription] = useState(survey.description || "");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            queueSave({ title: e.target.value });
          }}
          disabled={!isDraft}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none disabled:bg-gray-50"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            queueSave({ description: e.target.value });
          }}
          disabled={!isDraft}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none disabled:bg-gray-50"
        />
      </div>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          defaultChecked={survey.anonymous}
          onChange={(e) => checkboxSave({ anonymous: e.target.checked })}
          disabled={!isDraft}
          className="w-4 h-4 mt-0.5 rounded border-gray-300 text-meq-sky focus:ring-meq-sky"
        />
        <span className="text-sm text-gray-700">
          <span className="font-medium">Anonymous responses</span>
          <span className="text-gray-500 block text-xs">Student identities will not be recorded. Use for sensitive topics.</span>
        </span>
      </label>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          defaultChecked={survey.allowRetake}
          onChange={(e) => checkboxSave({ allowRetake: e.target.checked })}
          className="w-4 h-4 mt-0.5 rounded border-gray-300 text-meq-sky focus:ring-meq-sky"
        />
        <span className="text-sm text-gray-700">
          <span className="font-medium">Allow retakes</span>
          <span className="text-gray-500 block text-xs">Students can submit responses multiple times.</span>
        </span>
      </label>
    </div>
  );
}

// ============================================================================
// Questions tab — bank picker + draft list
// ============================================================================

function QuestionsTab({
  surveyId,
  questions,
  bankQuestions,
  isDraft,
  onChange,
  markSaving,
  markSaved,
  markError,
}: {
  surveyId: string;
  questions: QuestionData[];
  bankQuestions: BankQuestionView[];
  isDraft: boolean;
  onChange: (next: QuestionData[]) => void;
  markSaving: () => void;
  markSaved: () => void;
  markError: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const refreshAll = () => {
    startTransition(() => router.refresh());
  };

  const addFromBank = async (bq: BankQuestionView) => {
    markSaving();
    const res = await addBankQuestionToSurvey(surveyId, bq.id);
    if ("error" in res && res.error) markError();
    else markSaved();
    refreshAll();
  };

  const addCustom = async (data: { prompt: string; questionType: string; options?: string[] }) => {
    markSaving();
    const res = await addSurveyQuestion(surveyId, data);
    if ("error" in res && res.error) markError();
    else markSaved();
    refreshAll();
  };

  const removeQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    markSaving();
    const res = await deleteSurveyQuestion(id, surveyId);
    if ("error" in res && res.error) markError();
    else markSaved();
    onChange(questions.filter((q) => q.id !== id));
  };

  const moveQuestion = async (id: string, direction: "up" | "down") => {
    markSaving();
    const res = await reorderSurveyQuestion(id, direction);
    if ("error" in res && res.error) markError();
    else markSaved();
    refreshAll();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <BankPicker
        bankQuestions={bankQuestions}
        isDraft={isDraft}
        onPick={addFromBank}
        onAddCustom={addCustom}
        pending={pending}
      />
      <DraftQuestions
        questions={questions}
        isDraft={isDraft}
        onRemove={removeQuestion}
        onMove={moveQuestion}
        markSaving={markSaving}
        markSaved={markSaved}
        markError={markError}
      />
    </div>
  );
}

// ============================================================================
// Bank picker (left pane)
// ============================================================================

function BankPicker({
  bankQuestions,
  isDraft,
  onPick,
  onAddCustom,
  pending,
}: {
  bankQuestions: BankQuestionView[];
  isDraft: boolean;
  onPick: (bq: BankQuestionView) => void;
  onAddCustom: (data: { prompt: string; questionType: string; options?: string[] }) => void;
  pending: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAge, setFilterAge] = useState<"" | "junior" | "standard">("");
  const [showCustom, setShowCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customType, setCustomType] = useState<string>("likert_5");
  const [customOptions, setCustomOptions] = useState("");

  const categories = useMemo(() => {
    return Array.from(new Set(bankQuestions.map((b) => b.category))).sort();
  }, [bankQuestions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bankQuestions.filter((b) => {
      if (filterCategory && b.category !== filterCategory) return false;
      if (filterAge && !b.ageTags.includes(filterAge)) return false;
      if (!q) return true;
      return b.prompt.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
    });
  }, [bankQuestions, search, filterCategory, filterAge]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col max-h-[80vh]">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 mb-1">Question library</h3>
        <p className="text-xs text-gray-500">Click + to add to your survey, or write a custom question.</p>
      </div>

      <div className="p-4 border-b border-gray-100 space-y-2">
        <input
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:border-meq-sky focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterAge}
            onChange={(e) => setFilterAge(e.target.value as "" | "junior" | "standard")}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:border-meq-sky focus:outline-none"
          >
            <option value="">All ages</option>
            <option value="junior">Junior (5-7)</option>
            <option value="standard">Standard (8-11)</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-gray-400 text-center">No matching questions.</p>
        ) : (
          filtered.map((bq) => (
            <div key={bq.id} className="p-3 flex items-start gap-2 hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 leading-snug">{bq.prompt}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-meq-sky-light text-meq-sky">
                    {bq.category}{bq.subcategory ? ` · ${bq.subcategory}` : ""}
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                    {QUESTION_TYPE_LABELS[bq.questionType] ?? bq.questionType}
                  </span>
                  {bq.source && (
                    <span className="text-[10px] text-gray-400">{bq.source}</span>
                  )}
                  {bq.isSchoolCustom && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Yours</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onPick(bq)}
                disabled={!isDraft || pending}
                className="w-7 h-7 rounded-full bg-meq-sky text-white flex items-center justify-center text-lg font-bold hover:bg-meq-sky/90 disabled:opacity-30 flex-shrink-0"
                title="Add to survey"
              >
                +
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50">
        {!showCustom ? (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            disabled={!isDraft}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium text-meq-sky border border-meq-sky bg-white hover:bg-meq-sky hover:text-white disabled:opacity-50 transition-all"
          >
            + Add custom question
          </button>
        ) : (
          <div className="space-y-2">
            <input
              placeholder="Question prompt..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
            />
            <select
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:border-meq-sky focus:outline-none"
            >
              {QUESTION_TYPE_OPTIONS.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
            {customType === "multiple_choice" && (
              <textarea
                placeholder="Options (one per line)"
                value={customOptions}
                onChange={(e) => setCustomOptions(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
              />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowCustom(false); setCustomPrompt(""); setCustomOptions(""); }}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!customPrompt.trim()) return;
                  const opts = customType === "multiple_choice"
                    ? customOptions.split("\n").map((s) => s.trim()).filter(Boolean)
                    : undefined;
                  onAddCustom({ prompt: customPrompt.trim(), questionType: customType, options: opts });
                  setShowCustom(false);
                  setCustomPrompt(""); setCustomOptions("");
                }}
                disabled={!customPrompt.trim() || pending}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Draft questions (right pane)
// ============================================================================

function DraftQuestions({
  questions,
  isDraft,
  onRemove,
  onMove,
  markSaving,
  markSaved,
  markError,
}: {
  questions: QuestionData[];
  isDraft: boolean;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  markSaving: () => void;
  markSaved: () => void;
  markError: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-bold text-gray-900 mb-3">Survey questions ({questions.length})</h3>

      {questions.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">Pick a question from the library, or write your own.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <DraftQuestionRow
              key={q.id}
              question={q}
              isDraft={isDraft}
              isFirst={i === 0}
              isLast={i === questions.length - 1}
              onRemove={() => onRemove(q.id)}
              onMoveUp={() => onMove(q.id, "up")}
              onMoveDown={() => onMove(q.id, "down")}
              markSaving={markSaving}
              markSaved={markSaved}
              markError={markError}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DraftQuestionRow({
  question,
  isDraft,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
  markSaving,
  markSaved,
  markError,
}: {
  question: QuestionData;
  isDraft: boolean;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  markSaving: () => void;
  markSaved: () => void;
  markError: () => void;
}) {
  const [prompt, setPrompt] = useState(question.prompt);
  const [questionType, setQuestionType] = useState(question.questionType);
  const [optionsText, setOptionsText] = useState(question.options?.join("\n") ?? "");
  const [required, setRequired] = useState(question.required);

  // Mirror optionsText into a ref so handleTypeChange always reads the latest
  // value, not a stale closure capture from when the dropdown was rendered.
  const optionsTextRef = useRef(optionsText);
  useEffect(() => { optionsTextRef.current = optionsText; }, [optionsText]);

  const { queue: queueSave } = useDebouncedFieldSave<Parameters<typeof updateSurveyQuestion>[1]>(
    async (data) => {
      markSaving();
      const res = await updateSurveyQuestion(question.id, data);
      if ("error" in res && res.error) markError();
      else markSaved();
    }
  );

  const parseOptions = (text: string) =>
    text.split("\n").map((s) => s.trim()).filter(Boolean);

  const handleTypeChange = (newType: string) => {
    if (newType === questionType) return;
    setQuestionType(newType);
    queueSave({
      questionType: newType,
      options: newType === "multiple_choice"
        ? parseOptions(optionsTextRef.current)
        : null,
    });
  };

  const handleOptionsBlur = () => {
    if (questionType !== "multiple_choice") return;
    queueSave({ options: parseOptions(optionsText) });
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <span className="text-xs font-mono text-gray-400 mt-2 w-6 text-center">{question.orderIndex}</span>
        <div className="flex-1 min-w-0 space-y-2">
          <input
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              queueSave({ prompt: e.target.value });
            }}
            disabled={!isDraft}
            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-meq-sky focus:outline-none disabled:bg-gray-100"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={questionType}
              onChange={(e) => handleTypeChange(e.target.value)}
              disabled={!isDraft}
              className="px-2 py-1 rounded-md border border-gray-200 text-xs bg-white focus:border-meq-sky focus:outline-none disabled:bg-gray-100"
            >
              {QUESTION_TYPE_OPTIONS.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => {
                  setRequired(e.target.checked);
                  queueSave({ required: e.target.checked });
                }}
                disabled={!isDraft}
                className="w-3.5 h-3.5 rounded border-gray-300 text-meq-sky focus:ring-meq-sky"
              />
              required
            </label>
          </div>
          {questionType === "multiple_choice" && (
            <textarea
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              onBlur={handleOptionsBlur}
              placeholder="Options (one per line)"
              rows={3}
              disabled={!isDraft}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-meq-sky focus:outline-none disabled:bg-gray-100"
            />
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          {isDraft && (
            <>
              <button
                type="button"
                onClick={onMoveUp}
                disabled={isFirst}
                className="w-6 h-6 rounded text-gray-400 hover:text-meq-sky hover:bg-meq-sky-light disabled:opacity-20 disabled:hover:bg-transparent text-sm"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={isLast}
                className="w-6 h-6 rounded text-gray-400 hover:text-meq-sky hover:bg-meq-sky-light disabled:opacity-20 disabled:hover:bg-transparent text-sm"
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="w-6 h-6 rounded text-red-400 hover:text-red-600 hover:bg-red-50 text-sm"
                title="Remove"
              >
                ×
              </button>
              <SaveToBankButton question={{
                prompt,
                questionType,
                options: questionType === "multiple_choice"
                  ? (optionsText.split("\n").map((s) => s.trim()).filter(Boolean))
                  : null,
              }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveToBankButton({ question }: { question: { prompt: string; questionType: string; options: string[] | null } }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const category = prompt("Save to your school's bank under which category?", "Custom") ?? "";
    if (!category.trim()) { setSaving(false); return; }
    const res = await saveQuestionToSchoolBank({
      prompt: question.prompt,
      questionType: question.questionType,
      options: question.options,
      category: category.trim(),
    });
    setSaving(false);
    if ("error" in res && res.error) setError(res.error);
    else setSaved(true);
  };

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={saving || saved}
      title={saved ? "Saved to your bank" : error ? error : "Save to your school's bank"}
      className={`w-6 h-6 rounded text-sm ${
        saved ? "text-emerald-500" : "text-gray-300 hover:text-meq-sky hover:bg-meq-sky-light"
      }`}
    >
      {saved ? "✓" : "★"}
    </button>
  );
}

// ============================================================================
// Assign tab
// ============================================================================

function AssignTab({
  survey,
  yearGroups,
  isDraft,
  markSaving,
  markSaved,
  markError,
}: {
  survey: SurveyData;
  yearGroups: YearGroupOption[];
  isDraft: boolean;
  markSaving: () => void;
  markSaved: () => void;
  markError: () => void;
}) {
  const [targetType, setTargetType] = useState(survey.targetType);
  const [targetIds, setTargetIds] = useState<Set<string>>(new Set(survey.targetIds));

  const allClasses = useMemo(
    () => yearGroups.flatMap((yg) => yg.classes.map((c) => ({ id: c.id, name: c.name, yg: yg.name }))),
    [yearGroups]
  );

  const persist = (data: Parameters<typeof updateSurvey>[1]) => {
    markSaving();
    updateSurvey(survey.id, data)
      .then((res) => {
        if (res && "error" in res && res.error) markError();
        else markSaved();
      })
      .catch(markError);
  };

  const persistTargets = (type: string, ids: string[]) =>
    persist({ targetType: type, targetIds: ids });

  const persistDate = (field: "openAt" | "closeAt", value: string) =>
    persist({ [field]: value ? new Date(value) : null });

  const toggleId = (id: string) => {
    const next = new Set(targetIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setTargetIds(next);
    persistTargets(targetType, Array.from(next));
  };

  const handleTypeChange = (newType: string) => {
    setTargetType(newType);
    setTargetIds(new Set());
    persistTargets(newType, []);
  };

  const dateValue = (d: Date | null) =>
    d ? new Date(d).toISOString().slice(0, 16) : "";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h3 className="font-bold text-gray-900 mb-1">Who can take this survey?</h3>
          <p className="text-xs text-gray-500 mb-3">Choose how to target — whole school, specific year groups, or specific classes.</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "school", label: "Whole school" },
              { key: "year_group", label: "Specific year groups" },
              { key: "class", label: "Specific classes" },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleTypeChange(opt.key)}
                disabled={!isDraft}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  targetType === opt.key
                    ? "bg-meq-sky text-white border-meq-sky"
                    : "bg-white text-gray-700 border-gray-300 hover:border-meq-sky"
                } disabled:opacity-50`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {targetType === "year_group" && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Select year groups</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {yearGroups.map((yg) => (
                <label key={yg.id} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetIds.has(yg.id)}
                    onChange={() => toggleId(yg.id)}
                    disabled={!isDraft}
                    className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky"
                  />
                  <span className="text-sm text-gray-900">{yg.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {yg.classes.length} class{yg.classes.length === 1 ? "" : "es"}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {targetType === "class" && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Select classes</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {allClasses.map((c) => (
                <label key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetIds.has(c.id)}
                    onChange={() => toggleId(c.id)}
                    disabled={!isDraft}
                    className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky"
                  />
                  <span className="text-sm text-gray-900">{c.yg} — {c.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h3 className="font-bold text-gray-900 mb-1">Schedule</h3>
          <p className="text-xs text-gray-500 mb-3">Optional — leave blank to control activation manually.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opens at</label>
            <input
              type="datetime-local"
              defaultValue={dateValue(survey.openAt)}
              onChange={(e) => persistDate("openAt", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Closes at</label>
            <input
              type="datetime-local"
              defaultValue={dateValue(survey.closeAt)}
              onChange={(e) => persistDate("closeAt", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Field-level autosave for a single record. Calls to `queue(updates)` merge
 * into a pending payload; after `delay` ms of quiet, the merged payload is
 * sent in a single save call. This avoids the previous race where rapid
 * edits to different fields each set their own timer and the last to fire
 * silently dropped earlier fields' updates.
 *
 * Also flushes any pending changes on unmount (e.g. when switching tabs in
 * the survey builder) so we don't lose in-flight edits.
 */
function useDebouncedFieldSave<T extends Record<string, unknown>>(
  save: (data: Partial<T>) => Promise<unknown>,
  delay = 800
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Partial<T>>({});
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; }, [save]);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const payload = pendingRef.current;
    if (Object.keys(payload).length === 0) return;
    pendingRef.current = {};
    return saveRef.current(payload);
  }, []);

  const queue = useCallback((updates: Partial<T>) => {
    pendingRef.current = { ...pendingRef.current, ...updates };
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(flush, delay);
  }, [delay, flush]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        const payload = pendingRef.current;
        if (Object.keys(payload).length > 0) {
          // Component unmounting (tab switch / navigation). Fire the pending
          // save without awaiting — we're going away.
          saveRef.current(payload).catch(() => {});
          pendingRef.current = {};
        }
      }
    };
  }, []);

  return { queue, flush };
}
