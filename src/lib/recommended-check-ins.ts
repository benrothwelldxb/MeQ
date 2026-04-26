import { prisma } from "./db";
import { parseNumberRecord } from "./json";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface RecommendedCheckIn {
  studentId: string;
  studentName: string;
  yearGroup: string;
  className: string | null;
  reason: string;
  severity: "high" | "medium";
  source: "pulse" | "alert";
}

/**
 * Surfaces students who'd benefit from a proactive teacher conversation this
 * week. Pulled from two signals:
 *   1. Open SafeguardingAlert (always high severity)
 *   2. This week's pulse with one or more domain scores at 1 or 2 (medium)
 *
 * Filters by `studentIds` (the cohort the caller is responsible for — usually
 * a teacher's class students). Returns at most one row per student.
 */
export async function getRecommendedCheckIns(
  schoolId: string,
  studentIds: string[]
): Promise<RecommendedCheckIn[]> {
  if (studentIds.length === 0) return [];

  const thisMonday = getMonday(new Date());

  const [students, openAlerts, thisWeekPulses] = await Promise.all([
    prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, firstName: true, lastName: true, yearGroup: true, className: true },
    }),
    prisma.safeguardingAlert.findMany({
      where: { schoolId, status: "open", studentId: { in: studentIds } },
      select: { studentId: true, flagReason: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pulseCheck.findMany({
      where: {
        studentId: { in: studentIds },
        weekOf: thisMonday,
        completedAt: { not: null },
      },
      select: { studentId: true, answers: true },
    }),
  ]);

  const studentMap = new Map(students.map((s) => [s.id, s]));
  const seen = new Set<string>();
  const results: RecommendedCheckIn[] = [];

  // 1) Safeguarding alerts (high)
  for (const alert of openAlerts) {
    if (!alert.studentId || seen.has(alert.studentId)) continue;
    const s = studentMap.get(alert.studentId);
    if (!s) continue;
    seen.add(alert.studentId);
    results.push({
      studentId: s.id,
      studentName: `${s.firstName} ${s.lastName}`,
      yearGroup: s.yearGroup,
      className: s.className,
      reason: alert.flagReason,
      severity: "high",
      source: "alert",
    });
  }

  // 2) Low pulse scores this week (medium)
  for (const pulse of thisWeekPulses) {
    if (seen.has(pulse.studentId)) continue;
    const answers = parseNumberRecord(pulse.answers);
    const lows = Object.entries(answers).filter(([, v]) => v <= 2);
    if (lows.length === 0) continue;
    const s = studentMap.get(pulse.studentId);
    if (!s) continue;
    seen.add(pulse.studentId);
    results.push({
      studentId: s.id,
      studentName: `${s.firstName} ${s.lastName}`,
      yearGroup: s.yearGroup,
      className: s.className,
      reason: `Low pulse this week — ${lows.map(([d, v]) => `${d} (${v})`).join(", ")}`,
      severity: "medium",
      source: "pulse",
    });
  }

  // High first, then medium
  results.sort((a, b) => (a.severity === "high" ? 0 : 1) - (b.severity === "high" ? 0 : 1));
  return results;
}
