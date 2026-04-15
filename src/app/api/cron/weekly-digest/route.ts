import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendSLTDigest, parseEmailList } from "@/lib/email";
import { TERM_LABELS } from "@/lib/school";

/**
 * GET /api/cron/weekly-digest
 *
 * Sends a weekly digest email to every active school's admins (and DSLs).
 * Protected by a CRON_SECRET env var — caller must send `?secret=...` or
 * an `Authorization: Bearer ...` header.
 *
 * Schedule from Railway / Vercel Cron / GitHub Actions to run weekly.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured on the server." },
      { status: 500 }
    );
  }

  const provided =
    url.searchParams.get("secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    null;

  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startOfThisWeek = startOfMonday(new Date());

  const schools = await prisma.school.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      currentTerm: true,
      academicYear: true,
      dslEmail: true,
      admins: { select: { email: true } },
    },
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const school of schools) {
    const recipients = Array.from(
      new Set(
        [
          ...school.admins.map((a) => a.email.toLowerCase()),
          ...parseEmailList(school.dslEmail),
        ].filter(Boolean)
      )
    );

    if (recipients.length === 0) {
      skipped++;
      continue;
    }

    const [totalStudents, completedThisTerm, completedScores, openAlerts, pulseThisWeek, flaggedThisWeek] =
      await Promise.all([
        prisma.student.count({ where: { schoolId: school.id } }),
        prisma.assessment.count({
          where: {
            status: "completed",
            term: school.currentTerm,
            academicYear: school.academicYear,
            student: { schoolId: school.id },
          },
        }),
        prisma.assessment.findMany({
          where: {
            status: "completed",
            term: school.currentTerm,
            academicYear: school.academicYear,
            totalScore: { not: null },
            student: { schoolId: school.id },
          },
          select: { totalScore: true },
        }),
        prisma.safeguardingAlert.count({
          where: { schoolId: school.id, status: "open" },
        }),
        prisma.pulseCheck.count({
          where: {
            completedAt: { gte: startOfThisWeek },
            student: { schoolId: school.id },
          },
        }),
        prisma.safeguardingAlert.count({
          where: {
            schoolId: school.id,
            createdAt: { gte: startOfThisWeek },
          },
        }),
      ]);

    const avg =
      completedScores.length > 0
        ? Math.round(
            (completedScores.reduce((s, a) => s + (a.totalScore ?? 0), 0) /
              completedScores.length) *
              10
          ) / 10
        : null;

    try {
      await sendSLTDigest({
        to: recipients,
        schoolName: school.name,
        termLabel: `${TERM_LABELS[school.currentTerm] ?? school.currentTerm} ${school.academicYear}`,
        stats: {
          totalStudents,
          completedThisTerm,
          avgScore: avg,
          openSafeguardingAlerts: openAlerts,
          pulseCompletedThisWeek: pulseThisWeek,
          flaggedThisWeek,
        },
      });
      sent++;
    } catch (err) {
      console.error(`[weekly-digest] Failed for school ${school.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, failed });
}

function startOfMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
