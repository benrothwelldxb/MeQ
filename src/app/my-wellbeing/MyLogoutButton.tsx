"use client";

import { useRouter } from "next/navigation";

export default function MyLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-meq-mist hover:bg-gray-50"
    >
      Sign out
    </button>
  );
}
