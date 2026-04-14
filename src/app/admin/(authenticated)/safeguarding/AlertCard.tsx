"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { resolveSafeguardingAlert, reopenSafeguardingAlert } from "@/app/actions/safeguarding";

type Student = {
  firstName: string;
  lastName: string;
  yearGroup: string;
  className: string | null;
};

type Alert = {
  id: string;
  type: string;
  status: string;
  flagReason: string;
  flaggedText: string | null;
  notes: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  resolverEmail: string | null;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

export default function AlertCard({
  alert,
  student,
  pulse,
  survey,
  termLabels: _termLabels,
}: {
  alert: Alert;
  student: Student | null;
  pulse: { answers: string; weekOf: Date } | null;
  survey: { title: string; anonymous: boolean; surveyId: string } | null;
  termLabels: Record<string, string>;
}) {
  const [actionOpen, setActionOpen] = useState<"resolve" | "dismiss" | null>(null);
  const bound = resolveSafeguardingAlert.bind(null, alert.id);
  const [state, formAction] = useFormState(bound, null);

  async function handleReopen() {
    if (!confirm("Reopen this alert?")) return;
    await reopenSafeguardingAlert(alert.id);
  }

  const pulseAnswers = pulse ? (JSON.parse(pulse.answers) as Record<string, number>) : null;
  const pulseLows = pulseAnswers
    ? Object.entries(pulseAnswers).filter(([, v]) => v <= 2)
    : [];

  const studentLabel = alert.type === "survey" && survey?.anonymous
    ? "Anonymous survey response"
    : student
    ? `${student.firstName} ${student.lastName} · ${student.yearGroup}${student.className ? ` / ${student.className}` : ""}`
    : "Unknown student";

  const statusPill =
    alert.status === "open"
      ? "bg-red-100 text-red-700"
      : alert.status === "resolved"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-gray-200 text-gray-700";

  return (
    <div
      className={`bg-white rounded-xl border overflow-hidden ${
        alert.status === "open" ? "border-red-200 border-l-4 border-l-red-500" : "border-gray-200"
      }`}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusPill}`}>
                {alert.status}
              </span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {alert.type === "pulse" ? "Pulse" : "Survey"}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(alert.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="font-semibold text-gray-900">{studentLabel}</p>
            {alert.type === "survey" && survey && (
              <p className="text-sm text-gray-500 mt-0.5">
                Survey:{" "}
                <Link
                  href={`/admin/surveys/${survey.surveyId}/results`}
                  className="text-meq-sky hover:underline"
                >
                  {survey.title}
                </Link>
              </p>
            )}
            {alert.type === "pulse" && pulse && (
              <p className="text-sm text-gray-500 mt-0.5">
                Week of {new Date(pulse.weekOf).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Reason */}
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-red-900 mb-1">Reason</p>
          <p className="text-sm text-red-800">{alert.flagReason}</p>
        </div>

        {/* Flagged text */}
        {alert.flaggedText && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">Flagged text</p>
            <blockquote className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border-l-2 border-gray-300 italic">
              &ldquo;{alert.flaggedText}&rdquo;
            </blockquote>
          </div>
        )}

        {/* Pulse low scores */}
        {pulseLows.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">Low-scoring domains</p>
            <ul className="text-sm text-gray-700 space-y-0.5">
              {pulseLows.map(([d, v]) => (
                <li key={d}>
                  <span className="font-medium">{d}</span>: {v} / 5
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Resolved info */}
        {alert.status !== "open" && (
          <div className="mt-3 bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">
              {alert.status === "resolved" ? "Resolved" : "Dismissed"} by{" "}
              {alert.resolverEmail ?? "unknown"}{" "}
              {alert.resolvedAt && `on ${new Date(alert.resolvedAt).toLocaleDateString()}`}
            </p>
            {alert.notes && (
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{alert.notes}</p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {alert.status === "open" && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          {!actionOpen ? (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActionOpen("resolve")}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700"
              >
                Mark as resolved
              </button>
              <button
                onClick={() => setActionOpen("dismiss")}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <form action={formAction} className="space-y-3">
              <input type="hidden" name="status" value={actionOpen === "resolve" ? "resolved" : "dismissed"} />
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {actionOpen === "resolve" ? "Action taken (optional)" : "Reason for dismissal (optional)"}
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder={
                    actionOpen === "resolve"
                      ? "e.g. Spoke to student and parent on 14 Apr."
                      : "e.g. False positive, already known context."
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
                />
              </div>
              {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActionOpen(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <SubmitButton label={actionOpen === "resolve" ? "Mark resolved" : "Dismiss alert"} />
              </div>
            </form>
          )}
        </div>
      )}

      {alert.status !== "open" && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleReopen}
            className="text-sm text-meq-sky hover:underline font-medium"
          >
            Reopen alert
          </button>
        </div>
      )}
    </div>
  );
}
