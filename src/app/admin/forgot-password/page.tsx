"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestPasswordReset } from "@/app/actions/password-reset";
import Image from "next/image";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full py-3 px-4 rounded-lg text-sm font-bold text-white bg-meq-slate hover:bg-meq-slate/90 disabled:opacity-50 transition-all">
      {pending ? "Sending..." : "Send Reset Link"}
    </button>
  );
}

export default function AdminForgotPasswordPage() {
  const [state, formAction] = useFormState(requestPasswordReset, null);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Image src="/meq-logo.png" alt="MeQ" width={56} height={56} className="rounded-xl mb-3 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your email to receive a reset link</p>
        </div>

        {state?.success ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium mb-2">Check your email</p>
            <p className="text-sm text-gray-500">If an account exists with that email, we&apos;ve sent a password reset link.</p>
            <Link href="/admin/login" className="block mt-4 text-sm text-meq-sky hover:underline">Back to login</Link>
          </div>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="userType" value="admin" />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input id="email" name="email" type="email" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none transition-colors" />
              </div>
              {state?.error && <p className="text-sm text-red-600 text-center">{state.error}</p>}
              <SubmitButton />
            </div>
            <p className="text-center mt-4">
              <Link href="/admin/login" className="text-sm text-gray-500 hover:text-gray-700">Back to login</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
