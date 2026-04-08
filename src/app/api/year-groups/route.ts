import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const yearGroups = await prisma.yearGroup.findMany({
    orderBy: { sortOrder: "asc" },
    include: { classes: { orderBy: { name: "asc" } } },
  });
  return NextResponse.json(yearGroups);
}
