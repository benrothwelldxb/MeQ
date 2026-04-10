"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitSurveyResponse } from "@/app/actions/surveys";

interface Survey {
  id: string;
  title: string;
  description: string | null;
  anonymous: boolean;
}

interface Question {
  id: string;
  orderIndex: number;
  prompt: string;
  questionType: string;
  options: string[] | null;
  required: boolean;
}

const LIKERT_OPTIONS = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neither agree nor disagree" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
];

export default function SurveyClient({
  survey,
  questions,
  studentName,
}: {
  survey: Survey;
  questions: Question[];
  studentName: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAnswer = (questionId: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    // Validate required questions
    const missingRequired = questions.filter((q) => q.required && (answers[q.id] === undefined || answers[q.id] === ""));
    if (missingRequired.length > 0) {
      setError(`Please answer question ${missingRequired[0].orderIndex}: ${missingRequired[0].prompt}`);
      return;
    }

    setSubmitting(true);
    setError(null);
    const res = await submitSurveyResponse(survey.id, answers);
    if (res.error) {
      setError(res.error);
      setSubmitting(false);
      return;
    }
    router.push(`/survey/${survey.id}/done`);
  };

  return (
    <main className="min-h-screen bg-meq-cloud py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-meq-slate mb-2">{survey.title}</h1>
          {survey.description && (
            <p className="text-gray-500">{survey.description}</p>
          )}
          <p className="text-sm text-gray-400 mt-3">Hi {studentName}, thanks for taking part.</p>
        </div>

        {survey.anonymous && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6">
            <p className="text-sm text-blue-900 text-center">
              <strong>This is an anonymous survey.</strong> Your name will not be saved with your answers.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-meq-mist p-6">
              <p className="font-bold text-meq-slate mb-4">
                {q.orderIndex}. {q.prompt}
                {q.required && <span className="text-red-500 ml-1">*</span>}
              </p>

              {q.questionType === "likert_5" && (
                <div className="space-y-2">
                  {LIKERT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAnswer(q.id, opt.value)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        answers[q.id] === opt.value
                          ? "border-meq-sky bg-meq-sky-light"
                          : "border-meq-mist hover:border-meq-sky/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {q.questionType === "yes_no" && (
                <div className="grid grid-cols-2 gap-3">
                  {[{ val: "yes", label: "Yes" }, { val: "no", label: "No" }].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setAnswer(q.id, opt.val)}
                      className={`py-3 rounded-xl border-2 transition-all font-medium ${
                        answers[q.id] === opt.val
                          ? "border-meq-sky bg-meq-sky-light"
                          : "border-meq-mist hover:border-meq-sky/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {q.questionType === "rating_10" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Not at all</span>
                    <span className="text-xs text-gray-500">Very much</span>
                  </div>
                  <div className="grid grid-cols-10 gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => setAnswer(q.id, n)}
                        className={`py-2 rounded-lg border-2 text-sm font-bold transition-all ${
                          answers[q.id] === n
                            ? "border-meq-sky bg-meq-sky text-white"
                            : "border-meq-mist text-gray-700 hover:border-meq-sky/50"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {q.questionType === "multiple_choice" && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswer(q.id, opt)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        answers[q.id] === opt
                          ? "border-meq-sky bg-meq-sky-light"
                          : "border-meq-mist hover:border-meq-sky/50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.questionType === "free_text" && (
                <textarea
                  value={(answers[q.id] as string) || ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Type your answer here..."
                  className="w-full px-3 py-2 rounded-xl border-2 border-meq-mist focus:border-meq-sky focus:outline-none resize-none"
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full mt-6 py-4 rounded-xl text-lg font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
        >
          {submitting ? "Submitting..." : "Submit Survey"}
        </button>
      </div>
    </main>
  );
}
