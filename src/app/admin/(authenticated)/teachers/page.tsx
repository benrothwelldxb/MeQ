import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import Link from "next/link";
import TeacherActions from "./TeacherActions";
import TeacherClassesCell from "./TeacherClassesCell";
import TeacherTagsCell from "./TeacherTagsCell";
import { parseTags } from "@/lib/teacher-tags";

function formatRelative(date: Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default async function TeachersPage() {
  const session = await getAdminSession();

  const teachers = await prisma.teacher.findMany({
    where: { schoolId: session.schoolId },
    orderBy: { lastName: "asc" },
    include: {
      classes: { include: { yearGroup: true } },
    },
  });

  const allClassGroups = await prisma.classGroup.findMany({
    where: { schoolId: session.schoolId },
    include: { yearGroup: { select: { id: true, name: true, sortOrder: true } } },
    orderBy: [{ yearGroup: { sortOrder: "asc" } }, { name: "asc" }],
  });
  const classOptions = allClassGroups.map((c) => ({
    id: c.id,
    name: c.name,
    yearGroupId: c.yearGroup.id,
    yearGroupName: c.yearGroup.name,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-500 mt-1">{teachers.length} teachers</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/teachers/add" className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all">
            Add Teacher
          </Link>
          <Link href="/admin/teachers/upload" className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all">
            Upload CSV
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tags</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Classes</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {teachers.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{t.firstName} {t.lastName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{t.email}</td>
                <td className="px-6 py-4">
                  <TeacherTagsCell
                    teacherId={t.id}
                    teacherName={`${t.firstName} ${t.lastName}`}
                    currentTags={parseTags(t.tags)}
                  />
                </td>
                <td className="px-6 py-4">
                  <TeacherClassesCell
                    teacherId={t.id}
                    teacherName={`${t.firstName} ${t.lastName}`}
                    assignedIds={t.classes.map((c) => c.id)}
                    assignedLabels={t.classes.map((c) => ({ id: c.id, label: `${c.yearGroup.name} — ${c.name}` }))}
                    allClasses={classOptions}
                  />
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {t.lastLoginAt ? formatRelative(t.lastLoginAt) : <span className="text-gray-400">Never</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <TeacherActions
                    teacherId={t.id}
                    teacherName={`${t.firstName} ${t.lastName}`}
                    firstName={t.firstName}
                    lastName={t.lastName}
                    email={t.email}
                  />
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No teachers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
