import { changeTeacherPassword } from "@/app/actions/change-password";
import ChangePasswordForm from "@/components/shared/ChangePasswordForm";

export default function TeacherSettingsPage() {
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Change Password</h2>
        <ChangePasswordForm action={changeTeacherPassword} />
      </div>
    </div>
  );
}
