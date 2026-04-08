"use client";

import { useState } from "react";

export default function ReliabilityBadge({
  score,
  detail,
}: {
  score: string;
  detail?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const colors =
    score === "High"
      ? "bg-emerald-100 text-emerald-700"
      : score === "Medium"
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";

  return (
    <div className="inline-block">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors} hover:opacity-80 transition-opacity`}
        title="Click for details"
      >
        {score} reliability
      </button>
      {expanded && detail && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 max-w-xs">
          {detail}
        </div>
      )}
    </div>
  );
}
