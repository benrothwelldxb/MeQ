"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginTeacher } from "@/app/actions/teacher-auth";

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

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-meq-sky text-white text-xl font-extrabold mb-3">
            MeQ
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Login</h1>
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
            {state?.error && <p className="text-sm text-red-600 text-center">{state.error}</p>}
            <SubmitButton />
          </div>
        </form>
      </div>
    </main>
  );
}
