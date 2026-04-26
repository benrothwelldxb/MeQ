import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings } from "@/lib/school";
import {
  materialisePulseDates,
  applyPulseOverrides,
  type TermLike,
  type AssessmentWindowLike,
  type PulseScheduleLike,
} from "@/lib/scheduling";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string };
}) {
  const session = await getAdminSession();
  const school = await getSchoolSettings(session.schoolId);

  const today = new Date();
  const year = parseInt(searchParams.year ?? "") || today.getUTCFullYear();
  const monthFromParam = parseInt(searchParams.month ?? "");
  const monthZero = isNaN(monthFromParam) ? today.getUTCMonth() : monthFromParam - 1;

  const [terms, assessmentWindows, pulseSchedule, surveys] = await Promise.all([
    prisma.term.findMany({
      where: { schoolId: session.schoolId, academicYear: school.academicYear },
      include: { halfTerms: true },
      orderBy: { startDate: "asc" },
    }),
    prisma.assessmentWindow.findMany({
      where: { schoolId: session.schoolId, academicYear: school.academicYear },
    }),
    prisma.pulseSchedule.findFirst({
      where: { schoolId: session.schoolId, academicYear: school.academicYear },
      include: { occurrences: true },
    }),
    prisma.survey.findMany({
      where: { schoolId: session.schoolId },
      select: { id: true, title: true, status: true, openAt: true, closeAt: true },
    }),
  ]);

  // Pre-compute the pulse dates server-side so the client doesn't have to
  // re-implement the materialisation logic. Falls back to empty when no
  // schedule exists.
  let pulseDates: Date[] = [];
  if (pulseSchedule) {
    const termInputs: TermLike[] = terms.map((t) => ({
      key: t.key, name: t.name, startDate: t.startDate, endDate: t.endDate,
      halfTerms: t.halfTerms.map((h) => ({ startDate: h.startDate, endDate: h.endDate, label: h.label })),
    }));
    const awInputs: AssessmentWindowLike[] = assessmentWindows.map((aw) => ({
      termKey: aw.termKey, openAt: aw.openAt, closeAt: aw.closeAt,
    }));
    const scheduleInput: PulseScheduleLike = {
      cadence: pulseSchedule.cadence as PulseScheduleLike["cadence"],
      dayOfWeek: pulseSchedule.dayOfWeek,
      startDate: pulseSchedule.startDate,
      endDate: pulseSchedule.endDate,
    };
    const generated = materialisePulseDates(scheduleInput, termInputs, awInputs);
    pulseDates = applyPulseOverrides(
      generated,
      pulseSchedule.occurrences.map((o) => ({ date: o.date, status: o.status as "scheduled" | "skipped" | "ad_hoc", skipReason: o.skipReason })),
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-500 mt-1">
          Term dates, full-survey windows, pulse cadence, and custom surveys for {school.academicYear}.
        </p>
      </div>

      <CalendarClient
        academicYear={school.academicYear}
        terms={terms.map((t) => ({
          id: t.id, key: t.key, name: t.name,
          startDate: t.startDate.toISOString(),
          endDate: t.endDate.toISOString(),
          halfTerms: t.halfTerms.map((h) => ({
            id: h.id, startDate: h.startDate.toISOString(), endDate: h.endDate.toISOString(), label: h.label,
          })),
        }))}
        assessmentWindows={assessmentWindows.map((aw) => ({
          id: aw.id, termKey: aw.termKey,
          openAt: aw.openAt.toISOString(), closeAt: aw.closeAt.toISOString(),
        }))}
        pulseSchedule={pulseSchedule ? {
          id: pulseSchedule.id,
          cadence: pulseSchedule.cadence as "weekly" | "biweekly" | "monthly" | "custom",
          dayOfWeek: pulseSchedule.dayOfWeek,
          startDate: pulseSchedule.startDate.toISOString(),
          endDate: pulseSchedule.endDate?.toISOString() ?? null,
          active: pulseSchedule.active,
          occurrences: pulseSchedule.occurrences.map((o) => ({
            date: o.date.toISOString(),
            status: o.status as "scheduled" | "skipped" | "ad_hoc",
          })),
        } : null}
        surveys={surveys.map((s) => ({
          id: s.id, title: s.title, status: s.status,
          openAt: s.openAt?.toISOString() ?? null, closeAt: s.closeAt?.toISOString() ?? null,
        }))}
        pulseDates={pulseDates.map((d) => d.toISOString())}
        initialYear={year}
        initialMonth={monthZero}
      />
    </div>
  );
}
