"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginStudent } from "./actions/auth";
import { useState } from "react";
import Image from "next/image";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="mt-6 w-full py-4 px-6 rounded-xl text-lg font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] min-h-touch"
    >
      {pending ? "Checking..." : "Start"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginStudent, null);
  const [code, setCode] = useState("");

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, "")
      .slice(0, 8);
    setCode(value);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-meq-cloud p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/meq-logo.png" alt="MeQ" width={80} height={80} className="rounded-2xl mb-4 mx-auto" />
          <h1 className="text-3xl font-bold text-meq-slate mb-2">
            Welcome to MeQ
          </h1>
          <p className="text-lg text-gray-500">
            Type your special code to begin!
          </p>
        </div>

        <form action={formAction}>
          <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-8">
            <label
              htmlFor="code"
              className="block text-sm font-semibold text-meq-slate mb-3"
            >
              Your Login Code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="e.g. ABCD2345"
              autoComplete="off"
              autoFocus
              className="w-full text-center text-2xl font-mono tracking-[0.3em] px-4 py-4 rounded-xl border-2 border-meq-mist focus:border-meq-sky focus:outline-none transition-colors bg-meq-cloud placeholder:text-gray-300 placeholder:tracking-[0.2em]"
              maxLength={8}
            />

            {state?.error && (
              <p className="mt-3 text-sm text-meq-coral text-center">
                {state.error}
              </p>
            )}

            <SubmitButton disabled={code.length !== 8} />
          </div>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-gray-400 text-xs">
          <span>by</span>
          <Image src="/wasil-logo-grey.png" alt="Wasil" width={60} height={20} className="opacity-50" />
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Ask your teacher if you need help finding your code.
        </p>
      </div>
    </main>
  );
}
