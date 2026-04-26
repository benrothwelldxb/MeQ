"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/app/actions/admin-auth";

// Sidebar grouped into sections so admins find things by mental model rather
// than scanning a flat list. Section headers use small uppercase tracking so
// they're clearly subordinate to the items beneath. Dashboard lives at the
// top with no header — it's the home.
type NavItem = {
  href: string;
  label: string;
  icon: string;
  badge?: "safeguarding";
};

type NavSection = {
  heading: string | null;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    heading: null,
    items: [{ href: "/admin", label: "Dashboard", icon: "squares" }],
  },
  {
    heading: "People",
    items: [
      { href: "/admin/students", label: "Students", icon: "users" },
      { href: "/admin/settings/groups", label: "Groups", icon: "users" },
      { href: "/admin/teachers", label: "Teachers", icon: "users" },
    ],
  },
  {
    heading: "Wellbeing",
    items: [
      { href: "/admin/calendar", label: "Calendar", icon: "calendar" },
      { href: "/admin/pulse", label: "Pulse", icon: "chart" },
      { href: "/admin/surveys", label: "Custom surveys", icon: "book" },
      { href: "/admin/staff-wellbeing", label: "Staff Wellbeing", icon: "users" },
      { href: "/admin/safeguarding", label: "Safeguarding", icon: "shield", badge: "safeguarding" },
    ],
  },
  {
    heading: "Insights",
    items: [
      { href: "/admin/results", label: "Results", icon: "chart" },
      { href: "/admin/slt", label: "SLT Dashboard", icon: "chart" },
    ],
  },
  {
    heading: "Setup",
    items: [
      { href: "/admin/framework", label: "Framework", icon: "book" },
      { href: "/admin/settings", label: "Settings", icon: "cog" },
    ],
  },
];

function NavIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "squares":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case "users":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case "chart":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case "book":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case "cog":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "shield":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      );
    case "calendar":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar({
  schoolName,
  hasMultipleCampuses,
  openAlertCount = 0,
}: {
  schoolName: string;
  hasMultipleCampuses: boolean;
  openAlertCount?: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img src="/meq-logo.png" alt="MeQ" className="w-9 h-9 rounded-lg" />
          <div>
            <div className="font-bold text-gray-900 text-sm">{schoolName}</div>
            <div className="text-xs text-gray-500">MeQ Admin</div>
          </div>
        </div>
        {hasMultipleCampuses && (
          <Link
            href="/admin/choose-campus"
            className="mt-3 flex items-center gap-1.5 text-xs text-meq-sky hover:text-meq-sky/80 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            Switch Campus
          </Link>
        )}
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={section.heading ?? `top-${idx}`} className={idx === 0 ? "" : "mt-5"}>
            {section.heading && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {section.heading}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                // Active match: exact for the bare-/admin Dashboard, prefix for
                // everything else. Groups (under /admin/settings/groups) needs
                // its own check because /admin/settings would otherwise also
                // claim it.
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : item.href === "/admin/settings"
                    ? pathname === "/admin/settings" || (pathname.startsWith("/admin/settings/") && !pathname.startsWith("/admin/settings/groups"))
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-meq-sky-light text-meq-sky"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <NavIcon icon={item.icon} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge === "safeguarding" && openAlertCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                        {openAlertCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-3">
        <div className="flex items-center justify-center px-3 py-1">
          <Image src="/wasil-logo-grey.png" alt="Wasil" width={70} height={24} className="opacity-40" />
        </div>
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
