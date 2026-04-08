import { changeSuperAdminPassword } from "@/app/actions/change-password";
import ChangePasswordForm from "@/components/shared/ChangePasswordForm";

export default function SuperSettingsPage() {
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="font-bold text-white mb-4">Change Password</h2>
        <ChangePasswordForm action={changeSuperAdminPassword} />
      </div>
    </div>
  );
}
