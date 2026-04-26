"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginStudent } from "./actions/auth";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import AccessibilityToggles from "@/components/AccessibilityToggles";
import BookmarkPrompt from "@/components/BookmarkPrompt";
import QrScanModal from "@/components/QrScanModal";

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

function sanitizeCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, "")
    .slice(0, 8);
}

/**
 * Pull a login code out of a scanned QR value. Accepts either a bare 8-char
 * code or a full URL whose `?code=` param holds it. Returns null if neither
 * shape produces a valid code, so callers can show an error rather than
 * silently doing nothing.
 */
function extractCodeFromQrValue(raw: string): string | null {
  const direct = sanitizeCode(raw);
  if (direct.length === 8) return direct;
  try {
    const url = new URL(raw);
    const param = url.searchParams.get("code");
    if (param) {
      const cleaned = sanitizeCode(param);
      if (cleaned.length === 8) return cleaned;
    }
  } catch {
    // not a URL — fall through
  }
  return null;
}

// Hook isolated into a child component so the suspense boundary covers
// useSearchParams() — required by Next 14's static-generation prerender.
function LoginForm() {
  const [state, formAction] = useFormState(loginStudent, null);
  const [code, setCode] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const searchParams = useSearchParams();

  // Prefill from QR scan: /?code=ABCD2345 — student opens login with their
  // code already in the box and just taps Start. After prefill, strip the
  // code from the URL via replaceState so it doesn't sit in browser history,
  // shared-screen captures, or get sent in any subsequent Referer header.
  useEffect(() => {
    const qrCode = searchParams.get("code");
    if (qrCode) {
      const sanitized = sanitizeCode(qrCode);
      if (sanitized.length === 8) {
        setCode(sanitized);
        if (typeof window !== "undefined" && window.history.replaceState) {
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState(null, "", cleanUrl);
        }
      }
    }
  }, [searchParams]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(sanitizeCode(e.target.value));
  };

  const handleScanDetected = (rawValue: string) => {
    const extracted = extractCodeFromQrValue(rawValue);
    if (!extracted) {
      setScanError("That doesn't look like a MeQ code. Try again or type it in.");
      // Keep the modal open so they can retry — but the modal stops after first
      // detection. Close it; the error stays visible on the form.
      setScanOpen(false);
      return;
    }
    setScanError(null);
    setCode(extracted);
    setScanOpen(false);
    // Auto-submit so the kid doesn't have to find the Start button after scan.
    // requestAnimationFrame lets React commit the new code value first.
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  };

  return (
    <>
      <form ref={formRef} action={formAction}>
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

          {(state?.error || scanError) && (
            <p className="mt-3 text-sm text-meq-coral text-center">
              {state?.error || scanError}
            </p>
          )}

          <SubmitButton disabled={code.length !== 8} />

          <div className="flex items-center gap-3 my-4">
            <span className="flex-1 h-px bg-meq-mist" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
            <span className="flex-1 h-px bg-meq-mist" />
          </div>

          <button
            type="button"
            onClick={() => { setScanError(null); setScanOpen(true); }}
            className="w-full py-3 px-6 rounded-xl text-base font-semibold text-meq-sky bg-meq-sky-light hover:bg-meq-sky/20 transition-all active:scale-[0.98] min-h-touch flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4zm12 0h2v2h-2v-2zm-6-6h2v2h-2v-2zm6 0h4v2h-4v-2zm-6 6h4v4h-4v-4z" />
            </svg>
            Scan my QR code
          </button>
        </div>
      </form>

      <QrScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onDetected={handleScanDetected}
      />
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-meq-cloud p-4">
      <BookmarkPrompt />
      <div className="fixed top-4 right-4 z-30">
        <AccessibilityToggles />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/meq-logo.png" alt="MeQ" width={80} height={80} className="rounded-2xl mb-4 mx-auto" />
          <h1 className="text-3xl font-bold text-meq-slate mb-2">
            Welcome to MeQ
          </h1>
          <p className="text-lg text-gray-500">
            Type your special code or scan to begin!
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

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
