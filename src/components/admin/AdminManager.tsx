"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState, useTransition } from "react";
import { addSchoolAdmin, removeSchoolAdmin, resendAdminWelcome } from "@/app/actions/admin-manage";

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
    >
      {pending ? "Adding..." : "Add Admin"}
    </button>
  );
}

export default function AdminManager({
  admins,
  currentAdminId,
  authMode,
}: {
  admins: { id: string; email: string; createdAt: Date }[];
  currentAdminId: string;
  authMode: string;
}) {
  const [state, formAction] = useFormState(addSchoolAdmin, null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowMessage, setRowMessage] = useState<{ id: string; type: "success" | "error"; text: string } | null>(null);
  const [, startTransition] = useTransition();

  function handleRemove(id: string, email: string) {
    if (!confirm(`Remove ${email}?`)) return;
    setRowMessage(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await removeSchoolAdmin(id);
      if (result?.error) setRowMessage({ id, type: "error", text: result.error });
      setBusyId(null);
    });
  }

  function handleResend(id: string) {
    setRowMessage(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await resendAdminWelcome(id);
      if (result?.error) setRowMessage({ id, type: "error", text: result.error });
      else setRowMessage({ id, type: "success", text: "Email sent" });
      setBusyId(null);
      setTimeout(() => setRowMessage(null), 4000);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {admins.map((admin) => (
          <div key={admin.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
            <div>
              <span className="text-sm font-medium text-gray-900">{admin.email}</span>
              {admin.id === currentAdminId && (
                <span className="ml-2 text-xs text-gray-400">(you)</span>
              )}
              <p className="text-xs text-gray-400 mt-0.5">Added {new Date(admin.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3">
              {rowMessage?.id === admin.id && (
                <span className={`text-xs ${rowMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                  {rowMessage.text}
                </span>
              )}
              <button
                onClick={() => handleResend(admin.id)}
                disabled={busyId === admin.id}
                className="text-xs text-meq-sky hover:underline disabled:opacity-50"
              >
                Resend welcome
              </button>
              {admin.id !== currentAdminId && (
                <button
                  onClick={() => handleRemove(admin.id, admin.email)}
                  disabled={busyId === admin.id}
                  className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <form action={formAction} className="border-t border-gray-100 pt-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">Add another admin</p>
        <div className="flex gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="admin@yourschool.sch.uk"
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
          />
          {authMode !== "sso" && (
            <input
              name="password"
              type="password"
              minLength={6}
              placeholder={authMode === "password" ? "Password" : "Password (optional)"}
              className="w-44 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
            />
          )}
          <AddButton />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.success && <p className="text-sm text-emerald-600">Admin added — welcome email sent.</p>}
        {authMode === "sso" && (
          <p className="text-xs text-gray-500">This school uses Google SSO — admin will sign in with their Google account.</p>
        )}
      </form>
    </div>
  );
}
