"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addSuperAdmin, removeSuperAdmin } from "@/app/actions/super-admin-manage";
import { useState, useTransition } from "react";

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
    >
      {pending ? "Adding..." : "Add"}
    </button>
  );
}

export default function SuperAdminManager({
  admins,
  currentId,
}: {
  admins: { id: string; email: string; createdAt: Date }[];
  currentId: string;
}) {
  const [state, formAction] = useFormState(addSuperAdmin, null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRemove(id: string) {
    if (!confirm("Remove this super admin?")) return;
    setRemoveError(null);
    setRemovingId(id);
    startTransition(async () => {
      const result = await removeSuperAdmin(id);
      if (result?.error) setRemoveError(result.error);
      setRemovingId(null);
    });
  }

  return (
    <div className="space-y-4">
      {/* Existing admins */}
      <div className="space-y-2">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="flex items-center justify-between bg-gray-700/50 rounded-lg px-4 py-3"
          >
            <div>
              <span className="text-sm text-white">{admin.email}</span>
              {admin.id === currentId && (
                <span className="ml-2 text-xs text-gray-500">(you)</span>
              )}
            </div>
            {admin.id !== currentId && (
              <button
                onClick={() => handleRemove(admin.id)}
                disabled={isPending && removingId === admin.id}
                className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                {removingId === admin.id ? "Removing..." : "Remove"}
              </button>
            )}
          </div>
        ))}
      </div>

      {removeError && (
        <p className="text-sm text-red-400">{removeError}</p>
      )}

      {/* Add form */}
      <form action={formAction} className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="Email address"
          className="flex-1 px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
        />
        <input
          name="password"
          type="password"
          placeholder="Password (optional)"
          className="w-40 px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
        />
        <AddButton />
      </form>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-400">Super admin added.</p>}
    </div>
  );
}
