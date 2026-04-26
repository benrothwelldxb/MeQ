"use client";

import { useState } from "react";
import { savePulseAnswer, submitPulse } from "@/app/actions/pulse";
import Image from "next/image";
import PlayAudioButton from "@/components/PlayAudioButton";
import CheckInForm from "@/app/check-in/CheckInForm";

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
  audioUrl?: string;
}

interface TeacherOption {
  id: string;
  name: string;
  isClassTeacher: boolean;
}

export default function PulseClient({
  questions,
  studentName,
  isJunior,
  readAloudEnabled,
  teachers,
  defaultTeacherId,
}: {
  questions: PulseQuestion[];
  studentName: string;
  isJunior: boolean;
  readAloudEnabled: boolean;
  teachers: TeacherOption[];
  defaultTeacherId: string | null;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [freeText, setFreeText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);

  const question = questions[currentIndex];
  const currentAnswer = answers[question?.domain];

  const handleSelect = async (value: number) => {
    const domain = question.domain;
    setAnswers((prev) => ({ ...prev, [domain]: value }));
    await savePulseAnswer(domain, value);

    // Auto-advance after short delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }, 400);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await submitPulse(freeText.trim() || undefined);
  };

  const isComplete = Object.keys(answers).length === questions.length;
  const canCheckIn = teachers.length > 0;

  return (
    <main className="min-h-screen bg-meq-cloud flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Image src="/meq-logo.png" alt="MeQ" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-meq-slate text-lg">Pulse</span>
          </div>
          <p className={`text-gray-500 ${isJunior ? "text-lg" : "text-sm"}`}>
            {isJunior
              ? `Hi ${studentName}! How are you feeling today?`
              : `Quick check-in, ${studentName}`}
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
        <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-6 sm:p-8 mb-4">
          {question.emoji && (
            <div className="text-center mb-3">
              <span className={isJunior ? "text-6xl" : "text-5xl"}>{question.emoji}</span>
            </div>
          )}
          <h2 className={`font-bold text-meq-slate text-center mb-4 ${
            isJunior ? "text-2xl" : "text-xl"
          }`}>
            {question.prompt}
          </h2>

          {question.audioUrl && (
            <div className="flex justify-center mb-5">
              <PlayAudioButton
                key={question.domain}
                src={question.audioUrl}
                autoPlay={readAloudEnabled}
              />
            </div>
          )}

          {/* Emoji scale */}
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
                <span className={isJunior ? "text-4xl" : "text-3xl"}>{option.emoji}</span>
                <span className={`text-gray-500 ${isJunior ? "text-xs" : "text-[10px]"}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Free text + Submit */}
        {isComplete && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-5 mb-4">
              <label className={`block font-medium text-meq-slate mb-2 ${isJunior ? "text-base" : "text-sm"}`}>
                {isJunior ? "Anything else you want to tell us? (optional)" : "Anything else you'd like to add? (optional)"}
              </label>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={isJunior ? "Type here..." : "Share any thoughts..."}
                className="w-full px-3 py-2 rounded-lg border border-meq-mist focus:border-meq-sky focus:outline-none text-sm resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{freeText.length}/500</p>
            </div>

            {canCheckIn && !showCheckIn && (
              <button
                type="button"
                onClick={() => setShowCheckIn(true)}
                className="w-full py-3 mb-4 rounded-xl text-sm font-semibold text-meq-sky bg-white border border-meq-sky hover:bg-meq-sky-light transition-all"
              >
                {isJunior ? "💬 I want to talk to a grown-up" : "💬 Check in with someone"}
              </button>
            )}

            {canCheckIn && showCheckIn && (
              <CheckInForm
                teachers={teachers}
                defaultTeacherId={defaultTeacherId}
                isJunior={isJunior}
                studentName={studentName}
                variant="embedded"
              />
            )}

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
    </main>
  );
}
