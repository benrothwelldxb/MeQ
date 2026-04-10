"use client";

import { useState } from "react";
import { exportFrameworkJson } from "@/app/actions/framework-import";

export default function ExportButton({
  frameworkId,
  frameworkName,
}: {
  frameworkId: string;
  frameworkName: string;
}) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const data = await exportFrameworkJson(frameworkId);
    setExporting(false);
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${frameworkName.toLowerCase().replace(/\s+/g, "-")}-framework.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 transition-all"
    >
      {exporting ? "Exporting..." : "Export JSON"}
    </button>
  );
}
