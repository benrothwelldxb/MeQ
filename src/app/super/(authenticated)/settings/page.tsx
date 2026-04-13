import { prisma } from "@/lib/db";
import { getSuperAdminSession } from "@/lib/session";
import { changeSuperAdminPassword } from "@/app/actions/change-password";
import ChangePasswordForm from "@/components/shared/ChangePasswordForm";
import SuperAdminManager from "@/components/super/SuperAdminManager";

export default async function SuperSettingsPage() {
  const session = await getSuperAdminSession();
  const admins = await prisma.superAdmin.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, createdAt: true },
  });

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="font-bold text-white mb-4">Super Admins</h2>
        <p className="text-sm text-gray-400 mb-4">
          Manage platform administrators. Users with Google SSO can leave the password blank.
        </p>
        <SuperAdminManager admins={admins} currentId={session.superAdminId!} />
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="font-bold text-white mb-4">Change Password</h2>
        <ChangePasswordForm action={changeSuperAdminPassword} />
      </div>
    </div>
  );
}
