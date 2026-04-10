"use client";

import { useState } from "react";
import { saveStaffPulseAnswer, submitStaffPulse } from "@/app/actions/staff-wellbeing";

const EMOJI_SCALE = [
  { value: 1, emoji: "😟", label: "Not really" },
  { value: 2, emoji: "🫤", label: "A little" },
  { value: 3, emoji: "😐", label: "Sometimes" },
  { value: 4, emoji: "🙂", label: "Mostly" },
  { value: 5, emoji: "😊", label: "Definitely" },
];

interface PulseQuestion {
  domain: string;
  prompt: string;
  emoji?: string;
}

export default function StaffPulseClient({
  questions,
  teacherName,
}: {
  questions: PulseQuestion[];
  teacherName: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [freeText, setFreeText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const question = questions[currentIndex];
  const currentAnswer = answers[question?.domain];

  const handleSelect = async (value: number) => {
    const domain = question.domain;
    setAnswers((prev) => ({ ...prev, [domain]: value }));
    await saveStaffPulseAnswer(domain, value);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }, 400);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await submitStaffPulse(freeText.trim() || undefined);
  };

  const isComplete = Object.keys(answers).length === questions.length;

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-meq-slate mb-1">Weekly Pulse</h1>
        <p className="text-sm text-gray-500">
          Hi {teacherName}, how are you doing this week?
        </p>
      </div>

      {/* Privacy note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6">
        <p className="text-xs text-blue-700">
          Your responses are private. Only aggregated staff data (min. 5 responses) is shared with leadership.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-6">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < currentIndex
                ? "bg-meq-sky"
                : i === currentIndex
                ? "bg-meq-sky scale-125"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-6 mb-4">
        {question.emoji && (
          <div className="text-center mb-3">
            <span className="text-5xl">{question.emoji}</span>
          </div>
        )}
        <h2 className="font-bold text-meq-slate text-center mb-6 text-xl">
          {question.prompt}
        </h2>

        <div className="flex justify-between gap-2">
          {EMOJI_SCALE.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
                currentAnswer === option.value
                  ? "bg-meq-sky-light border-2 border-meq-sky scale-105"
                  : "border-2 border-transparent hover:bg-gray-50"
              }`}
            >
              <span className="text-3xl">{option.emoji}</span>
              <span className="text-[10px] text-gray-500">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Free text + submit */}
      {isComplete && (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-5 mb-4">
            <label className="block text-sm font-medium text-meq-slate mb-2">
              Anything else you&apos;d like to add? (optional)
            </label>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Share any thoughts..."
              className="w-full px-3 py-2 rounded-lg border border-meq-mist focus:border-meq-sky focus:outline-none text-sm resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{freeText.length}/500</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 rounded-xl text-lg font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
          >
            {submitting ? "Saving..." : "Done!"}
          </button>
        </>
      )}

      <p className="text-center text-xs text-gray-400 mt-4">
        {currentIndex + 1} of {questions.length}
      </p>
    </div>
  );
}
