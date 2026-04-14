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
      {pending ? "Sending..." : "Send invite"}
    </button>
  );
}

export default function DeployButton({
  totalStaff,
  notifiedCount,
}: {
  totalStaff: number;
  notifiedCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [onlyUnnotified, setOnlyUnnotified] = useState(notifiedCount > 0);
  const [state, formAction] = useFormState(deployStaffWellbeing, null);

  const remaining = Math.max(totalStaff - notifiedCount, 0);
  const willSendTo = onlyUnnotified ? remaining : totalStaff;

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
        {notifiedCount > 0 && (
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-white/20">
            {notifiedCount}/{totalStaff} notified
          </span>
        )}
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
                {notifiedCount > 0
                  ? `${notifiedCount} of ${totalStaff} staff have been notified this term.`
                  : `No staff have been notified yet this term.`}
              </p>
            </div>

            <form action={formAction} className="px-6 py-4 space-y-4">
              {notifiedCount > 0 && remaining > 0 && (
                <label className="flex items-start gap-3 cursor-pointer bg-gray-50 rounded-lg p-3">
                  <input
                    type="checkbox"
                    name="onlyUnnotified"
                    checked={onlyUnnotified}
                    onChange={(e) => setOnlyUnnotified(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Only send to staff not yet notified</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Sends to {remaining} of {totalStaff} staff. Uncheck to re-send to everyone.
                    </p>
                  </div>
                </label>
              )}

              {notifiedCount > 0 && remaining === 0 && !onlyUnnotified && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                  All {totalStaff} staff have been notified already. Sending again will resend to everyone.
                </div>
              )}
              {notifiedCount > 0 && remaining === 0 && onlyUnnotified && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800">
                  All staff have already been notified this term. Uncheck the box above to re-send anyway.
                </div>
              )}

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
                    Sent to {state.sent} of {state.targetCount} staff
                    {state.failed ? ` (${state.failed} failed — check logs)` : ""}.
                  </p>
                </div>
              )}
              {state?.error && (
                <p className="text-sm text-red-600">{state.error}</p>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-gray-500">
                  Will send to {willSendTo} {willSendTo === 1 ? "person" : "people"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
                  >
                    {state?.success ? "Close" : "Cancel"}
                  </button>
                  {!state?.success && willSendTo > 0 && <SendButton />}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
