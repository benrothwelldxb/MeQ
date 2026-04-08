import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import Sidebar from "@/components/admin/Sidebar";

export default async function AuthenticatedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (session.pendingEmail && !session.adminId) {
    redirect("/admin/choose-campus");
  }

  if (!session.adminId) {
    redirect("/admin/login");
  }

  const school = await prisma.school.findUnique({
    where: { id: session.schoolId },
    select: { name: true },
  });

  const campusCount = await prisma.admin.count({
    where: { email: session.email },
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar schoolName={school?.name ?? "School"} hasMultipleCampuses={campusCount > 1} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
