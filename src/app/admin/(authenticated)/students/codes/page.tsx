import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import Link from "next/link";
import PrintButton from "./PrintButton";

export default async function PrintCodesPage({
  searchParams,
}: {
  searchParams: { yearGroup?: string; className?: string };
}) {
  const session = await getAdminSession();

  const where: Record<string, unknown> = { schoolId: session.schoolId };
  if (searchParams.yearGroup) where.yearGroup = searchParams.yearGroup;
  if (searchParams.className) where.className = searchParams.className;

  const students = await prisma.student.findMany({
    where,
    orderBy: [{ yearGroup: "asc" }, { className: "asc" }, { lastName: "asc" }],
  });

  // Group by class
  const grouped: Record<string, typeof students> = {};
  for (const s of students) {
    const key = `${s.yearGroup}${s.className ? ` / ${s.className}` : ""}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }

  // Get filter options
  const allStudents = await prisma.student.findMany({
    where: { schoolId: session.schoolId },
    select: { yearGroup: true, className: true },
    distinct: ["yearGroup", "className"],
    orderBy: { yearGroup: "asc" },
  });
  const yearGroups = Array.from(new Set(allStudents.map((s) => s.yearGroup)));
  const classNames = Array.from(new Set(allStudents.map((s) => s.className).filter(Boolean))) as string[];

  return (
    <div>
      {/* Screen-only header */}
      <div className="print:hidden">
        <Link href="/admin/students" className="text-sm text-meq-sky hover:underline">&larr; Back to Students</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-4">Print Login Codes</h1>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <form className="flex gap-3 items-center">
            <select name="yearGroup" defaultValue={searchParams.yearGroup || ""} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="">All Year Groups</option>
              {yearGroups.map((yg) => <option key={yg} value={yg}>{yg}</option>)}
            </select>
            <select name="className" defaultValue={searchParams.className || ""} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="">All Classes</option>
              {classNames.map((cn) => <option key={cn} value={cn}>{cn}</option>)}
            </select>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90">Filter</button>
          </form>

          <PrintButton />
        </div>

        <p className="text-sm text-gray-500 mb-6">{students.length} students</p>
      </div>

      {/* Printable code slips */}
      {Object.entries(grouped).map(([groupName, groupStudents]) => (
        <div key={groupName} className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3 print:text-base">{groupName}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 print:grid-cols-3 gap-4 print:gap-3">
            {groupStudents.map((student) => (
              <div
                key={student.id}
                className="border-2 border-gray-200 rounded-xl p-4 print:p-3 print:rounded-lg print:border-gray-300 break-inside-avoid"
              >
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 print:text-[10px]">
                    MeQ Login Code
                  </div>
                  <div className="font-bold text-gray-900 text-sm print:text-xs mb-2">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="font-mono text-2xl font-extrabold tracking-[0.15em] text-meq-sky print:text-xl print:text-gray-900 bg-meq-sky-light print:bg-gray-100 rounded-lg py-2 px-3">
                    {student.loginCode}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-2 print:text-[9px]">
                    {student.yearGroup}{student.className ? ` / ${student.className}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {students.length === 0 && (
        <p className="text-center text-gray-500 py-12">No students found for the selected filters.</p>
      )}
    </div>
  );
}
