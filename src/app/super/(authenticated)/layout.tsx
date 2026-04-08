import { redirect } from "next/navigation";
import { getSuperAdminSession } from "@/lib/session";
import Link from "next/link";
import Image from "next/image";
import { logoutSuperAdmin } from "@/app/actions/super-auth";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSuperAdminSession();
  if (!session.superAdminId) {
    redirect("/super/login");
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/wasil-logo-white.png" alt="Wasil" width={80} height={27} />
            <span className="text-gray-500">|</span>
            <span className="text-white font-bold text-sm">MeQ Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/super" className="text-sm text-gray-400 hover:text-white">Schools</Link>
            <form action={logoutSuperAdmin}>
              <button type="submit" className="text-sm text-gray-400 hover:text-white">Sign Out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
