"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  category: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

const POLL_MS = 60_000;

const CATEGORY_ICONS: Record<string, string> = {
  safeguarding: "⚠️",
  survey: "📝",
  assessment: "📋",
  system: "ℹ️",
};

export default function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted.current) return;
      setItems(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silently ignore — polling will try again
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchData();
    const id = setInterval(fetchData, POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [fetchData]);

  async function markAllRead() {
    setLoading(true);
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    await fetchData();
    setLoading(false);
  }

  async function markOneRead(id: string) {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", id }),
    });
    fetchData();
  }

  function formatRelative(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(ms / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  }

  return (
    <div className="relative print:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 w-80 max-h-[480px] overflow-hidden flex flex-col z-50">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="font-bold text-gray-900 text-sm">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="text-xs text-meq-sky hover:underline disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  No notifications yet.
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {items.map((n) => {
                    const icon = CATEGORY_ICONS[n.category] ?? "•";
                    const content = (
                      <div className={`px-4 py-3 flex gap-3 hover:bg-gray-50 ${n.readAt ? "" : "bg-blue-50/40"}`}>
                        <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${n.readAt ? "text-gray-700" : "font-semibold text-gray-900"}`}>
                            {n.title}
                          </p>
                          {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                          <p className="text-xs text-gray-400 mt-1">{formatRelative(n.createdAt)}</p>
                        </div>
                        {!n.readAt && (
                          <span className="w-2 h-2 rounded-full bg-meq-sky flex-shrink-0 mt-1.5" aria-hidden="true" />
                        )}
                      </div>
                    );
                    return (
                      <li key={n.id}>
                        {n.href ? (
                          <Link href={n.href} onClick={() => { markOneRead(n.id); setOpen(false); }}>
                            {content}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markOneRead(n.id)}
                            className="w-full text-left"
                          >
                            {content}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
