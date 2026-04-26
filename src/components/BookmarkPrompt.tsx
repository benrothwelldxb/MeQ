"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "meq:bookmarkPromptSeen";

type Device = "ios" | "android" | "desktop";

function detectDevice(): Device {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

export default function BookmarkPrompt() {
  const [visible, setVisible] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
      setDevice(detectDevice());
      // Small delay so the login form renders first and doesn't feel intercepted.
      const t = window.setTimeout(() => setVisible(true), 600);
      return () => window.clearTimeout(t);
    } catch {
      // localStorage blocked (private mode, etc.) — just don't show.
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  const instructions = (() => {
    switch (device) {
      case "ios":
        return {
          heading: "Save MeQ to your home screen",
          steps: [
            "Tap the Share button at the bottom of Safari.",
            "Scroll down and tap Add to Home Screen.",
            "Tap Add — the MeQ icon will appear like any other app.",
          ],
        };
      case "android":
        return {
          heading: "Add MeQ to your home screen",
          steps: [
            "Tap the ⋮ menu button at the top right.",
            "Tap Add to Home screen (or Install app).",
            "Confirm — MeQ will appear on your home screen.",
          ],
        };
      default:
        return {
          heading: "Bookmark MeQ so you can come back any time",
          steps: [
            "Press Ctrl + D (or Cmd + D on Mac).",
            "Pick a name and a folder, then save.",
            "Open MeQ from your bookmarks bar whenever you need to.",
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
          <div className="text-3xl">📌</div>
          <div className="flex-1">
            <h2 id="bookmark-prompt-title" className="font-bold text-meq-slate text-lg">
              {instructions.heading}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              You can come back here any time — to complete a survey, do your weekly pulse, or ask to talk with a teacher.
            </p>
          </div>
        </div>

        <ol className="text-sm text-gray-700 space-y-2 my-4 pl-4">
          {instructions.steps.map((step, i) => (
            <li key={i} className="list-decimal">
              {step}
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={dismiss}
          className="w-full py-3 rounded-xl text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
