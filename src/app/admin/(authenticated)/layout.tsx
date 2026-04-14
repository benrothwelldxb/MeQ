import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { parseEmailList } from "@/lib/email";
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
    select: { name: true, dslEmail: true },
  });

  const campusCount = await prisma.admin.count({
    where: { email: session.email },
  });

  // Only DSLs see the open-alert badge count; others see the nav item
  // but get the policy-only page when they click through.
  const dslEmails = parseEmailList(school?.dslEmail);
  const isDsl = !!session.email && dslEmails.includes(session.email.toLowerCase());
  const openAlertCount = isDsl
    ? await prisma.safeguardingAlert.count({
        where: { schoolId: session.schoolId, status: "open" },
      })
    : 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        schoolName={school?.name ?? "School"}
        hasMultipleCampuses={campusCount > 1}
        openAlertCount={openAlertCount}
      />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
