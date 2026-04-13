"use client";

import { useState, useTransition } from "react";
import { assignFrameworkToSchool } from "@/app/actions/school-manage";

export default function FrameworkAssigner({
  schoolId,
  currentFrameworkId,
  frameworks,
}: {
  schoolId: string;
  currentFrameworkId: string | null;
  frameworks: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState(currentFrameworkId ?? "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
