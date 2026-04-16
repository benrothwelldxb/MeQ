"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY_FONT = "meq-a11y-dyslexia-font";
const STORAGE_KEY_CONTRAST = "meq-a11y-high-contrast";

function applyPreferences() {
  if (typeof document === "undefined") return;
  const dyslexia = localStorage.getItem(STORAGE_KEY_FONT) === "on";
  const contrast = localStorage.getItem(STORAGE_KEY_CONTRAST) === "on";
  document.documentElement.classList.toggle("a11y-dyslexia", dyslexia);
  document.documentElement.classList.toggle("a11y-high-contrast", contrast);
}

export default function AccessibilityToggles() {
  const [dyslexia, setDyslexia] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setDyslexia(localStorage.getItem(STORAGE_KEY_FONT) === "on");
    setContrast(localStorage.getItem(STORAGE_KEY_CONTRAST) === "on");
    applyPreferences();
  }, []);

  function toggleDyslexia() {
    const next = !dyslexia;
    setDyslexia(next);
    localStorage.setItem(STORAGE_KEY_FONT, next ? "on" : "off");
    applyPreferences();
  }

  function toggleContrast() {
    const next = !contrast;
    setContrast(next);
    localStorage.setItem(STORAGE_KEY_CONTRAST, next ? "on" : "off");
    applyPreferences();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Accessibility options"
        className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M12 8v6m-4 6 4-6 4 6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-50 w-64">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              Accessibility
            </p>
            <label className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={dyslexia}
                onChange={toggleDyslexia}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Dyslexia-friendly font</p>
                <p className="text-xs text-gray-500">Use OpenDyslexic for easier reading</p>
              </div>
            </label>
            <label className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={contrast}
                onChange={toggleContrast}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">High contrast</p>
                <p className="text-xs text-gray-500">Darker text, bolder borders</p>
              </div>
            </label>
            <p className="text-xs text-gray-400 px-2 mt-2">Saves on this device.</p>
          </div>
        </>
      )}
    </div>
  );
}
