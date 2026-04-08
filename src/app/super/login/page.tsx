"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginSuperAdmin } from "@/app/actions/super-auth";
import Image from "next/image";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full py-3 px-4 rounded-lg text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 transition-all">
      {pending ? "Signing in..." : "Sign In"}
    </button>
  );
}

export default function SuperLoginPage() {
  const [state, formAction] = useFormState(loginSuperAdmin, null);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Image src="/wasil-logo-white.png" alt="Wasil" width={100} height={34} className="mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white">MeQ Platform Admin</h1>
        </div>
        <form action={formAction}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input id="email" name="email" type="email" required className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-meq-sky focus:outline-none" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <input id="password" name="password" type="password" required className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-meq-sky focus:outline-none" />
            </div>
            {state?.error && <p className="text-sm text-red-400 text-center">{state.error}</p>}
            <SubmitButton />
          </div>
        </form>
      </div>
    </main>
  );
}
