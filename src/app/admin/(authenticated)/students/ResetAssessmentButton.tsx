"use client";

import { resetAssessment } from "@/app/actions/students";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetAssessmentButton({
  assessmentId,
  studentName,
  term,
}: {
  assessmentId: string;
  studentName: string;
  term: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const termLabel = term.replace("term", "Term ");

  const handleReset = async () => {
    await resetAssessment(assessmentId);
    router.refresh();
    setConfirming(false);
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Reset {studentName}&apos;s {termLabel}?</span>
        <button onClick={handleReset} className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded hover:bg-amber-100">Yes</button>
        <button onClick={() => setConfirming(false)} className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100">No</button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-xs text-gray-400 hover:text-amber-600 transition-colors">
      Reset
    </button>
  );
}
