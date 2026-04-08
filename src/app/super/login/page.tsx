"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginSuperAdmin } from "@/app/actions/super-auth";
import Image from "next/image";
import { useState } from "react";

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
            {state?.error && <p className="text-sm text-red-400 text-center">{state.error}</p>}
            <SubmitButton />
          </div>
        </form>
      </div>
    </main>
  );
}
