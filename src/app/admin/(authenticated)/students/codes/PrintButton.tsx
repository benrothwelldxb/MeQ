"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-slate hover:bg-meq-slate/90 ml-auto"
    >
      Print
    </button>
  );
}
