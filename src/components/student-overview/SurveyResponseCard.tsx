"use client";

import { useState } from "react";

type Question = {
  id: string;
  prompt: string;
  questionType: string;
  options: string[] | null;
};

type SurveyResponseData = {
  id: string;
  surveyTitle: string;
  surveyDescription: string | null;
  answers: Record<string, string | number>;
  questions: Question[];
  flagged: boolean;
  flagReason: string | null;
  completedAt: Date;
};

export default function SurveyResponseCard({ response }: { response: SurveyResponseData }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`bg-white rounded-xl border ${
        response.flagged ? "border-red-300 border-l-4 border-l-red-500" : "border-gray-200"
      } overflow-hidden`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="text-left">
          <h3 className="font-bold text-gray-900">{response.surveyTitle}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(response.completedAt).toLocaleDateString()} · {response.questions.length} questions
            {response.flagged && (
              <span className="ml-2 text-red-600 font-medium">· Flagged</span>
            )}
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {response.flagged && response.flagReason && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700">
              <strong>Moderation:</strong> {response.flagReason}
            </div>
          )}
          <div className="mt-4 space-y-4">
            {response.questions.map((q, i) => {
              const answer = response.answers[q.id];
              return (
                <div key={q.id}>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {i + 1}. {q.prompt}
                  </p>
                  {renderAnswer(q, answer)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function renderAnswer(question: Question, answer: string | number | undefined) {
  if (answer === undefined || answer === null || answer === "") {
    return <p className="text-sm text-gray-400 italic">No answer</p>;
  }

  if (question.questionType === "likert" || question.questionType === "scale") {
    const numeric = typeof answer === "number" ? answer : parseInt(answer as string, 10);
    const scale = question.options?.length ?? 5;
    const percentage = (numeric / scale) * 100;
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-meq-sky"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 w-12 text-right">
          {numeric}/{scale}
        </span>
      </div>
    );
  }

  if (question.questionType === "text" || question.questionType === "long_text") {
    return (
      <blockquote className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border-l-2 border-gray-300">
        {answer}
      </blockquote>
    );
  }

  return <p className="text-sm text-gray-700">{answer}</p>;
}
