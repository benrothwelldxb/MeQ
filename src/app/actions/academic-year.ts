"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { nextAcademicYear } from "@/lib/academic-year";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

/** Shift a date by exactly one year (preserves day-of-month). Used when
 * cloning the previous calendar — admins refine afterwards if they want to
 * align days-of-week. */
function addYear(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear() + 1, d.getUTCMonth(), d.getUTCDate()));
}

export async function rolloverAcademicYear(
  _prev: { error?: string; success?: boolean; newYear?: string } | null,
  formData: FormData
) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized." };

  const confirmation = (formData.get("confirmation") as string)?.trim();
  const requestedYear = ((formData.get("academicYear") as string) || "").trim();

  const school = await prisma.school.findUnique({
    where: { id: session.schoolId },
    select: { academicYear: true, name: true },
  });
  if (!school) return { error: "School not found." };

  const expected = `ROLL OVER ${school.name.toUpperCase()}`;
  if (confirmation !== expected) {
    return {
      error: `Type "${expected}" exactly to confirm. This is to prevent accidental rollovers.`,
    };
  }

  const target = requestedYear || nextAcademicYear(school.academicYear);

  if (target === school.academicYear) {
    return { error: "New academic year matches the current one." };
  }

  // Bump the school year + reset to term1 (calendar then takes over).
  await prisma.school.update({
    where: { id: session.schoolId },
    data: { academicYear: target, currentTerm: "term1" },
  });

  // Calendar duplication: clone last year's terms / half-terms / assessment
  // windows / pulse schedule into the new academic year, shifted by one year.
  // We do this only if (a) the source year actually has a calendar and (b)
  // the target year doesn't already (avoid clobbering manual setup).
  const [sourceTerms, targetExisting] = await Promise.all([
    prisma.term.findMany({
      where: { schoolId: session.schoolId, academicYear: school.academicYear },
      include: { halfTerms: true },
    }),
    prisma.term.count({ where: { schoolId: session.schoolId, academicYear: target } }),
  ]);

  let cloned = false;
  if (sourceTerms.length > 0 && targetExisting === 0) {
    cloned = true;

    // Terms + their half-terms
    for (const t of sourceTerms) {
      const newTerm = await prisma.term.create({
        data: {
          schoolId: session.schoolId,
          academicYear: target,
          key: t.key,
          name: t.name,
          startDate: addYear(t.startDate),
          endDate: addYear(t.endDate),
          sortOrder: t.sortOrder,
          halfTerms: {
            create: t.halfTerms.map((h) => ({
              startDate: addYear(h.startDate),
              endDate: addYear(h.endDate),
              label: h.label,
            })),
          },
        },
      });
      void newTerm;
    }

    // Assessment windows
    const sourceWindows = await prisma.assessmentWindow.findMany({
      where: { schoolId: session.schoolId, academicYear: school.academicYear },
    });
    if (sourceWindows.length > 0) {
      await prisma.assessmentWindow.createMany({
        data: sourceWindows.map((w) => ({
          schoolId: session.schoolId,
          academicYear: target,
          termKey: w.termKey,
          openAt: addYear(w.openAt),
          closeAt: addYear(w.closeAt),
        })),
      });
    }

    // Pulse schedule (and reset its overrides — last year's skips don't apply
    // to the new year; admins can re-skip if needed)
    const sourceSchedule = await prisma.pulseSchedule.findFirst({
      where: { schoolId: session.schoolId, academicYear: school.academicYear },
    });
    if (sourceSchedule) {
      await prisma.pulseSchedule.create({
        data: {
          schoolId: session.schoolId,
          academicYear: target,
          cadence: sourceSchedule.cadence,
          dayOfWeek: sourceSchedule.dayOfWeek,
          startDate: addYear(sourceSchedule.startDate),
          endDate: sourceSchedule.endDate ? addYear(sourceSchedule.endDate) : null,
          active: sourceSchedule.active,
        },
      });
    }

    // Note: custom surveys are NOT auto-cloned on rollover. Admins use the
    // "Duplicate" button on individual surveys when they want to repeat one,
    // so they don't end up with a draft pile they have to clean up.
  }

  await recordAudit({
    schoolId: session.schoolId,
    actorType: "admin",
    actorId: session.adminId,
    actorLabel: session.email,
    action: "academic_year.rollover",
    entityType: "school",
    entityId: session.schoolId,
    meta: { from: school.academicYear, to: target, calendarCloned: cloned },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/calendar");
  return { success: true, newYear: target };
}
