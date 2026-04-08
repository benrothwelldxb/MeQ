import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { getAdminSession } from "@/lib/session";
import { updateSchoolSettings } from "@/app/actions/settings";
import { getYearGroups } from "@/app/actions/year-groups";
import { changeAdminPassword } from "@/app/actions/change-password";
import SettingsForm from "@/components/admin/SettingsForm";
import ChangePasswordForm from "@/components/shared/ChangePasswordForm";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await getAdminSession();
  const school = await getSchoolSettings(session.schoolId);
  const yearGroups = await getYearGroups(session.schoolId);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* School Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">School Settings</h2>
        <SettingsForm action={updateSchoolSettings}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
            <input name="name" defaultValue={school.name} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Term</label>
              <select name="currentTerm" defaultValue={school.currentTerm} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none">
                {Object.entries(TERM_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <input name="academicYear" defaultValue={school.academicYear} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none" />
            </div>
          </div>
        </SettingsForm>
      </div>

      {/* Year Groups & Classes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Year Groups & Classes</h2>
          <Link href="/admin/settings/year-groups" className="text-sm text-meq-sky hover:underline font-medium">
            Manage
          </Link>
        </div>
        <div className="space-y-3">
          {yearGroups.map((yg) => (
            <div key={yg.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <span className="font-medium text-gray-900">{yg.name}</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  yg.tier === "junior" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {yg.tier}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {yg.classes.length} {yg.classes.length === 1 ? "class" : "classes"}
              </span>
            </div>
          ))}
          {yearGroups.length === 0 && (
            <p className="text-sm text-gray-500">No year groups set up yet.</p>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">Change Password</h2>
        <ChangePasswordForm action={changeAdminPassword} />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/admin/settings/year-groups" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-meq-sky transition-all">
          <h3 className="font-bold text-gray-900 text-sm">Year Groups & Classes</h3>
          <p className="text-xs text-gray-500 mt-1">Add, edit, or remove year groups and classes</p>
        </Link>
        <Link href="/admin/settings/interventions" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-meq-sky transition-all">
          <h3 className="font-bold text-gray-900 text-sm">Interventions</h3>
          <p className="text-xs text-gray-500 mt-1">Manage the intervention bank</p>
        </Link>
      </div>
    </div>
  );
}
