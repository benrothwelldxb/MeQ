"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { resolveCheckInRequest } from "@/app/actions/check-in";

type CheckIn = {
  id: string;
  createdAt: Date;
  freeText: string | null;
  studentName: string;
  yearGroup: string;
  className: string | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
    >
      {pending ? "Saving..." : "Mark actioned"}
    </button>
  );
}

function CheckInItem({ item }: { item: CheckIn }) {
  const [actionOpen, setActionOpen] = useState(false);
  const bound = resolveCheckInRequest.bind(null, item.id);
  const [state, formAction] = useFormState(bound, null);

  return (
    <div className="bg-white rounded-lg border border-blue-200 border-l-4 border-l-blue-500 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{item.studentName}</p>
          <p className="text-xs text-gray-500">
            {item.yearGroup}{item.className ? ` / ${item.className}` : ""} ·{" "}
            {new Date(item.createdAt).toLocaleString()}
          </p>
          {item.freeText && (
            <blockquote className="text-sm text-gray-700 bg-blue-50 rounded-lg px-3 py-2 border-l-2 border-blue-300 italic mt-2">
              &ldquo;{item.freeText}&rdquo;
            </blockquote>
          )}
        </div>
        {!actionOpen && (
          <button
            onClick={() => setActionOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
          >
            Mark actioned
          </button>
        )}
      </div>
      {actionOpen && (
        <form action={formAction} className="mt-3 space-y-2">
          <textarea
            name="notes"
            rows={2}
            placeholder="e.g. Spoke with student during break. (optional)"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
          />
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActionOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>
            <SubmitButton />
          </div>
        </form>
      )}
    </div>
  );
}

export default function CheckInPanel({ items }: { items: CheckIn[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">💬</span>
        <div>
          <h2 className="font-bold text-blue-900">
            {items.length} student{items.length === 1 ? "" : "s"} want{items.length === 1 ? "s" : ""} to check in with you
          </h2>
          <p className="text-xs text-blue-700">
            Please find a moment to speak with them, then mark each as actioned.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <CheckInItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
