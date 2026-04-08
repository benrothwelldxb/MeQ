import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { updateStudent } from "@/app/actions/students";
import Link from "next/link";

export default async function EditStudentPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAdminSession();

  const student = await prisma.student.findUnique({ where: { id: params.id } });
  if (!student) return notFound();

  const yearGroups = await prisma.yearGroup.findMany({
    where: { schoolId: session.schoolId },
    orderBy: { sortOrder: "asc" },
    include: { classes: { orderBy: { name: "asc" } } },
  });

  async function handleSubmit(formData: FormData) {
    "use server";
    const result = await updateStudent(params.id, formData);
    if (result.success) redirect("/admin/students");
  }

  return (
    <div className="max-w-md">
      <Link href="/admin/students" className="text-sm text-meq-sky hover:underline">&larr; Back to Students</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">
        Edit {student.firstName} {student.lastName}
      </h1>

      <form action={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input name="firstName" defaultValue={student.firstName} required className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input name="lastName" defaultValue={student.lastName} required className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input name="displayName" defaultValue={student.displayName || ""} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year Group *</label>
          <select name="yearGroupId" defaultValue={student.yearGroupId || ""} required className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none">
            <option value="">Select year group</option>
            {yearGroups.map((yg) => (
              <option key={yg.id} value={yg.id}>{yg.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <select name="classGroupId" defaultValue={student.classGroupId || ""} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none">
            <option value="">No class</option>
            {yearGroups.flatMap((yg) =>
              yg.classes.map((c) => (
                <option key={c.id} value={c.id}>{yg.name} — {c.name}</option>
              ))
            )}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="sen" name="sen" defaultChecked={student.sen} className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky" />
          <label htmlFor="sen" className="text-sm font-medium text-gray-700">SEN (Special Educational Needs)</label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">School ID</label>
          <input name="schoolUuid" defaultValue={student.schoolUuid || ""} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none" />
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Login Code</p>
          <p className="font-mono font-bold text-lg tracking-wider text-gray-900">{student.loginCode}</p>
        </div>

        <button type="submit" className="w-full py-3 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all">
          Save Changes
        </button>
      </form>
    </div>
  );
}
