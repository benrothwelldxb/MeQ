import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { updateSchoolSettings } from "@/app/actions/settings";
import { getYearGroups } from "@/app/actions/year-groups";
import { changeAdminPassword } from "@/app/actions/change-password";
import SettingsForm from "@/components/admin/SettingsForm";
import ChangePasswordForm from "@/components/shared/ChangePasswordForm";
import AdminManager from "@/components/admin/AdminManager";
import AcademicYearRollover from "@/components/admin/AcademicYearRollover";
import EmailChipsInput from "@/components/EmailChipsInput";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await getAdminSession();
  const school = await getSchoolSettings(session.schoolId);
  const yearGroups = await getYearGroups(session.schoolId);
  const admins = await prisma.admin.findMany({
    where: { schoolId: session.schoolId },
    select: { id: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const completedThisYear = await prisma.assessment.count({
    where: {
      status: "completed",
      academicYear: school.academicYear,
      student: { schoolId: session.schoolId },
    },
  });
  // Show only: public frameworks (no assignments) + frameworks assigned to this school
  const frameworks = await prisma.framework.findMany({
    where: {
      isActive: true,
      OR: [
        { assignments: { none: {} } }, // public — no assignments
        { assignments: { some: { schoolId: session.schoolId } } }, // explicitly assigned
      ],
    },
    include: { domains: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Calendar pointer — term dates and pulse cadence are now driven by the
          calendar so admins go there for any scheduling change rather than
          editing scattered settings. */}
      <div className="mb-6 bg-meq-sky-light/40 border border-meq-sky/30 rounded-xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-meq-sky flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-semibold text-meq-slate">Scheduling lives in the Calendar</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Term dates, half-term breaks, full-survey windows, and pulse cadence are all managed there.
          </p>
        </div>
        <Link
          href="/admin/calendar"
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-meq-sky hover:bg-meq-sky/90 whitespace-nowrap"
        >
          Open calendar →
        </Link>
      </div>

      {/* School Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">School Settings</h2>
        <SettingsForm action={updateSchoolSettings}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
            <input name="name" defaultValue={school.name} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none" />
          </div>
          {/* Current term + academic year are now derived from the calendar.
              Hidden inputs preserve the values on form save so the existing
              server action keeps working until the next migration cleans this up. */}
          <input type="hidden" name="currentTerm" value={school.currentTerm} />
          <input type="hidden" name="academicYear" value={school.academicYear} />
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
            <p className="text-gray-600">
              Current term: <span className="font-semibold text-gray-900">{TERM_LABELS[school.currentTerm] ?? school.currentTerm}</span>
              {" · "}
              Academic year: <span className="font-semibold text-gray-900">{school.academicYear}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              These update automatically based on the term dates in your <Link href="/admin/calendar" className="text-meq-sky hover:underline">calendar</Link>.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Safeguarding Lead Email(s)
            </label>
            <EmailChipsInput
              name="dslEmail"
              defaultValue={school.dslEmail || ""}
              placeholder="dsl@yourschool.sch.uk"
              ariaLabel="Add a safeguarding lead email address"
            />
            <p className="text-xs text-gray-500 mt-1">
              Type each email and press <kbd className="px-1 py-0.5 rounded bg-gray-100 text-[10px] font-mono">Enter</kbd> or <kbd className="px-1 py-0.5 rounded bg-gray-100 text-[10px] font-mono">,</kbd> to add it.
              All listed addresses receive alerts, and any admin whose email matches a DSL can view and action the alerts dashboard.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Framework</label>
            <select name="frameworkId" defaultValue={school.frameworkId || ""} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none">
              <option value="">MeQ Standard (default)</option>
              {frameworks.map((fw) => (
                <option key={fw.id} value={fw.id}>
                  {fw.name} ({fw.domains.length} domains)
                </option>
              ))}
            </select>
          </div>
          <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Assessment Options</h3>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-gray-700">Reduced question mode</legend>
              <p className="text-xs text-gray-500 -mt-1">
                Shorter assessment (core questions only, no validation). Set per tier so a school
                can shorten one age group without affecting the other.
              </p>
              <label className="flex items-center gap-3">
                <input type="checkbox" id="reducedJunior" name="reducedJunior" defaultChecked={school.reducedJunior} className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky" />
                <span className="text-sm text-gray-700">Junior tier (5-7) — about 10 questions instead of 20</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" id="reducedStandard" name="reducedStandard" defaultChecked={school.reducedStandard} className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky" />
                <span className="text-sm text-gray-700">Standard tier (8-11) — about 20 questions instead of 40</span>
              </label>
            </fieldset>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="pulseEnabled" name="pulseEnabled" defaultChecked={school.pulseEnabled} className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky" />
              <label htmlFor="pulseEnabled" className="text-sm text-gray-700">
                <span className="font-medium">Pulse check-in feature</span>
                <span className="text-gray-500 block text-xs">Master switch for the pulse feature. Set the cadence (weekly / bi-weekly / monthly) and skip individual dates in the <Link href="/admin/calendar" className="text-meq-sky hover:underline">calendar</Link>.</span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="readAloudEnabled" name="readAloudEnabled" defaultChecked={school.readAloudEnabled} className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky" />
              <label htmlFor="readAloudEnabled" className="text-sm text-gray-700">
                <span className="font-medium">Auto read-aloud</span>
                <span className="text-gray-500 block text-xs">Automatically play audio for questions (when audio is available)</span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="staffWellbeingEnabled" name="staffWellbeingEnabled" defaultChecked={school.staffWellbeingEnabled} className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky" />
              <label htmlFor="staffWellbeingEnabled" className="text-sm text-gray-700">
                <span className="font-medium">Staff wellbeing</span>
                <span className="text-gray-500 block text-xs">Teachers can take wellbeing assessments. Leadership sees aggregated data only (min 5 responses).</span>
              </label>
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

      {/* School Admins */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-1">School Admins</h2>
        <p className="text-sm text-gray-500 mb-4">
          Admins can manage all classes, students, teachers, and settings for this school.
        </p>
        <AdminManager admins={admins} currentAdminId={session.adminId} authMode={school.authMode} />
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">Change Password</h2>
        <ChangePasswordForm action={changeAdminPassword} />
      </div>

      {/* Academic year rollover */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-1">Academic year rollover</h2>
        <p className="text-sm text-gray-500 mb-4">
          Move your school into a new academic year. Use this at the start of a new school year.
        </p>
        <AcademicYearRollover
          schoolName={school.name}
          currentYear={school.academicYear}
          completedThisYear={completedThisYear}
        />
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
        <Link href="/admin/settings/question-bank" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-meq-sky transition-all">
          <h3 className="font-bold text-gray-900 text-sm">Question bank</h3>
          <p className="text-xs text-gray-500 mt-1">Reusable survey questions saved by your school</p>
        </Link>
        <Link href="/admin/settings/audit-log" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-meq-sky transition-all">
          <h3 className="font-bold text-gray-900 text-sm">Audit log</h3>
          <p className="text-xs text-gray-500 mt-1">See recent destructive actions at your school</p>
        </Link>
      </div>
    </div>
  );
}
