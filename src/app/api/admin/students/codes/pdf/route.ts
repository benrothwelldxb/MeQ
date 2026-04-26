import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { getAdminSession, getTeacherSession } from "@/lib/session";
import { CodesPdfDocument, type CodesPdfView, type CodesPdfStudent } from "@/lib/codes-pdf";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function makeQrDataUrl(code: string): Promise<string> {
  // Width 240 gives crisp output when the PDF embeds the image at 90-110pt.
  return QRCode.toDataURL(`${APP_URL}/?code=${encodeURIComponent(code)}`, {
    margin: 1,
    width: 240,
    color: { dark: "#1e293b", light: "#ffffff" },
  });
}

function safeFilenamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function GET(req: NextRequest) {
  // Either an admin (full school scope) or a teacher (their classes only)
  // can request a sheet. Teachers must pass classGroupId and we verify the
  // class is one they teach.
  const adminSession = await getAdminSession();
  const teacherSession = adminSession.adminId ? null : await getTeacherSession();

  let schoolId: string | undefined;
  let teacherId: string | null = null;

  if (adminSession.adminId) {
    schoolId = adminSession.schoolId;
  } else if (teacherSession?.teacherId) {
    schoolId = teacherSession.schoolId;
    teacherId = teacherSession.teacherId;
  } else {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const yearGroup = searchParams.get("yearGroup") || undefined;
  const className = searchParams.get("className") || undefined;
  const classGroupId = searchParams.get("classGroupId") || undefined;
  const viewParam = searchParams.get("view");
  const view: CodesPdfView = viewParam === "qr" ? "qr" : viewParam === "code" ? "code" : "both";

  // Teacher-scope check: must request a specific class, and that class must
  // belong to them. Admins can request any scope.
  if (teacherId) {
    if (!classGroupId) {
      return new NextResponse("Teachers must specify a classGroupId", { status: 400 });
    }
    const cls = await prisma.classGroup.findUnique({
      where: { id: classGroupId },
      select: { schoolId: true, teachers: { where: { id: teacherId }, select: { id: true } } },
    });
    if (!cls || cls.schoolId !== schoolId || cls.teachers.length === 0) {
      return new NextResponse("Class not found", { status: 404 });
    }
  }

  // Build the student filter — supports either a class ID (used by the
  // teacher class-page link) or string year/class names (used by the admin
  // codes page filters).
  const where: Record<string, unknown> = { schoolId };
  if (classGroupId) {
    where.classGroupId = classGroupId;
  } else {
    if (yearGroup) where.yearGroup = yearGroup;
    if (className) where.className = className;
  }

  const [students, school] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: [{ yearGroup: "asc" }, { className: "asc" }, { lastName: "asc" }],
    }),
    prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true },
    }),
  ]);

  if (students.length === 0) {
    return new NextResponse("No students match those filters", { status: 404 });
  }

  // Generate QRs in parallel, but skip entirely for code-only view.
  const qrByStudent = new Map<string, string>();
  if (view !== "code") {
    const qrs = await Promise.all(students.map((s) => makeQrDataUrl(s.loginCode)));
    students.forEach((s, i) => qrByStudent.set(s.id, qrs[i]));
  }

  const pdfStudents: CodesPdfStudent[] = students.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    yearGroup: s.yearGroup,
    className: s.className,
    loginCode: s.loginCode,
    qrDataUrl: qrByStudent.get(s.id),
  }));

  // Friendly filename + meta line. If filtered to one class, use that;
  // otherwise indicate scope explicitly.
  let filterLabel: string;
  let filenameScope: string;
  if (classGroupId && students.length > 0) {
    const first = students[0];
    filterLabel = `${first.yearGroup}${first.className ? ` / ${first.className}` : ""}`;
    filenameScope = safeFilenamePart(filterLabel);
  } else if (yearGroup || className) {
    filterLabel = [yearGroup, className].filter(Boolean).join(" / ");
    filenameScope = safeFilenamePart(filterLabel);
  } else {
    filterLabel = "All students";
    filenameScope = "all";
  }

  const buffer = await renderToBuffer(
    CodesPdfDocument({
      students: pdfStudents,
      view,
      schoolName: school?.name ?? "School",
      filterLabel,
    })
  );

  const filename = `meq-codes-${filenameScope}-${view}.pdf`;

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
