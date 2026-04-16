"use client";

import { useState } from "react";
import { exportStudentData } from "@/app/actions/gdpr-export";

export default function ExportDataButton({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setBusy(true);
    setError(null);
    const data = await exportStudentData(studentId);
    setBusy(false);

    if ("error" in data && data.error) {
      setError(data.error);
      return;
    }

    const filename = `meq-data-${studentName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="inline-flex flex-col items-end print:hidden">
      <button
        type="button"
        onClick={handleExport}
        disabled={busy}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50"
        title="Download all data held for this student (GDPR subject access)"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
        </svg>
        {busy ? "Exporting..." : "Export data"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
