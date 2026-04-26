"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSchoolBankQuestion } from "@/app/actions/survey-bank";

export default function DeleteBankQuestionButton({ id, prompt }: { id: string; prompt: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (!confirm(`Remove "${prompt.slice(0, 60)}${prompt.length > 60 ? "…" : ""}" from your bank?`)) return;
    startTransition(async () => {
      const res = await deleteSchoolBankQuestion(id);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
