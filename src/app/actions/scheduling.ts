"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import {
  materialisePulseDates,
  validatePulseDates,
  validateAssessmentWindow,
  describeViolation,
  type TermLike,
  type AssessmentWindowLike,
  type PulseScheduleLike,
  type Cadence,
} from "@/lib/scheduling";

type ActionResult<T = void> = (T extends void ? { success: true } : { success: true; data: T }) | { error: string };

/** Validate the actor is an admin and return their session. */
async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.adminId) throw new Error("Unauthorized");
  return session;
}

/** Load the calendar context (terms + assessment windows + pulse schedule)
 * needed to validate scheduling changes. Pulled together once per action so
 * the validators can run against current state. */
async function loadCalendarContext(schoolId: string, academicYear: string) {
  const [terms, assessmentWindows, pulseSchedule] = await Promise.all([
    prisma.term.findMany({
      where: { schoolId, academicYear },
      include: { halfTerms: true },
      orderBy: { startDate: "asc" },
    }),
    prisma.assessmentWindow.findMany({ where: { schoolId, academicYear } }),
    prisma.pulseSchedule.findFirst({ where: { schoolId, academicYear } }),
  ]);
  return { terms, assessmentWindows, pulseSchedule };
}

function toTermLike(t: { key: string; name: string; startDate: Date; endDate: Date; halfTerms: Array<{ startDate: Date; endDate: Date; label: string | null }> }): TermLike {
  return { key: t.key, name: t.name, startDate: t.startDate, endDate: t.endDate, halfTerms: t.halfTerms };
}

// =============================================================================
// Term + half-term editors
// =============================================================================

export async function updateTermDates(
  termId: string,
  startDateIso: string,
  endDateIso: string
): Promise<ActionResult> {
  const session = await requireAdmin();
  const term = await prisma.term.findUnique({ where: { id: termId } });
  if (!term || term.schoolId !== session.schoolId) return { error: "Term not found" };

  const startDate = new Date(startDateIso);
  const endDate = new Date(endDateIso);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return { error: "Invalid date" };
  if (startDate >= endDate) return { error: "End date must be after start date" };

  await prisma.term.update({
    where: { id: termId },
    data: { startDate, endDate },
  });
  await recordAudit({
    schoolId: session.schoolId,
    actorType: "admin",
    actorId: session.adminId,
    actorLabel: session.email,
    action: "term.update",
    entityType: "term",
    entityId: termId,
  });
  revalidatePath("/admin/calendar");
  return { success: true };
}

export async function addHalfTermBreak(
  termId: string,
  startDateIso: string,
  endDateIso: string,
  label?: string
): Promise<ActionResult> {
  const session = await requireAdmin();
  const term = await prisma.term.findUnique({ where: { id: termId } });
  if (!term || term.schoolId !== session.schoolId) return { error: "Term not found" };

  const startDate = new Date(startDateIso);
  const endDate = new Date(endDateIso);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return { error: "Invalid date" };
  if (startDate > endDate) return { error: "End date must be on or after start date" };
  if (startDate < term.startDate || endDate > term.endDate) {
    return { error: "Half-term break must sit inside the term's dates" };
  }

  await prisma.halfTermBreak.create({
    data: { termId, startDate, endDate, label: label?.trim() || null },
  });
  revalidatePath("/admin/calendar");
  return { success: true };
}

export async function deleteHalfTermBreak(breakId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  const ht = await prisma.halfTermBreak.findUnique({
    where: { id: breakId },
    include: { term: true },
  });
  if (!ht || ht.term.schoolId !== session.schoolId) return { error: "Break not found" };
  await prisma.halfTermBreak.delete({ where: { id: breakId } });
  revalidatePath("/admin/calendar");
  return { success: true };
}

// =============================================================================
// Assessment windows
// =============================================================================

export async function upsertAssessmentWindow(
  termKey: string,
  openAtIso: string,
  closeAtIso: string,
  academicYear: string
): Promise<ActionResult> {
  const session = await requireAdmin();
  const openAt = new Date(openAtIso);
  const closeAt = new Date(closeAtIso);
  if (isNaN(openAt.getTime()) || isNaN(closeAt.getTime())) return { error: "Invalid date" };
  if (openAt >= closeAt) return { error: "Close date must be after open date" };

  const ctx = await loadCalendarContext(session.schoolId, academicYear);
  const proposed: AssessmentWindowLike = { termKey, openAt, closeAt };
  const violations = validateAssessmentWindow(proposed, ctx.terms.map(toTermLike));
  if (violations.length > 0) {
    return { error: violations.map(describeViolation).join(" ") };
  }

  await prisma.assessmentWindow.upsert({
    where: { schoolId_academicYear_termKey: { schoolId: session.schoolId, academicYear, termKey } },
    update: { openAt, closeAt },
    create: { schoolId: session.schoolId, academicYear, termKey, openAt, closeAt },
  });
  await recordAudit({
    schoolId: session.schoolId,
    actorType: "admin",
    actorId: session.adminId,
    actorLabel: session.email,
    action: "assessment_window.upsert",
    entityType: "assessment_window",
    meta: { termKey, openAt: openAt.toISOString(), closeAt: closeAt.toISOString() },
  });
  revalidatePath("/admin/calendar");
  return { success: true };
}

export async function deleteAssessmentWindow(termKey: string, academicYear: string): Promise<ActionResult> {
  const session = await requireAdmin();
  await prisma.assessmentWindow.deleteMany({
    where: { schoolId: session.schoolId, academicYear, termKey },
  });
  revalidatePath("/admin/calendar");
  return { success: true };
}

