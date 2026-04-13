"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginSuperAdmin } from "@/app/actions/super-auth";
import { signInWithGoogle } from "@/app/actions/google-auth";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    const email = params.get("email");
    if (err === "NoAccount") {
      setOauthError(`No super admin account found for ${email ?? "that email"}.`);
    } else if (err === "NoGoogleSession") {
      setOauthError("Google sign-in was cancelled or failed. Please try again.");
    }
  }, []);

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
              <div className="relative">
                <input id="password" name="password" type={showPassword ? "text" : "password"} required className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-meq-sky focus:outline-none pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  )}
                </button>
              </div>
            </div>
            {(state?.error || oauthError) && <p className="text-sm text-red-400 text-center">{state?.error ?? oauthError}</p>}
            <SubmitButton />
            <p className="text-center">
              <Link href="/super/forgot-password" className="text-xs text-gray-500 hover:text-gray-400">Forgot password?</Link>
            </p>
          </div>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        <form action={async () => { await signInWithGoogle("super"); }}>
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg text-sm font-semibold text-gray-300 bg-gray-800 border border-gray-600 hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </form>
      </div>
    </main>
  );
}
