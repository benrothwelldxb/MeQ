"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState, useTransition } from "react";
import { logIntervention, deleteInterventionLog } from "@/app/actions/intervention-log";
import { getDomainTailwind } from "@/lib/domain-colors";

type Domain = { key: string; label: string; color: string };
type LogEntry = {
  id: string;
  domainKey: string;
  level: string;
  title: string;
  notes: string | null;
  appliedAt: Date;
  appliedBy: string;
};

const LEVELS = ["Emerging", "Developing", "Secure", "Advanced"];

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50"
    >
      {pending ? "Logging..." : "Log intervention"}
    </button>
  );
}

export default function InterventionLogPanel({
  studentId,
  domains,
  logs,
}: {
  studentId: string;
  domains: Domain[];
  logs: LogEntry[];
}) {
  const [open, setOpen] = useState(false);
  const bound = logIntervention.bind(null, studentId);
  const [state, formAction] = useFormState(bound, null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Auto-close form on successful submit
  if (state?.success && open) {
    setTimeout(() => setOpen(false), 50);
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this intervention log?")) return;
    setRemovingId(id);
    startTransition(async () => {
      await deleteInterventionLog(id);
      setRemovingId(null);
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="font-bold text-gray-900">Intervention history</h2>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-meq-sky hover:bg-meq-sky/90"
          >
            Log intervention
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Record strategies you&apos;ve tried with this student. Score changes in the next assessment will show whether they helped.
      </p>

      {open && (
        <form action={formAction} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Domain</label>
              <select
                name="domainKey"
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
              >
                {domains.map((d) => (
                  <option key={d.key} value={d.key}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Level</label>
              <select
                name="level"
                required
                defaultValue="Developing"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
            <input
              name="title"
              type="text"
              required
              maxLength={200}
              placeholder="e.g. Daily emotion check-in chart"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              name="notes"
              rows={2}
              maxLength={1000}
              placeholder="Context, plan, or follow-up reminders…"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
            />
          </div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <SaveButton />
          </div>
        </form>
      )}

      {logs.length === 0 && !open ? (
        <p className="text-sm text-gray-400 italic">No interventions logged yet.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => {
            const domain = domains.find((d) => d.key === l.domainKey);
            const tw = domain ? getDomainTailwind(domain.color) : { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
            return (
              <div key={l.id} className="border-l-2 border-gray-200 pl-3 py-2 group relative">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${tw.bg} ${tw.text} ${tw.border}`}>
                    {domain?.label ?? l.domainKey}
                  </span>
                  <span className="text-xs text-gray-400">{l.level}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-400">
                    {new Date(l.appliedAt).toLocaleDateString()} · {l.appliedBy}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">{l.title}</p>
                {l.notes && <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap">{l.notes}</p>}
                <button
                  onClick={() => handleDelete(l.id)}
                  disabled={removingId === l.id}
                  className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 text-xs text-gray-400 hover:text-red-600 disabled:opacity-50 print:hidden"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
