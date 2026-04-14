"use client";

import { useState, useTransition } from "react";
import { seedDefaultStaffInterventions, uploadStaffInterventions } from "@/app/actions/staff-interventions";

export default function StaffInterventionsManager({ hasAny }: { hasAny: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSeed() {
    setMessage(null);
    startTransition(async () => {
      const result = await seedDefaultStaffInterventions();
      if (result?.error) setMessage(`Error: ${result.error}`);
      else setMessage(`Seeded ${result?.created} interventions (${result?.skipped} already existed).`);
    });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setMessage(null);
    startTransition(async () => {
      const result = await uploadStaffInterventions(text);
      if (result?.error) {
        setMessage(`Error: ${result.error}`);
      } else {
        const errs = result?.errors?.length ? ` (${result.errors.length} rows skipped)` : "";
        setMessage(`Uploaded ${result?.count} interventions${errs}.`);
      }
    });
    e.target.value = "";
  }

  return (
    <div className="border-t border-gray-700 pt-4 mt-6">
      <div className="flex flex-wrap items-center gap-3">
        {!hasAny && (
          <button
            type="button"
            onClick={handleSeed}
            disabled={isPending}
            className="px-3 py-2 rounded-lg text-xs font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50"
          >
            {isPending ? "Seeding..." : "Seed default staff interventions"}
          </button>
        )}
        <label className="px-3 py-2 rounded-lg text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 cursor-pointer">
          Upload CSV
          <input type="file" accept=".csv" onChange={handleUpload} disabled={isPending} className="hidden" />
        </label>
        <span className="text-xs text-gray-500">CSV columns: domain, level, title, description</span>
      </div>
      {message && <p className="text-xs text-gray-300 mt-2">{message}</p>}
    </div>
  );
}
