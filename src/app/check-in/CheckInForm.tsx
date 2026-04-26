"use client";

import { useState, useTransition } from "react";
import { createCheckInRequest } from "@/app/actions/check-in";
import { useRouter } from "next/navigation";

interface TeacherOption {
  id: string;
  name: string;
  isClassTeacher: boolean;
}

export default function CheckInForm({
  teachers,
  defaultTeacherId,
  isJunior,
  studentName,
  variant = "page",
}: {
  teachers: TeacherOption[];
  defaultTeacherId: string | null;
  isJunior: boolean;
  studentName: string;
  variant?: "page" | "embedded";
}) {
  const router = useRouter();
  const [targetTeacherId, setTargetTeacherId] = useState<string>(defaultTeacherId ?? "");
  const [freeText, setFreeText] = useState("");
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const res = await createCheckInRequest({
        targetTeacherId: targetTeacherId || null,
        freeText: freeText.trim() || null,
      });
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setSubmitted(true);
      if (variant === "page") {
        setTimeout(() => router.push("/check-in/done"), 1200);
      }
    });
  };

  const headingSize = isJunior ? "text-2xl" : "text-xl";
  const bodySize = isJunior ? "text-base" : "text-sm";

  if (submitted) {
    return (
      <div className={`bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center ${variant === "embedded" ? "mt-4" : ""}`}>
        <div className="text-5xl mb-2">✅</div>
        <h3 className={`font-bold text-emerald-900 mb-1 ${headingSize}`}>
          {isJunior ? "We've told your teacher!" : "Your request has been sent"}
        </h3>
        <p className={`text-emerald-700 ${bodySize}`}>
          {isJunior
            ? "They will come and talk to you soon."
            : "Your teacher will be in touch soon."}
        </p>
      </div>
    );
  }

  return (
    <div className={variant === "embedded" ? "bg-white rounded-2xl shadow-sm border border-meq-mist p-5 mb-4" : "bg-white rounded-2xl shadow-sm border border-meq-mist p-6 sm:p-8"}>
      {variant === "page" && (
        <>
          <h2 className={`font-bold text-meq-slate mb-2 ${headingSize}`}>
            {isJunior ? `Hi ${studentName}!` : `Hi ${studentName}`}
          </h2>
          <p className={`text-gray-600 mb-5 ${bodySize}`}>
            {isJunior
              ? "Would you like to talk with a grown-up at school? Pick someone and we'll tell them."
              : "Let us know if you'd like to talk with someone at school — we'll pass the message on."}
          </p>
        </>
      )}

      {variant === "embedded" && (
        <h3 className={`font-bold text-meq-slate mb-3 ${isJunior ? "text-lg" : "text-base"}`}>
          {isJunior ? "Would you like to talk with someone?" : "Check in with someone"}
        </h3>
      )}

      <label className={`block font-medium text-meq-slate mb-1 ${bodySize}`}>
        {isJunior ? "Who would you like to talk to?" : "Who would you like to check in with?"}
      </label>
      <select
        value={targetTeacherId}
        onChange={(e) => setTargetTeacherId(e.target.value)}
        className="w-full px-3 py-2 mb-4 rounded-lg border border-meq-mist focus:border-meq-sky focus:outline-none text-sm bg-white"
      >
        {teachers.length === 0 && <option value="">No teachers available</option>}
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}{t.isClassTeacher ? " (your teacher)" : ""}
          </option>
        ))}
      </select>

      <label className={`block font-medium text-meq-slate mb-1 ${bodySize}`}>
        {isJunior ? "Do you want to tell them anything first? (you don't have to)" : "Anything you'd like them to know first? (optional)"}
      </label>
      <textarea
        value={freeText}
        onChange={(e) => setFreeText(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder={isJunior ? "Type here..." : "Share a short note..."}
        className="w-full px-3 py-2 rounded-lg border border-meq-mist focus:border-meq-sky focus:outline-none text-sm resize-none mb-4"
      />

      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending || teachers.length === 0}
        className="w-full py-3 rounded-xl text-base font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
      >
        {pending ? "Sending..." : isJunior ? "Send my message" : "Request check-in"}
      </button>
    </div>
  );
}
