"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { resolveCheckInRequest } from "@/app/actions/check-in";

type CheckIn = {
  id: string;
  status: string;
  freeText: string | null;
  notes: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedByType: string | null;
  resolverLabel: string | null;
};

type Student = {
  firstName: string;
  lastName: string;
  yearGroup: string;
  className: string | null;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

export default function CheckInCard({
  checkIn,
  student,
  targetTeacherName,
}: {
  checkIn: CheckIn;
  student: Student | null;
  targetTeacherName: string | null;
}) {
  const [actionOpen, setActionOpen] = useState(false);
  const bound = resolveCheckInRequest.bind(null, checkIn.id);
  const [state, formAction] = useFormState(bound, null);

  const studentLabel = student
    ? `${student.firstName} ${student.lastName} · ${student.yearGroup}${student.className ? ` / ${student.className}` : ""}`
    : "Unknown student";

  const statusPill =
    checkIn.status === "open"
      ? "bg-blue-100 text-blue-700"
      : "bg-emerald-100 text-emerald-700";

  return (
    <div
      className={`bg-white rounded-xl border overflow-hidden ${
        checkIn.status === "open" ? "border-blue-200 border-l-4 border-l-blue-500" : "border-gray-200"
      }`}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusPill}`}>
                {checkIn.status}
              </span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check-in
              </span>
              <span className="text-xs text-gray-400">
                {new Date(checkIn.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="font-semibold text-gray-900">{studentLabel}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Asked to talk with{" "}
              <span className="font-medium text-gray-700">{targetTeacherName ?? "(unassigned)"}</span>
            </p>
          </div>
        </div>

        {checkIn.freeText && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">Note from student</p>
            <blockquote className="text-sm text-gray-700 bg-blue-50 rounded-lg px-3 py-2 border-l-2 border-blue-300 italic">
              &ldquo;{checkIn.freeText}&rdquo;
            </blockquote>
          </div>
        )}

        {checkIn.status === "resolved" && (
          <div className="mt-3 bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">
              Resolved by {checkIn.resolverLabel ?? "unknown"}
              {checkIn.resolvedByType && ` (${checkIn.resolvedByType})`}{" "}
              {checkIn.resolvedAt && `on ${new Date(checkIn.resolvedAt).toLocaleDateString()}`}
            </p>
            {checkIn.notes && (
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{checkIn.notes}</p>
            )}
          </div>
        )}
      </div>

      {checkIn.status === "open" && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          {!actionOpen ? (
            <button
              onClick={() => setActionOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Mark as actioned
            </button>
          ) : (
            <form action={formAction} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  What happened? (optional)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="e.g. Spoke with student during break, offered support."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
                />
              </div>
              {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActionOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <SubmitButton label="Mark actioned" />
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
