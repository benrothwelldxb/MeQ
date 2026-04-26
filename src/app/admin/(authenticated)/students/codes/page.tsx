import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import Link from "next/link";
import QRCode from "qrcode";
import PrintButton from "./PrintButton";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

type View = "both" | "qr" | "code";

async function makeQrDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(`${APP_URL}/?code=${encodeURIComponent(code)}`, {
    margin: 1,
    width: 200,
    color: { dark: "#1e293b", light: "#ffffff" },
  });
}

export default async function PrintCodesPage({
  searchParams,
}: {
  searchParams: { yearGroup?: string; className?: string; view?: string };
}) {
  const session = await getAdminSession();

  const view: View = searchParams.view === "qr" ? "qr" : searchParams.view === "code" ? "code" : "both";

  const where: Record<string, unknown> = { schoolId: session.schoolId };
  if (searchParams.yearGroup) where.yearGroup = searchParams.yearGroup;
  if (searchParams.className) where.className = searchParams.className;

  const students = await prisma.student.findMany({
    where,
    orderBy: [{ yearGroup: "asc" }, { className: "asc" }, { lastName: "asc" }],
  });

  // Skip QR generation if the admin asked for code-only view — saves CPU on
  // big classes where every student would otherwise get a fresh PNG.
  const qrByStudent = new Map<string, string>();
  if (view !== "code") {
    const qrCodes = await Promise.all(students.map((s) => makeQrDataUrl(s.loginCode)));
    students.forEach((s, i) => qrByStudent.set(s.id, qrCodes[i]));
  }

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

  const buildHref = (next: Partial<{ yearGroup: string; className: string; view: View }>) => {
    const params = new URLSearchParams();
    const yg = next.yearGroup ?? searchParams.yearGroup ?? "";
    const cn = next.className ?? searchParams.className ?? "";
    const v = next.view ?? view;
    if (yg) params.set("yearGroup", yg);
    if (cn) params.set("className", cn);
    if (v !== "both") params.set("view", v);
    const qs = params.toString();
    return qs ? `/admin/students/codes?${qs}` : "/admin/students/codes";
  };

  const viewLabel: Record<View, string> = {
    both: "Code + QR — full slip",
    qr: "QR only — compact, for younger classes",
    code: "Code only — saves printer ink",
  };

  // Layout: code-only fits 4 across, QR-only and both stay 3 across.
  const gridClasses =
    view === "code"
      ? "grid-cols-2 sm:grid-cols-3 print:grid-cols-4"
      : "grid-cols-2 sm:grid-cols-3 print:grid-cols-3";

  return (
    <div>
      {/* Screen-only header */}
      <div className="print:hidden">
        <Link href="/admin/students" className="text-sm text-meq-sky hover:underline">&larr; Back to Students</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-4">Print Login Codes</h1>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <form className="flex gap-3 items-center">
            {/* Preserve view selection across filter submits */}
            {view !== "both" && <input type="hidden" name="view" value={view} />}
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

        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">View:</span>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {(["both", "qr", "code"] as View[]).map((v) => (
              <Link
                key={v}
                href={buildHref({ view: v })}
                aria-pressed={view === v}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  view === v
                    ? "bg-meq-sky text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {v === "both" ? "Code + QR" : v === "qr" ? "QR only" : "Code only"}
              </Link>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          {students.length} students &middot; {viewLabel[view]}
        </p>
      </div>

      {/* Printable code slips */}
      {Object.entries(grouped).map(([groupName, groupStudents]) => (
        <div key={groupName} className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3 print:text-base">{groupName}</h2>
          <div className={`grid ${gridClasses} gap-4 print:gap-3`}>
            {groupStudents.map((student) => (
              <div
                key={student.id}
                className="border-2 border-gray-200 rounded-xl p-4 print:p-3 print:rounded-lg print:border-gray-300 break-inside-avoid"
              >
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 print:text-[10px]">
                    MeQ Login
                  </div>
                  <div className="font-bold text-gray-900 text-sm print:text-xs mb-2">
                    {student.firstName} {student.lastName}
                  </div>
                  {view !== "code" && qrByStudent.get(student.id) && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={qrByStudent.get(student.id)!}
                      alt={`QR code for ${student.firstName}`}
                      className={`mx-auto mb-2 ${view === "qr" ? "w-32 h-32 print:w-28 print:h-28" : "w-28 h-28 print:w-24 print:h-24"}`}
                    />
                  )}
                  {view !== "qr" && (
                    <div className="font-mono text-xl font-extrabold tracking-[0.15em] text-meq-sky print:text-base print:text-gray-900 bg-meq-sky-light print:bg-gray-100 rounded-lg py-1.5 px-3">
                      {student.loginCode}
                    </div>
                  )}
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
