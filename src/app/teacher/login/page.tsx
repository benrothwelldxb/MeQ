"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginTeacher } from "@/app/actions/teacher-auth";

import GoogleSignInButton from "@/components/GoogleSignInButton";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
    >
      {pending ? "Signing in..." : "Sign In"}
    </button>
  );
}

export default function TeacherLoginPage() {
  const [state, formAction] = useFormState(loginTeacher, null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    const email = params.get("email");
    if (err === "NoAccount") {
      setOauthError(`No teacher account found for ${email ?? "that email"}. Ask your admin to add you.`);
    } else if (err === "NoGoogleSession") {
      setOauthError("Google sign-in was cancelled or failed. Please try again.");
    } else if (err === "InvalidType") {
      setOauthError("Sign-in flow error. Please try again.");
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Image src="/meq-logo.png" alt="MeQ" width={56} height={56} className="rounded-xl mb-3 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Teacher Login</h1>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-gray-400 text-xs">
            <span>by</span>
            <Image src="/wasil-logo-grey.png" alt="Wasil" width={60} height={20} className="opacity-50" />
          </div>
        </div>

        <form action={formAction}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none transition-colors" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none transition-colors" />
            </div>
            {(state?.error || oauthError) && <p className="text-sm text-red-600 text-center">{state?.error ?? oauthError}</p>}
            <SubmitButton />
            <p className="text-center">
              <Link href="/teacher/forgot-password" className="text-xs text-gray-400 hover:text-gray-600">Forgot password?</Link>
            </p>
          </div>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <GoogleSignInButton
          type="teacher"
          className="w-full py-3 px-4 rounded-lg text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
        />
      </div>
    </main>
  );
}
