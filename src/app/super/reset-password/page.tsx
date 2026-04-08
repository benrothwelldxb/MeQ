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
    <button type="submit" disabled={pending} className="w-full py-3 px-4 rounded-lg text-sm font-bold text-white bg-gray-600 hover:bg-gray-500 disabled:opacity-50 transition-all">
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
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
        <p className="text-red-400 font-medium">Invalid reset link.</p>
        <Link href="/super/forgot-password" className="block mt-4 text-sm text-meq-sky hover:underline">Request a new one</Link>
      </div>
    );
  }

  if (state?.success) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
        <p className="text-white font-medium mb-2">Password reset!</p>
        <p className="text-sm text-gray-400">You can now sign in with your new password.</p>
        <Link href="/super/login" className="block mt-4 text-sm font-medium text-meq-sky hover:underline">Sign in</Link>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
          <input id="password" name="password" type="password" required minLength={6} className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-meq-sky focus:outline-none" />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-1">Confirm Password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-meq-sky focus:outline-none" />
        </div>
        {state?.error && <p className="text-sm text-red-400 text-center">{state.error}</p>}
        <SubmitButton />
      </div>
    </form>
  );
}

export default function SuperResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Image src="/wasil-logo-white.png" alt="Wasil" width={100} height={34} className="mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white">New Password</h1>
        </div>
        <Suspense>
          <ResetForm />
        </Suspense>
      </div>
    </main>
  );
}
