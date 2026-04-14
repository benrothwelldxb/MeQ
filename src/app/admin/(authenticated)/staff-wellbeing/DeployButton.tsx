"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { deployStaffWellbeing } from "@/app/actions/staff-wellbeing-deploy";

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50"
    >
      {pending ? "Sending..." : "Send to all staff"}
    </button>
  );
}

export default function DeployButton({ totalStaff }: { totalStaff: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(deployStaffWellbeing, null);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={totalStaff === 0}
        className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Notify Staff
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
              <h3 className="font-bold text-gray-900">Notify staff about wellbeing check-in</h3>
              <p className="text-sm text-gray-500 mt-1">
                Sends an email to all {totalStaff} staff with a link to start the assessment.
              </p>
            </div>

            <form action={formAction} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal message (optional)
                </label>
                <textarea
                  name="message"
                  rows={3}
                  placeholder="e.g. Please complete this by Friday — really appreciate your time."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Appears as a quote in the email.</p>
              </div>

              {state?.success && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                  <p className="text-sm text-emerald-700">
                    Sent to {state.sent} staff{state.failed ? ` (${state.failed} failed — check logs)` : ""}.
                  </p>
                </div>
              )}
              {state?.error && (
                <p className="text-sm text-red-600">{state.error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
                >
                  {state?.success ? "Close" : "Cancel"}
                </button>
                {!state?.success && <SendButton />}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
