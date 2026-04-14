"use client";

import { useState, useTransition } from "react";
import { nudgeStaffWellbeing } from "@/app/actions/staff-wellbeing-deploy";

export default function NudgeButton({
  incompleteCount,
  lastNudgedAt,
}: {
  incompleteCount: number;
  lastNudgedAt: Date | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [open, setOpen] = useState(false);

  function handleSend() {
    setMessage(null);
    startTransition(async () => {
      const result = await nudgeStaffWellbeing();
      if (result?.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({
          type: "success",
          text: `Nudged ${result.sent} ${result.sent === 1 ? "person" : "people"}${result.failed ? ` (${result.failed} failed)` : ""}.`,
        });
      }
    });
  }

  function formatRelative(date: Date): string {
    const ms = Date.now() - new Date(date).getTime();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours < 1) return "less than an hour ago";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={incompleteCount === 0}
        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        title={incompleteCount === 0 ? "Everyone has completed" : "Send a reminder to staff who haven't completed yet"}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Nudge {incompleteCount > 0 ? `(${incompleteCount})` : ""}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Send nudge to incomplete staff</h3>
              <p className="text-sm text-gray-500 mt-1">
                Sends a gentle reminder email to the <strong>{incompleteCount}</strong> staff {incompleteCount === 1 ? "member" : "members"} who haven&apos;t completed this term&apos;s check-in yet.
              </p>
            </div>

            <div className="px-6 py-4 space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-800">
                <p className="font-medium mb-1">Privacy preserved</p>
                <p>
                  You won&apos;t see who receives the nudge — the email goes only to staff who haven&apos;t completed the assessment. Recipients aren&apos;t recorded individually.
                </p>
              </div>

              {lastNudgedAt && (
                <p className="text-xs text-gray-500">
                  Last nudge sent {formatRelative(lastNudgedAt)}. Nudges are limited to one per 24 hours.
                </p>
              )}

              {message && (
                <p className={`text-sm ${message.type === "success" ? "text-emerald-700" : "text-red-600"}`}>
                  {message.text}
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
              >
                {message?.type === "success" ? "Close" : "Cancel"}
              </button>
              {message?.type !== "success" && (
                <button
                  onClick={handleSend}
                  disabled={isPending || incompleteCount === 0}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50"
                >
                  {isPending ? "Sending..." : "Send nudge"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
