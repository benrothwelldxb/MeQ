"use client";

import { useEffect } from "react";

/**
 * Registers the service worker so the browser treats MeQ as installable
 * (Chrome / Edge / Android show a real install prompt; iOS Safari uses it
 * to make "Add to Home Screen" produce a proper app entry rather than a
 * generic webpage shortcut).
 *
 * Skipped in development to avoid stale-cache headaches when iterating.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV === "development") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (err) {
        // Non-fatal — the app still works without a SW. Log for visibility.
        console.warn("[sw] registration failed:", err);
      }
    };

    // Register after load so it doesn't compete with the initial paint.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