// =============================================================================
// Pulse schedule
// =============================================================================

const VALID_CADENCES: Cadence[] = ["weekly", "biweekly", "monthly", "custom"];

export async function upsertPulseSchedule(params: {
  academicYear: string;
  cadence: string;
  dayOfWeek: number;
  startDate: string;
  endDate: string | null;
  active: boolean;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!VALID_CADENCES.includes(params.cadence as Cadence)) {
    return { error: "Invalid cadence" };
  }
  if (params.dayOfWeek < 1 || params.dayOfWeek > 7) {
    return { error: "Day of week must be Monday (1) through Sunday (7)" };
  }
  const startDate = new Date(params.startDate);
  const endDate = params.endDate ? new Date(params.endDate) : null;
  if (isNaN(startDate.getTime())) return { error: "Invalid start date" };
  if (endDate && (isNaN(endDate.getTime()) || endDate <= startDate)) {
    return { error: "End date must be after start date" };
  }

  // Pre-flight: would this schedule generate dates that violate the rules?
  const ctx = await loadCalendarContext(session.schoolId, params.academicYear);
  if (endDate) {
    const proposed: PulseScheduleLike = {
      cadence: params.cadence as Cadence,
      dayOfWeek: params.dayOfWeek,
      startDate,
      endDate,
    };
    const dates = materialisePulseDates(proposed, ctx.terms.map(toTermLike), ctx.assessmentWindows);
    const violations = validatePulseDates(dates, ctx.terms.map(toTermLike), ctx.assessmentWindows);
    // The materialiser already filters out skipped windows; if the validator
    // still flags anything it's a bug, so surface it loudly rather than
    // silently saving.
    if (violations.length > 0) {
      return { error: violations.map(describeViolation).join(" ") };
    }
  }

  await prisma.pulseSchedule.upsert({
    where: { schoolId_academicYear: { schoolId: session.schoolId, academicYear: params.academicYear } },
    update: {
      cadence: params.cadence,
      dayOfWeek: params.dayOfWeek,
      startDate,
      endDate,
      active: params.active,
    },
    create: {
      schoolId: session.schoolId,
      academicYear: params.academicYear,
      cadence: params.cadence,
      dayOfWeek: params.dayOfWeek,
      startDate,
      endDate,
      active: params.active,
    },
  });
  await recordAudit({
    schoolId: session.schoolId,
    actorType: "admin",
    actorId: session.adminId,
    actorLabel: session.email,
    action: "pulse_schedule.upsert",
    entityType: "pulse_schedule",
    meta: { cadence: params.cadence, dayOfWeek: params.dayOfWeek, active: params.active },
  });
  revalidatePath("/admin/calendar");
  return { success: true };
}

// =============================================================================
// Per-occurrence overrides
// =============================================================================

export async function skipPulseOccurrence(
  scheduleId: string,
  dateIso: string,
  reason?: string
): Promise<ActionResult> {
  const session = await requireAdmin();
  const schedule = await prisma.pulseSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule || schedule.schoolId !== session.schoolId) return { error: "Schedule not found" };

  const date = new Date(dateIso);
  if (isNaN(date.getTime())) return { error: "Invalid date" };

  await prisma.pulseOccurrence.upsert({
    where: { scheduleId_date: { scheduleId, date } },
    update: { status: "skipped", skipReason: reason?.trim() || null },
    create: { scheduleId, date, status: "skipped", skipReason: reason?.trim() || null },
  });
  revalidatePath("/admin/calendar");
  return { success: true };
}

export async function unskipPulseOccurrence(
  scheduleId: string,
  dateIso: string
): Promise<ActionResult> {
  const session = await requireAdmin();
  const schedule = await prisma.pulseSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule || schedule.schoolId !== session.schoolId) return { error: "Schedule not found" };

  const date = new Date(dateIso);
  await prisma.pulseOccurrence.deleteMany({
    where: { scheduleId, date, status: "skipped" },
  });
  revalidatePath("/admin/calendar");
  return { success: true };
}

export async function addAdHocPulse(
  scheduleId: string,
  dateIso: string
): Promise<ActionResult> {
  const session = await requireAdmin();
  const schedule = await prisma.pulseSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule || schedule.schoolId !== session.schoolId) return { error: "Schedule not found" };

  const date = new Date(dateIso);
  if (isNaN(date.getTime())) return { error: "Invalid date" };

  // Validate against current calendar state — same hard-block rules as the
  // recurring schedule.
  const ctx = await loadCalendarContext(session.schoolId, schedule.academicYear);
  const violations = validatePulseDates(
    [date],
    ctx.terms.map(toTermLike),
    ctx.assessmentWindows
  );
  if (violations.length > 0) {
    return { error: violations.map(describeViolation).join(" ") };
  }

  await prisma.pulseOccurrence.upsert({
    where: { scheduleId_date: { scheduleId, date } },
    update: { status: "ad_hoc", skipReason: null },
    create: { scheduleId, date, status: "ad_hoc" },
  });
  revalidatePath("/admin/calendar");
  return { success: true };
}

export async function removeAdHocPulse(
  scheduleId: string,
  dateIso: string
): Promise<ActionResult> {
  const session = await requireAdmin();
  const schedule = await prisma.pulseSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule || schedule.schoolId !== session.schoolId) return { error: "Schedule not found" };

  const date = new Date(dateIso);
  await prisma.pulseOccurrence.deleteMany({
    where: { scheduleId, date, status: "ad_hoc" },
  });
  revalidatePath("/admin/calendar");
  return { success: true };
}
