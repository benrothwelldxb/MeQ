"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "meq:bookmarkPromptSeen";

type Device = "ios" | "android" | "desktop";

// Chrome/Edge/Android Chromium fire `beforeinstallprompt` when the page meets
// PWA install criteria (manifest + SW + reachable over HTTPS). The event lets
// us trigger the native install dialog with a single tap rather than walking
// the kid through a multi-step text instruction.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectDevice(): Device {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // iOS Safari uses navigator.standalone; modern browsers use the matchMedia query.
  const mql = window.matchMedia?.("(display-mode: standalone)");
  if (mql?.matches) return true;
  // @ts-expect-error iOS-only property
  if (typeof navigator !== "undefined" && navigator.standalone === true) return true;
  return false;
}

export default function BookmarkPrompt() {
  const [visible, setVisible] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Already installed → never prompt.
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // localStorage blocked (private mode) — fall through and show once
      // since we can't track dismissal anyway.
    }
    setDevice(detectDevice());

    const handleBeforeInstall = (e: Event) => {
      // Stash the event so we can fire the native install dialog later.
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Small delay so the login form renders first and the prompt doesn't feel intercepted.
    const t = window.setTimeout(() => setVisible(true), 600);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const handleNativeInstall = async () => {
    if (!installEvent) return;
    setInstalling(true);
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        // Store dismissal so we don't re-prompt on next visit while the
        // browser settles on the install state.
        try { localStorage.setItem(STORAGE_KEY, new Date().toISOString()); } catch {/* ignore */}
        setVisible(false);
      }
    } finally {
      setInstalling(false);
      setInstallEvent(null);
    }
  };

  if (!visible) return null;

  // If the browser supports a native install prompt, prefer that over the
  // text walkthrough — one tap, no instructions to follow.
  const canNativeInstall = installEvent !== null;

  const instructions = (() => {
    switch (device) {
      case "ios":
        return {
          heading: "Add MeQ to your home screen",
          steps: [
            "Tap the Share button at the bottom of Safari.",
            "Scroll down and tap Add to Home Screen.",
            "Tap Add — the MeQ icon appears like any other app.",
          ],
        };
      case "android":
        return {
          heading: "Add MeQ to your home screen",
          steps: [
            "Tap the ⋮ menu at the top right.",
            "Tap Add to Home screen (or Install app).",
            "Confirm — MeQ will appear on your home screen.",
          ],
        };
      default:
        return {
          heading: "Save MeQ for quick access",
          steps: [
            "Press Ctrl + D (or Cmd + D on Mac) to bookmark.",
            "Or pin this tab so it's always open.",
            "Or use the install button in your browser's address bar.",
          ],
        };
    }
  })();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bookmark-prompt-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-meq-mist p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="text-3xl" aria-hidden="true">📌</div>
          <div className="flex-1">
            <h2 id="bookmark-prompt-title" className="font-bold text-meq-slate text-lg">
              {canNativeInstall ? "Install MeQ" : instructions.heading}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {canNativeInstall
                ? "Tap install and MeQ will appear on your home screen like any other app."
                : "Come back any time to complete a survey, do your weekly pulse, or ask to talk with a teacher."}
            </p>
          </div>
        </div>

        {canNativeInstall ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleNativeInstall}
              disabled={installing}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
            >
              {installing ? "Installing…" : "Install MeQ"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="w-full py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Not now
            </button>
          </div>
        ) : (
          <>
            <ol className="text-sm text-gray-700 space-y-2 my-4 pl-4">
              {instructions.steps.map((step, i) => (
                <li key={i} className="list-decimal">{step}</li>
              ))}
            </ol>
            <button
              type="button"
              onClick={dismiss}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all"
            >
              Got it
            </button>
          </>
        )}
      </div>
    </div>
  );
}
