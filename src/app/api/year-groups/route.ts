import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();

  const yearGroups = await prisma.yearGroup.findMany({
    where: { schoolId: session.schoolId },
    orderBy: { sortOrder: "asc" },
    include: { classes: { orderBy: { name: "asc" } } },
  });
  return NextResponse.json(yearGroups);
}
