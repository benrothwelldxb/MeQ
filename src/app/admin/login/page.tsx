"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAdmin } from "@/app/actions/admin-auth";
import Image from "next/image";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 rounded-lg text-sm font-bold text-white bg-meq-slate hover:bg-meq-slate/90 disabled:opacity-50 transition-all"
    >
      {pending ? "Signing in..." : "Sign In"}
    </button>
  );
}

export default function AdminLoginPage() {
  const [state, formAction] = useFormState(loginAdmin, null);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Image src="/meq-logo.png" alt="MeQ" width={56} height={56} className="rounded-xl mb-3 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-gray-400 text-xs">
            <span>by</span>
            <Image src="/wasil-logo-grey.png" alt="Wasil" width={60} height={20} className="opacity-50" />
          </div>
        </div>

        <form action={formAction}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none transition-colors"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-red-600 text-center">{state.error}</p>
            )}

            <SubmitButton />
          </div>
        </form>
      </div>
    </main>
  );
}
