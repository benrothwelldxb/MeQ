"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useTransition, useState } from "react";
import { addCustomKeyword, removeCustomKeyword } from "@/app/actions/safeguarding";

type Keyword = { id: string; keyword: string; addedAt: Date };

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50"
    >
      {pending ? "Adding..." : "Add"}
    </button>
  );
}

export default function CustomKeywordManager({
  keywords,
  isDsl,
}: {
  keywords: Keyword[];
  isDsl: boolean;
}) {
  const [state, formAction] = useFormState(addCustomKeyword, null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleRemove(id: string, kw: string) {
    if (!confirm(`Remove custom keyword "${kw}"?`)) return;
    setRemoveError(null);
    setRemovingId(id);
    startTransition(async () => {
      const result = await removeCustomKeyword(id);
      if (result?.error) setRemoveError(result.error);
      setRemovingId(null);
    });
  }

  return (
    <div className="border border-purple-200 bg-purple-50/40 rounded-lg p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <p className="font-semibold text-sm text-purple-900">Custom keywords for your school</p>
        <span className="text-xs text-purple-700">{keywords.length} added</span>
      </div>
      <p className="text-xs text-purple-800 mb-3">
        Added by your DSLs — these supplement the platform default list above for your school only.
        Custom keywords apply to future responses; existing responses are not re-scanned.
      </p>

      {keywords.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {keywords.map((kw) => (
            <span
              key={kw.id}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 font-mono border border-purple-200"
            >
              {kw.keyword}
              {isDsl && (
                <button
                  type="button"
                  onClick={() => handleRemove(kw.id, kw.keyword)}
                  disabled={removingId === kw.id}
                  className="ml-1 text-purple-600 hover:text-red-600 disabled:opacity-50"
                  title="Remove custom keyword"
                  aria-label={`Remove ${kw.keyword}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-purple-700 italic mb-3">No custom keywords yet.</p>
      )}

      {removeError && <p className="text-xs text-red-600 mb-2">{removeError}</p>}

      {isDsl ? (
        <form action={formAction} className="flex gap-2">
          <input
            name="keyword"
            type="text"
            required
            minLength={3}
            maxLength={100}
            placeholder="e.g. being hurt"
            className="flex-1 px-3 py-2 rounded-lg border border-purple-200 text-sm focus:border-meq-sky focus:outline-none bg-white"
          />
          <AddButton />
        </form>
      ) : (
        <p className="text-xs text-gray-500 italic">Only DSLs can add or remove custom keywords.</p>
      )}
      {state?.error && <p className="text-xs text-red-600 mt-2">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-700 mt-2">Custom keyword added.</p>}
    </div>
  );
}
