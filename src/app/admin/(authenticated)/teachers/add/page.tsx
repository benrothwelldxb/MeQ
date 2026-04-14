import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { createTeacher } from "@/app/actions/teachers";
import { redirect } from "next/navigation";
import Link from "next/link";
import TeacherTagsPicker from "@/components/admin/TeacherTagsPicker";

export default async function AddTeacherPage() {
  const session = await getAdminSession();

  const yearGroups = await prisma.yearGroup.findMany({
    where: { schoolId: session.schoolId },
    orderBy: { sortOrder: "asc" },
    include: { classes: { orderBy: { name: "asc" } } },
  });

  async function handleSubmit(formData: FormData) {
    "use server";
    const result = await createTeacher(formData);
    if (result.success) redirect("/admin/teachers");
  }

  return (
    <div className="max-w-md">
      <Link href="/admin/teachers" className="text-sm text-meq-sky hover:underline">&larr; Back to Teachers</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Add Teacher</h1>

      <form action={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input name="firstName" required className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input name="lastName" required className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input name="email" type="email" required className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input name="password" type="password" minLength={6} placeholder="Leave blank for Google SSO login" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none placeholder:text-gray-400" />
          <p className="text-xs text-gray-400 mt-1">Leave blank if the teacher will sign in with Google SSO</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role tags</label>
          <TeacherTagsPicker />
          <p className="text-xs text-gray-400 mt-1">Pick one or more. Used to identify roles within school.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Classes</label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {yearGroups.flatMap((yg) =>
              yg.classes.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="classGroupIds" value={c.id} className="rounded border-gray-300 text-meq-sky focus:ring-meq-sky" />
                  {yg.name} — {c.name}
                </label>
              ))
            )}
            {yearGroups.every((yg) => yg.classes.length === 0) && (
              <p className="text-xs text-gray-400">No classes set up yet. Add classes in Settings first.</p>
            )}
          </div>
        </div>

        <button type="submit" className="w-full py-3 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all">
          Create Teacher
        </button>
      </form>
    </div>
  );
}
