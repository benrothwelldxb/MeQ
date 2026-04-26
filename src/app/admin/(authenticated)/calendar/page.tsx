import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings } from "@/lib/school";
import Link from "next/link";
import {
  materialisePulseDates,
  type TermLike,
  type AssessmentWindowLike,
  type PulseScheduleLike,
} from "@/lib/scheduling";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function isSameDayUTC(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear()
    && a.getUTCMonth() === b.getUTCMonth()
    && a.getUTCDate() === b.getUTCDate();
}

function isWithinUTC(d: Date, start: Date, end: Date): boolean {
  const t = startOfDayUTC(d).getTime();
  return t >= startOfDayUTC(start).getTime() && t <= startOfDayUTC(end).getTime();
}

interface DayEvent {
  type: "term-start" | "term-end" | "half-term" | "assessment" | "pulse" | "survey";
  label: string;
  href?: string;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string };
}) {
  const session = await getAdminSession();
  const school = await getSchoolSettings(session.schoolId);

  const today = new Date();
  const todayUTC = startOfDayUTC(today);
  const year = parseInt(searchParams.year ?? "") || todayUTC.getUTCFullYear();
  const monthFromParam = parseInt(searchParams.month ?? "");
  const monthZero = isNaN(monthFromParam) ? todayUTC.getUTCMonth() : monthFromParam - 1;

  const monthStart = new Date(Date.UTC(year, monthZero, 1));
  const monthEnd = new Date(Date.UTC(year, monthZero + 1, 0));

  // Load all calendar entities for this school's current academic year.
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
      where: { schoolId: session.schoolId, academicYear: school.academicYear, active: true },
      include: { occurrences: true },
    }),
    prisma.survey.findMany({
      where: {
        schoolId: session.schoolId,
        OR: [
          { openAt: { lte: monthEnd }, closeAt: { gte: monthStart } },
          { openAt: { gte: monthStart, lte: monthEnd } },
          { closeAt: { gte: monthStart, lte: monthEnd } },
        ],
      },
      select: { id: true, title: true, status: true, openAt: true, closeAt: true, createdAt: true },
    }),
  ]);

  // Materialise the pulse dates for the visible month so they render even
  // before Phase 2 persists them. If overrides exist (e.g. from manual
  // ad-hoc entries in Phase 2), they're already in the occurrences array
  // and take priority.
  const termInputs: TermLike[] = terms.map((t) => ({
    key: t.key,
    name: t.name,
    startDate: t.startDate,
    endDate: t.endDate,
    halfTerms: t.halfTerms.map((h) => ({ startDate: h.startDate, endDate: h.endDate, label: h.label })),
  }));
  const awInputs: AssessmentWindowLike[] = assessmentWindows.map((aw) => ({
    termKey: aw.termKey, openAt: aw.openAt, closeAt: aw.closeAt,
  }));
  let pulseDates: Date[] = [];
  if (pulseSchedule) {
    const scheduleInput: PulseScheduleLike = {
      cadence: pulseSchedule.cadence as PulseScheduleLike["cadence"],
      dayOfWeek: pulseSchedule.dayOfWeek,
      startDate: pulseSchedule.startDate,
      endDate: pulseSchedule.endDate,
    };
    const generated = materialisePulseDates(scheduleInput, termInputs, awInputs);
    const skips = new Set(
      pulseSchedule.occurrences.filter((o) => o.status === "skipped").map((o) => startOfDayUTC(o.date).toISOString())
    );
    const adHoc = pulseSchedule.occurrences.filter((o) => o.status === "ad_hoc").map((o) => startOfDayUTC(o.date));
    const merged = [...generated.filter((d) => !skips.has(startOfDayUTC(d).toISOString())), ...adHoc];
    const seen = new Set<string>();
    pulseDates = merged.sort((a, b) => a.getTime() - b.getTime()).filter((d) => {
      const k = startOfDayUTC(d).toISOString();
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
  }

  // Build day-cell events for the visible month
  const firstDayOfWeek = (monthStart.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  const daysInMonth = monthEnd.getUTCDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let dnum = 1; dnum <= daysInMonth; dnum++) cells.push(new Date(Date.UTC(year, monthZero, dnum)));
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsByDay = new Map<string, DayEvent[]>();
  const pushEvent = (date: Date, ev: DayEvent) => {
    const key = startOfDayUTC(date).toISOString();
    const list = eventsByDay.get(key) ?? [];
    list.push(ev);
    eventsByDay.set(key, list);
  };

  for (const term of terms) {
    if (isWithinUTC(term.startDate, monthStart, monthEnd)) {
      pushEvent(term.startDate, { type: "term-start", label: `${term.name} starts` });
    }
    if (isWithinUTC(term.endDate, monthStart, monthEnd)) {
      pushEvent(term.endDate, { type: "term-end", label: `${term.name} ends` });
    }
    for (const ht of term.halfTerms) {
      // Mark every day in the half-term span that falls in this month
      const cur = new Date(ht.startDate);
      while (cur.getTime() <= ht.endDate.getTime()) {
        if (isWithinUTC(cur, monthStart, monthEnd)) {
          pushEvent(cur, { type: "half-term", label: ht.label ?? "Half-term" });
        }
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }
  }
  for (const aw of assessmentWindows) {
    const cur = new Date(aw.openAt);
    while (cur.getTime() <= aw.closeAt.getTime()) {
      if (isWithinUTC(cur, monthStart, monthEnd)) {
        pushEvent(cur, { type: "assessment", label: `Full survey (${aw.termKey})` });
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  }
  for (const pd of pulseDates) {
    if (isWithinUTC(pd, monthStart, monthEnd)) {
      pushEvent(pd, { type: "pulse", label: "Pulse" });
    }
  }
  for (const s of surveys) {
    if (s.openAt && isWithinUTC(s.openAt, monthStart, monthEnd)) {
      pushEvent(s.openAt, { type: "survey", label: `${s.title} opens`, href: `/admin/surveys/${s.id}` });
    }
    if (s.closeAt && isWithinUTC(s.closeAt, monthStart, monthEnd)) {
      pushEvent(s.closeAt, { type: "survey", label: `${s.title} closes`, href: `/admin/surveys/${s.id}` });
    }
  }

  const prevMonthDate = new Date(Date.UTC(year, monthZero - 1, 1));
  const nextMonthDate = new Date(Date.UTC(year, monthZero + 1, 1));
  const prevHref = `/admin/calendar?year=${prevMonthDate.getUTCFullYear()}&month=${prevMonthDate.getUTCMonth() + 1}`;
  const nextHref = `/admin/calendar?year=${nextMonthDate.getUTCFullYear()}&month=${nextMonthDate.getUTCMonth() + 1}`;
  const todayHref = `/admin/calendar?year=${todayUTC.getUTCFullYear()}&month=${todayUTC.getUTCMonth() + 1}`;

  const eventTypeStyles: Record<DayEvent["type"], string> = {
    "term-start": "bg-slate-200 text-slate-800 border-slate-300",
    "term-end": "bg-slate-200 text-slate-800 border-slate-300",
    "half-term": "bg-gray-100 text-gray-500 border-gray-200",
    "assessment": "bg-purple-100 text-purple-800 border-purple-300",
    "pulse": "bg-meq-sky-light text-meq-sky border-meq-sky/30",
    "survey": "bg-emerald-100 text-emerald-800 border-emerald-300",
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500 mt-1">
            Term dates, full-survey windows, pulse cadence, and custom surveys for {school.academicYear}.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/admin/surveys/new" className="px-4 py-2.5 rounded-lg text-sm font-medium text-meq-sky border border-meq-sky bg-white hover:bg-meq-sky hover:text-white">
            New survey
          </Link>
          <span
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 bg-gray-100 cursor-not-allowed"
            title="Editable scheduling lands in Phase 2"
          >
            Edit schedule (coming soon)
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{MONTH_NAMES[monthZero]} {year}</h2>
          <div className="flex items-center gap-1">
            <Link href={prevHref} aria-label="Previous month" className="px-3 py-1.5 rounded-lg text-sm text-meq-sky hover:bg-meq-sky-light font-medium">←</Link>
            <Link href={todayHref} className="px-3 py-1.5 rounded-lg text-sm text-meq-sky hover:bg-meq-sky-light font-medium">Today</Link>
            <Link href={nextHref} aria-label="Next month" className="px-3 py-1.5 rounded-lg text-sm text-meq-sky hover:bg-meq-sky-light font-medium">→</Link>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="px-3 py-2 text-xs font-semibold text-gray-500 text-center">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const isToday = cell && isSameDayUTC(cell, todayUTC);
            const events = cell ? eventsByDay.get(startOfDayUTC(cell).toISOString()) ?? [] : [];
            return (
              <div
                key={i}
                className={`min-h-[110px] border-b border-r border-gray-100 p-1.5 ${
                  cell ? "bg-white" : "bg-gray-50/50"
                } ${(i + 1) % 7 === 0 ? "border-r-0" : ""}`}
              >
                {cell && (
                  <>
                    <div className={`text-xs font-medium mb-1 inline-flex items-center justify-center ${
                      isToday ? "w-6 h-6 rounded-full bg-meq-sky text-white" : "text-gray-500"
                    }`}>
                      {cell.getUTCDate()}
                    </div>
                    <div className="space-y-0.5">
                      {events.slice(0, 4).map((ev, j) => {
                        const style = eventTypeStyles[ev.type];
                        const content = (
                          <span className={`block text-[10px] px-1.5 py-0.5 rounded border truncate ${style}`} title={ev.label}>
                            {ev.label}
                          </span>
                        );
                        return ev.href
                          ? <Link key={j} href={ev.href}>{content}</Link>
                          : <div key={j}>{content}</div>;
                      })}
                      {events.length > 4 && (
                        <p className="text-[9px] text-gray-400">+{events.length - 4} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-purple-100 border border-purple-300"></span>
          Full survey window
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-meq-sky-light border border-meq-sky/30"></span>
          Pulse
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300"></span>
          Custom survey
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-200 border border-slate-300"></span>
          Term boundary
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200"></span>
          Half-term
        </span>
      </div>
    </div>
  );
}
