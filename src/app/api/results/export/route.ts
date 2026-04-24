import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolFramework } from "@/lib/framework";
import { parseNumberRecord, parseStringRecord } from "@/lib/json";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session.adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term") || undefined;
  const academicYear = searchParams.get("academicYear") || undefined;

  const framework = await getSchoolFramework(session.schoolId);

  const assessments = await prisma.assessment.findMany({
    where: {
      status: "completed",
      ...(term ? { term } : {}),
      ...(academicYear ? { academicYear } : {}),
      student: { schoolId: session.schoolId },
    },
    include: { student: true },
    orderBy: [{ student: { yearGroup: "asc" } }, { student: { lastName: "asc" } }],
  });

  // Build headers dynamically from the school's framework domains
  const domainHeaders = framework.domains.flatMap((d) => [d.label, `${d.label} Level`]);
  const headers = [
    "First Name",
    "Last Name",
    "Year Group",
    "Class",
    "Tier",
    "Term",
    "Academic Year",
    ...domainHeaders,
    "Total Score",
    "Overall Level",
    "Reliability",
    "Completed",
  ];

  const rows = assessments.map((a) => {
    const scores = parseNumberRecord(a.domainScoresJson);
    const levels = parseStringRecord(a.domainLevelsJson);
    const domainCells = framework.domains.flatMap((d) => [
      scores[d.key] ?? "",
      levels[d.key] ?? "",
    ]);
    return [
      a.student.firstName,
      a.student.lastName,
      a.student.yearGroup,
      a.student.className || "",
      a.student.tier,
      a.term.replace("term", "Term "),
      a.academicYear,
      ...domainCells,
      a.totalScore ?? "",
      a.overallLevel ?? "",
      a.reliabilityScore ?? "",
      a.completedAt ? new Date(a.completedAt).toISOString().split("T")[0] : "",
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => {
        const str = String(cell);
        return str.includes(",") || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    ),
  ].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="meq-results-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
