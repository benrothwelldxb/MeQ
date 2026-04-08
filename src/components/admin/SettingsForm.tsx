"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
    >
      {pending ? "Saving..." : "Save Settings"}
    </button>
  );
}

export default function SettingsForm({
  action,
  children,
}: {
  action: (formData: FormData) => void;
  children: React.ReactNode;
}) {
  const [saved, setSaved] = useState(false);

  const handleAction = async (formData: FormData) => {
    await action(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form action={handleAction} className="space-y-4">
      {children}
      <div className="flex items-center gap-3">
        <SaveButton />
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium animate-in">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Settings saved
          </span>
        )}
      </div>
    </form>
  );
}
