import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { DOMAIN_LABELS, type Domain } from "@/lib/constants";
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

  const assessments = await prisma.assessment.findMany({
    where: {
      status: "completed",
      ...(term ? { term } : {}),
      ...(academicYear ? { academicYear } : {}),
    },
    include: { student: true },
    orderBy: [{ student: { yearGroup: "asc" } }, { student: { lastName: "asc" } }],
  });

  const headers = [
    "First Name",
    "Last Name",
    "Year Group",
    "Class",
    "Tier",
    "Term",
    "Academic Year",
    DOMAIN_LABELS.KnowMe,
    `${DOMAIN_LABELS.KnowMe} Level`,
    DOMAIN_LABELS.ManageMe,
    `${DOMAIN_LABELS.ManageMe} Level`,
    DOMAIN_LABELS.UnderstandOthers,
    `${DOMAIN_LABELS.UnderstandOthers} Level`,
    DOMAIN_LABELS.WorkWithOthers,
    `${DOMAIN_LABELS.WorkWithOthers} Level`,
    DOMAIN_LABELS.ChooseWell,
    `${DOMAIN_LABELS.ChooseWell} Level`,
    "Total Score",
    "Overall Level",
    "Reliability",
    "Completed",
  ];

  const rows = assessments.map((a) => [
    a.student.firstName,
    a.student.lastName,
    a.student.yearGroup,
    a.student.className || "",
    a.student.tier,
    a.term.replace("term", "Term "),
    a.academicYear,
    a.knowMeScore ?? "",
    a.knowMeLevel ?? "",
    a.manageMeScore ?? "",
    a.manageMeLevel ?? "",
    a.understandOthersScore ?? "",
    a.understandOthersLevel ?? "",
    a.workWithOthersScore ?? "",
    a.workWithOthersLevel ?? "",
    a.chooseWellScore ?? "",
    a.chooseWellLevel ?? "",
    a.totalScore ?? "",
    a.overallLevel ?? "",
    a.reliabilityScore ?? "",
    a.completedAt ? new Date(a.completedAt).toISOString().split("T")[0] : "",
  ]);

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
