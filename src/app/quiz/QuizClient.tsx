"use client";

import { useState, useCallback, useRef } from "react";
import ProgressBar from "@/components/ProgressBar";
import OptionCard from "@/components/OptionCard";
import EmojiOptionCard from "@/components/EmojiOptionCard";
import QuizNav from "@/components/QuizNav";
import { saveAnswer, submitQuiz } from "@/app/actions/quiz";

interface QuestionData {
  orderIndex: number;
  prompt: string;
  domain: string;
  answerOptions: { label: string; value: number; emoji?: string }[];
}

export default function QuizClient({
  questions,
  savedAnswers,
  studentName,
  startQuestion,
  tier = "standard",
}: {
  questions: QuestionData[];
  savedAnswers: Record<string, number>;
  studentName: string;
  startQuestion: number;
  tier?: string;
}) {
  const isJunior = tier === "junior";
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(startQuestion - 1, questions.length - 1)
  );
  const [selectedIndices, setSelectedIndices] = useState<Record<string, number>>(() => {
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
  const remaining = totalQuestions - answeredCount;

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

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
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
          <p className={`font-semibold text-meq-slate ${isJunior ? "text-2xl" : "text-lg"}`}>
            {isJunior ? "Nearly done..." : "Working out your results..."}
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
        <p className={`text-gray-500 mb-3 ${isJunior ? "text-lg" : "text-sm"}`}>
          {isJunior
            ? `Hi ${studentName}! You're doing great! 🌟`
            : `Hi ${studentName}! Keep going, you're doing great.`}
        </p>
        {isJunior ? (
          <div className="text-center">
            <p className="text-lg font-bold text-meq-sky">
              {remaining > 0 ? `${remaining} more to go!` : "Last one!"}
            </p>
            <div className="w-full h-4 bg-meq-mist rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-meq-sky to-blue-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.round((answeredCount / totalQuestions) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <ProgressBar current={answeredCount} total={totalQuestions} />
        )}
      </div>

      {/* Question Card */}
      <div className="flex-1 flex flex-col">
        <div className={`bg-white rounded-2xl shadow-sm border border-meq-mist flex-1 flex flex-col ${
          isJunior ? "p-6 sm:p-8" : "p-6 sm:p-8"
        }`}>
          {/* Question */}
          <div className={isJunior ? "mb-6" : "mb-8"}>
            <span className={`inline-block px-3 py-1 rounded-full bg-meq-sky-light text-meq-sky font-semibold mb-3 ${
              isJunior ? "text-sm" : "text-xs"
            }`}>
              {isJunior
                ? `${currentIndex + 1} of ${totalQuestions}`
                : `Question ${currentIndex + 1}`}
            </span>
            <h2 className={`font-bold text-meq-slate leading-relaxed ${
              isJunior ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
            }`}>
              {question.prompt}
            </h2>
          </div>

          {/* Options */}
          <div className={`flex flex-col flex-1 ${isJunior ? "gap-4" : "gap-3"}`}>
            {question.answerOptions.map((option, i) =>
              isJunior && option.emoji ? (
                <EmojiOptionCard
                  key={`${question.orderIndex}-${i}`}
                  label={option.label}
                  emoji={option.emoji}
                  selected={currentSelectedIndex === i}
                  onSelect={() => handleSelect(i, option.value)}
                />
              ) : (
                <OptionCard
                  key={`${question.orderIndex}-${i}`}
                  label={option.label}
                  selected={currentSelectedIndex === i}
                  onSelect={() => handleSelect(i, option.value)}
                  index={i}
                />
              )
            )}
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
