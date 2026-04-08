"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutTeacher } from "@/app/actions/teacher-auth";

export default function TeacherSidebar({ teacherName }: { teacherName: string }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/teacher", label: "My Classes" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-meq-sky text-white flex items-center justify-center text-sm font-extrabold">
            MeQ
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">{teacherName}</div>
            <div className="text-xs text-gray-500">Teacher</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.href === "/teacher"
            ? pathname === "/teacher"
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
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <form action={logoutTeacher}>
          <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
