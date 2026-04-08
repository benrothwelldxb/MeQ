import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import Link from "next/link";
import { deleteTeacher } from "@/app/actions/teachers";

export default async function TeachersPage() {
  const session = await getAdminSession();

  const teachers = await prisma.teacher.findMany({
    where: { schoolId: session.schoolId },
    orderBy: { lastName: "asc" },
    include: {
      classes: { include: { yearGroup: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-500 mt-1">{teachers.length} teachers</p>
        </div>
        <Link href="/admin/teachers/add" className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all">
          Add Teacher
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Classes</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {teachers.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{t.firstName} {t.lastName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{t.email}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {t.classes.map((c) => (
                      <span key={c.id} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {c.yearGroup.name} — {c.name}
                      </span>
                    ))}
                    {t.classes.length === 0 && <span className="text-xs text-gray-400">None</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <form action={async () => { "use server"; await deleteTeacher(t.id); }}>
                    <button type="submit" className="text-xs text-gray-400 hover:text-red-600">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No teachers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
