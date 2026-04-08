"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestPasswordReset } from "@/app/actions/password-reset";
import Image from "next/image";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full py-3 px-4 rounded-lg text-sm font-bold text-white bg-gray-600 hover:bg-gray-500 disabled:opacity-50 transition-all">
      {pending ? "Sending..." : "Send Reset Link"}
    </button>
  );
}

export default function SuperForgotPasswordPage() {
  const [state, formAction] = useFormState(requestPasswordReset, null);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Image src="/wasil-logo-white.png" alt="Wasil" width={100} height={34} className="mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white">Reset Password</h1>
        </div>

        {state?.success ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
            <p className="text-white font-medium mb-2">Check your email</p>
            <p className="text-sm text-gray-400">If an account exists, we've sent a reset link.</p>
            <Link href="/super/login" className="block mt-4 text-sm text-meq-sky hover:underline">Back to login</Link>
          </div>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="userType" value="super" />
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input id="email" name="email" type="email" required className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-meq-sky focus:outline-none" />
              </div>
              {state?.error && <p className="text-sm text-red-400 text-center">{state.error}</p>}
              <SubmitButton />
            </div>
            <p className="text-center mt-4">
              <Link href="/super/login" className="text-sm text-gray-500 hover:text-gray-400">Back to login</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
