"use client";

import { useState } from "react";

/**
 * Builds the PDF download URL from the current page's filter/view selection
 * and triggers a real download via a same-origin link. Replaces the previous
 * window.print() flow which depended on the user's browser print settings
 * and produced inconsistent output across devices.
 */
export default function PrintButton() {
  const [generating, setGenerating] = useState(false);

  const handleClick = () => {
    setGenerating(true);
    const params = new URLSearchParams(window.location.search);
    const url = `/api/admin/students/codes/pdf?${params.toString()}`;
    const a = document.createElement("a");
    a.href = url;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Best-effort UX — we have no way to know when the download truly
    // finishes, so re-enable after a short delay.
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={generating}
      className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-slate hover:bg-meq-slate/90 disabled:opacity-50 ml-auto"
    >
      {generating ? "Preparing PDF…" : "Download PDF"}
    </button>
  );
}
