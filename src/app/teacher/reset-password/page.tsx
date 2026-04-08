"use client";

import { useFormState, useFormStatus } from "react-dom";
import { resetPassword } from "@/app/actions/password-reset";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full py-3 px-4 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all">
      {pending ? "Resetting..." : "Reset Password"}
    </button>
  );
}

function ResetForm() {
  const [state, formAction] = useFormState(resetPassword, null);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <p className="text-red-600 font-medium">Invalid reset link.</p>
        <Link href="/teacher/forgot-password" className="block mt-4 text-sm text-meq-sky hover:underline">Request a new one</Link>
      </div>
    );
  }

  if (state?.success) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-gray-700 font-medium mb-2">Password reset!</p>
        <p className="text-sm text-gray-500">You can now sign in with your new password.</p>
        <Link href="/teacher/login" className="block mt-4 text-sm font-medium text-meq-sky hover:underline">Sign in</Link>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input id="password" name="password" type="password" required minLength={6} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none transition-colors" />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none transition-colors" />
        </div>
        {state?.error && <p className="text-sm text-red-600 text-center">{state.error}</p>}
        <SubmitButton />
      </div>
    </form>
  );
}

export default function TeacherResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Image src="/meq-logo.png" alt="MeQ" width={56} height={56} className="rounded-xl mb-3 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">New Password</h1>
        </div>
        <Suspense>
          <ResetForm />
        </Suspense>
      </div>
    </main>
  );
}
