"use client";

import { useState, useTransition } from "react";
import { assignFrameworkToSchool } from "@/app/actions/school-manage";

export default function FrameworkAssigner({
  schoolId,
  currentFrameworkId,
  frameworks,
  locked,
  completedCount,
  academicYear,
}: {
  schoolId: string;
  currentFrameworkId: string | null;
  frameworks: { id: string; name: string }[];
  locked: boolean;
  completedCount: number;
  academicYear: string;
}) {
  const [selected, setSelected] = useState(currentFrameworkId ?? "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const currentFramework = frameworks.find((f) => f.id === currentFrameworkId);

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await assignFrameworkToSchool(schoolId, selected || null);
      if (result?.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Framework updated." });
      }
    });
  }

  if (locked) {
    return (
      <div>
        <div className="bg-gray-700/50 rounded-lg px-4 py-3 mb-3">
          <p className="text-sm text-white font-medium">
            {currentFramework?.name ?? "No framework assigned"}
          </p>
        </div>
        <div className="flex items-start gap-2 bg-amber-900/30 border border-amber-800 rounded-lg px-4 py-3">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm text-amber-200 font-medium">Framework locked</p>
            <p className="text-xs text-amber-200/80 mt-1">
              {completedCount} {completedCount === 1 ? "assessment has" : "assessments have"} been completed this academic year ({academicYear}).
              Changing the framework mid-cycle would invalidate existing scores and make term-over-term comparisons impossible.
              The framework can be changed at the start of a new academic year.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="flex-1 px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
      >
        <option value="">No framework</option>
        {frameworks.map((fw) => (
          <option key={fw.id} value={fw.id}>
            {fw.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={isPending || selected === (currentFrameworkId ?? "")}
        className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
      >
        {isPending ? "Saving..." : "Save"}
      </button>
      {message && (
        <span className={`text-sm ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}
