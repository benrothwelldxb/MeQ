"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleDone = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <div className="text-center">
      <button
        onClick={handleDone}
        className="px-8 py-3.5 rounded-xl font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all active:scale-[0.98] min-h-touch"
      >
        Done
      </button>
    </div>
  );
}
