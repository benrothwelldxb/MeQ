"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateSchoolSettings } from "@/app/actions/school-manage";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
    >
      {pending ? "Saving..." : "Save Changes"}
    </button>
  );
}

type School = {
  id: string;
  name: string;
  currentTerm: string;
  academicYear: string;
  isActive: boolean;
  reducedQuestions: boolean;
  pulseEnabled: boolean;
  readAloudEnabled: boolean;
  staffWellbeingEnabled: boolean;
  dslEmail: string | null;
  authMode: string;
};

export default function SchoolSettingsForm({ school }: { school: School }) {
  const boundAction = updateSchoolSettings.bind(null, school.id);
  const [state, formAction] = useFormState(boundAction, null);

  return (
    <form action={formAction} className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-5">
      <h2 className="font-bold text-white mb-2">School Settings</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">School Name</label>
          <input
            name="name"
            defaultValue={school.name}
            required
            className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-meq-sky focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Academic Year</label>
          <input
            name="academicYear"
            defaultValue={school.academicYear}
            required
            className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-meq-sky focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Current Term</label>
          <select
            name="currentTerm"
            defaultValue={school.currentTerm}
            className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-meq-sky focus:outline-none"
          >
            <option value="term1">Term 1</option>
            <option value="term2">Term 2</option>
            <option value="term3">Term 3</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">DSL Email</label>
          <input
            name="dslEmail"
            type="email"
            defaultValue={school.dslEmail ?? ""}
            placeholder="Safeguarding lead email"
            className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-meq-sky focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Staff Sign-In Method</label>
        <select
          name="authMode"
          defaultValue={school.authMode}
          className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-meq-sky focus:outline-none"
        >
          <option value="both">Either (password or Google SSO)</option>
          <option value="sso">Google SSO only</option>
          <option value="password">Password only</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Controls welcome email content and whether passwords are required when adding staff.
        </p>
      </div>

      {/* Toggles */}
      <div className="space-y-3 border-t border-gray-700 pt-4">
        <p className="text-sm font-medium text-gray-300 mb-1">Features</p>
        {[
          { name: "isActive", label: "School Active", checked: school.isActive },
          { name: "reducedQuestions", label: "Reduced Questions", checked: school.reducedQuestions },
          { name: "pulseEnabled", label: "Pulse Check-ins", checked: school.pulseEnabled },
          { name: "readAloudEnabled", label: "Read Aloud", checked: school.readAloudEnabled },
          { name: "staffWellbeingEnabled", label: "Staff Wellbeing", checked: school.staffWellbeingEnabled },
        ].map((toggle) => (
          <label key={toggle.name} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name={toggle.name}
              defaultChecked={toggle.checked}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-meq-sky focus:ring-meq-sky"
            />
            <span className="text-sm text-gray-300">{toggle.label}</span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SaveButton />
        {state?.success && <span className="text-sm text-emerald-400">Saved.</span>}
        {state?.error && <span className="text-sm text-red-400">{state.error}</span>}
      </div>
    </form>
  );
}
