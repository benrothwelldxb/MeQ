"use client";

import { useFormState, useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all">
      {pending ? "Updating..." : "Update Password"}
    </button>
  );
}

export default function ChangePasswordForm({
  action,
}: {
  action: (state: { error?: string; success?: boolean } | null, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
}) {
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
        <input id="currentPassword" name="currentPassword" type="password" required className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none" />
      </div>
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
        <input id="newPassword" name="newPassword" type="password" required minLength={6} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none" />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">Password updated successfully.</p>}
      <SubmitButton />
    </form>
  );
}
