import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import Sidebar from "@/components/admin/Sidebar";

export default async function AuthenticatedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session.adminId) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
