"use client";

import { useState, useCallback, useRef } from "react";
import ProgressBar from "@/components/ProgressBar";
import OptionCard from "@/components/OptionCard";
import QuizNav from "@/components/QuizNav";
import { saveAnswer, submitQuiz } from "@/app/actions/quiz";

interface QuestionData {
  orderIndex: number;
  prompt: string;
  domain: string;
  answerOptions: { label: string; value: number }[];
}

export default function QuizClient({
  questions,
  savedAnswers,
  studentName,
  startQuestion,
}: {
  questions: QuestionData[];
  savedAnswers: Record<string, number>;
  studentName: string;
  startQuestion: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(startQuestion - 1, questions.length - 1)
  );
  // Track selected option index per question (avoids duplicate-value bug)
  const [selectedIndices, setSelectedIndices] = useState<Record<string, number>>(() => {
    // Reconstruct indices from saved answer values
    const indices: Record<string, number> = {};
    for (const q of questions) {
      const savedVal = savedAnswers[String(q.orderIndex)];
      if (savedVal !== undefined) {
        const idx = q.answerOptions.findIndex((o) => o.value === savedVal);
        if (idx !== -1) indices[String(q.orderIndex)] = idx;
      }
    }
    return indices;
  });
  const [answers, setAnswers] = useState<Record<string, number>>(savedAnswers);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const question = questions[currentIndex];
  const totalQuestions = questions.length;
  const currentAnswer = answers[String(question.orderIndex)];
  const currentSelectedIndex = selectedIndices[String(question.orderIndex)];
  const answeredCount = Object.keys(answers).length;

  const doSave = useCallback(
    async (questionNum: number, value: number) => {
      setSaving(true);
      await saveAnswer(questionNum, value);
      setSaving(false);
    },
    []
  );

  const handleSelect = (optionIndex: number, value: number) => {
    const questionNum = question.orderIndex;
    setSelectedIndices((prev) => ({ ...prev, [String(questionNum)]: optionIndex }));
    setAnswers((prev) => ({ ...prev, [String(questionNum)]: value }));

    // Debounced save
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      doSave(questionNum, value);
    }, 300);
  };

  const handleNext = async () => {
    // Save current answer immediately
    if (currentAnswer !== undefined) {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      await doSave(question.orderIndex, currentAnswer);
    }

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last question - submit
      setSubmitting(true);
      await submitQuiz();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (submitting) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-meq-sky border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold text-meq-slate">
            Working out your results...
          </p>
          <p className="text-gray-500 mt-1">This won&apos;t take long!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-3">
          Hi {studentName}! Keep going, you&apos;re doing great.
        </p>
        <ProgressBar current={answeredCount} total={totalQuestions} />
      </div>

      {/* Question Card */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-6 sm:p-8 flex-1 flex flex-col">
          {/* Question */}
          <div className="mb-8">
            <span className="inline-block px-3 py-1 rounded-full bg-meq-sky-light text-meq-sky text-xs font-semibold mb-3">
              Question {currentIndex + 1}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-meq-slate leading-relaxed">
              {question.prompt}
            </h2>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3 flex-1">
            {question.answerOptions.map((option, i) => (
              <OptionCard
                key={`${question.orderIndex}-${i}`}
                label={option.label}
                selected={currentSelectedIndex === i}
                onSelect={() => handleSelect(i, option.value)}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <QuizNav
          onBack={handleBack}
          onNext={handleNext}
          canGoBack={currentIndex > 0}
          isLast={currentIndex === totalQuestions - 1}
          hasAnswer={currentAnswer !== undefined}
          saving={saving}
        />
      </div>
    </div>
  );
}
