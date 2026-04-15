"use client";

import { useEffect, useState, useCallback } from "react";

const WARN_AT_REMAINING_MS = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL_MS = 30 * 1000; // 30 seconds
const ACTIVE_RESET_THROTTLE_MS = 60 * 1000; // throttle "active" pings

/**
 * Watches the session — if the user is within 5 minutes of expiring,
 * shows a modal with a "stay signed in" button. The button hits an
 * endpoint that re-saves the iron-session, refreshing its TTL.
 */
export default function SessionExpiryWarning({
  ttlSeconds,
  refreshUrl,
}: {
  ttlSeconds: number;
  refreshUrl: string;
}) {
  // Track when the session was last refreshed (mount or after click).
  const [sessionStart, setSessionStart] = useState<number>(() => Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshSession = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(refreshUrl, { method: "POST" });
      if (res.ok) {
        setSessionStart(Date.now());
        setShowWarning(false);
      }
    } finally {
      setRefreshing(false);
    }
  }, [refreshUrl]);

  // Throttled active-user heartbeat: any keypress/click resets the session window.
  useEffect(() => {
    let lastPing = Date.now();
    function onActivity() {
      const now = Date.now();
      if (now - lastPing < ACTIVE_RESET_THROTTLE_MS) return;
      lastPing = now;
      // Best-effort refresh — silently extends the session
      fetch(refreshUrl, { method: "POST" }).then((res) => {
        if (res.ok) setSessionStart(now);
      });
    }
    window.addEventListener("click", onActivity);
    window.addEventListener("keydown", onActivity);
    return () => {
      window.removeEventListener("click", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [refreshUrl]);

  // Polling tick to check remaining time
  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - sessionStart;
      const remaining = ttlSeconds * 1000 - elapsed;
      if (remaining <= 0) {
        // Session expired — reload to trigger redirect to login
        window.location.reload();
        return;
      }
      if (remaining <= WARN_AT_REMAINING_MS) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };
    tick();
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [sessionStart, ttlSeconds]);

  if (!showWarning) return null;

  const remainingMin = Math.max(
    1,
    Math.ceil((ttlSeconds * 1000 - (Date.now() - sessionStart)) / 60_000)
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
        <div className="flex items-start gap-3 mb-3">
          <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold text-gray-900">You&apos;re about to be signed out</h3>
            <p className="text-sm text-gray-500 mt-1">
              Your session will expire in about {remainingMin} minute{remainingMin === 1 ? "" : "s"}.
              Stay signed in to keep working.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowWarning(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200"
          >
            Dismiss
          </button>
          <button
            onClick={refreshSession}
            disabled={refreshing}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Stay signed in"}
          </button>
        </div>
      </div>
    </div>
  );
}
