"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { rolloverAcademicYear } from "@/app/actions/academic-year";
import { nextAcademicYear } from "@/lib/academic-year";

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
    >
      {pending ? "Rolling over..." : "Confirm rollover"}
    </button>
  );
}

export default function AcademicYearRollover({
  schoolName,
  currentYear,
  completedThisYear,
}: {
  schoolName: string;
  currentYear: string;
  completedThisYear: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(rolloverAcademicYear, null);
  const suggested = nextAcademicYear(currentYear);
  const expectedConfirmation = `ROLL OVER ${schoolName.toUpperCase()}`;

  if (state?.success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-sm text-emerald-800">
          Rolled over to <strong>{state.newYear}</strong>. Term reset to Term 1.
          Old assessments are preserved and visible in trend charts.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Currently in <strong>{currentYear}</strong> with {completedThisYear} completed assessment
          {completedThisYear === 1 ? "" : "s"}.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
        >
          Start rollover to {suggested}
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
        <p className="font-semibold mb-1">Heads up</p>
        <ul className="list-disc pl-4 space-y-1 text-amber-800 text-xs">
          <li>The school&apos;s academic year will move from <strong>{currentYear}</strong> to a new value.</li>
          <li>Current term resets to <strong>Term 1</strong>.</li>
          <li>All historic assessments stay in place — they remain visible in trends and on student profiles.</li>
          <li>The framework can be changed again, since old assessments are no longer in &quot;this academic year&quot;.</li>
        </ul>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New academic year</label>
        <input
          type="text"
          name="academicYear"
          defaultValue={suggested}
          required
          pattern="\d{4}-\d{4}"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
        />
        <p className="text-xs text-gray-400 mt-1">Format: YYYY-YYYY (e.g. 2026-2027)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{expectedConfirmation}</code> to confirm
        </label>
        <input
          type="text"
          name="confirmation"
          required
          autoComplete="off"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none font-mono"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
        >
          Cancel
        </button>
        <ConfirmButton />
      </div>
    </form>
  );
}
