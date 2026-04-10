"use client";

import { useState, useCallback, useRef } from "react";
import { saveStaffAnswer, submitStaffAssessment } from "@/app/actions/staff-wellbeing";

interface QuestionData {
  orderIndex: number;
  prompt: string;
  domain: string;
  answerOptions: { label: string; value: number }[];
}

export default function StaffAssessmentClient({
  assessmentId,
  questions,
  savedAnswers,
  teacherName,
}: {
  assessmentId: string;
  questions: QuestionData[];
  savedAnswers: Record<string, number>;
  teacherName: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>(savedAnswers);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const question = questions[currentIndex];
  const currentAnswer = answers[String(question?.orderIndex)];
  const answeredCount = Object.keys(answers).length;

  const doSave = useCallback(
    async (questionNum: number, value: number) => {
      setSaving(true);
      await saveStaffAnswer(assessmentId, questionNum, value);
      setSaving(false);
    },
    [assessmentId]
  );

  const handleSelect = (value: number) => {
    const questionNum = question.orderIndex;
    setAnswers((prev) => ({ ...prev, [String(questionNum)]: value }));

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      doSave(questionNum, value);
    }, 300);
  };

  const handleNext = async () => {
    if (currentAnswer !== undefined) {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      await doSave(question.orderIndex, currentAnswer);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSubmitting(true);
      await submitStaffAssessment(assessmentId);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  if (submitting) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-meq-sky border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-semibold text-meq-slate text-lg">Saving your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-3">
          Hi {teacherName} — this is a private check-in. Only you will see your individual answers.
        </p>
        <div className="w-full h-2 bg-gray-100 rounded-full">
          <div
            className="h-full bg-meq-sky rounded-full transition-all"
            style={{ width: `${Math.round((answeredCount / questions.length) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {answeredCount} of {questions.length} answered
        </p>
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-6 sm:p-8 flex-1">
        <div className="mb-6">
          <span className="inline-block px-3 py-1 rounded-full bg-meq-sky-light text-meq-sky font-semibold mb-3 text-xs">
            Question {currentIndex + 1}
          </span>
          <h2 className="font-bold text-meq-slate text-xl sm:text-2xl leading-relaxed">
            {question.prompt}
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {question.answerOptions.map((option, i) => (
            <button
              key={i}
              onClick={() => handleSelect(option.value)}
              className={`text-left px-4 py-4 rounded-xl border-2 transition-all min-h-touch ${
                currentAnswer === option.value
                  ? "border-meq-sky bg-meq-sky-light"
                  : "border-meq-mist hover:border-meq-sky/50"
              }`}
            >
              <span className="text-meq-slate">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="px-5 py-3 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={currentAnswer === undefined || saving}
          className="flex-1 py-3 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {currentIndex === questions.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
