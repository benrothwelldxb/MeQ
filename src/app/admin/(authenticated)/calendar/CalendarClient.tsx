"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  upsertPulseSchedule,
  upsertAssessmentWindow,
  deleteAssessmentWindow,
  skipPulseOccurrence,
  unskipPulseOccurrence,
  addAdHocPulse,
  removeAdHocPulse,
} from "@/app/actions/scheduling";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_OF_WEEK_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
];

interface CalendarTerm {
  id: string;
  key: string;
  name: string;
  startDate: string; // ISO
  endDate: string;
  halfTerms: Array<{ id: string; startDate: string; endDate: string; label: string | null }>;
}

interface CalendarAssessmentWindow {
  id: string;
  termKey: string;
  openAt: string;
  closeAt: string;
}

interface CalendarPulseSchedule {
  id: string;
  cadence: "weekly" | "biweekly" | "monthly" | "custom";
  dayOfWeek: number;
  startDate: string;
  endDate: string | null;
  active: boolean;
  occurrences: Array<{ date: string; status: "scheduled" | "skipped" | "ad_hoc" }>;
}

interface CalendarSurvey {
  id: string;
  title: string;
  status: string;
  openAt: string | null;
  closeAt: string | null;
}

interface DayEvent {
  type: "term-start" | "term-end" | "half-term" | "assessment" | "pulse" | "pulse-skipped" | "survey";
  label: string;
  href?: string;
}

const eventTypeStyles: Record<DayEvent["type"], string> = {
  "term-start": "bg-slate-200 text-slate-800 border-slate-300",
  "term-end": "bg-slate-200 text-slate-800 border-slate-300",
  "half-term": "bg-gray-100 text-gray-500 border-gray-200",
  "assessment": "bg-purple-100 text-purple-800 border-purple-300",
  "pulse": "bg-meq-sky-light text-meq-sky border-meq-sky/30",
  "pulse-skipped": "bg-gray-50 text-gray-400 border-gray-200 line-through",
  "survey": "bg-emerald-100 text-emerald-800 border-emerald-300",
};

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function isSameDayUTC(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

function isWithinUTC(d: Date, start: Date, end: Date): boolean {
  const t = startOfDayUTC(d).getTime();
  return t >= startOfDayUTC(start).getTime() && t <= startOfDayUTC(end).getTime();
}

function dateInputValue(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toISOString().slice(0, 10);
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function CalendarClient({
  academicYear,
  terms,
  assessmentWindows,
  pulseSchedule,
  surveys,
  pulseDates,
  initialYear,
  initialMonth,
}: {
  academicYear: string;
  terms: CalendarTerm[];
  assessmentWindows: CalendarAssessmentWindow[];
  pulseSchedule: CalendarPulseSchedule | null;
  surveys: CalendarSurvey[];
  pulseDates: string[]; // ISO dates of materialised + override-applied pulses
  initialYear: number;
  initialMonth: number; // 0-indexed
}) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);
  const [monthZero, setMonthZero] = useState(initialMonth);
  const [openDayKey, setOpenDayKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const monthStart = new Date(Date.UTC(year, monthZero, 1));
  const monthEnd = new Date(Date.UTC(year, monthZero + 1, 0));

  // Build day events for the visible month
  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEvent[]>();
    const push = (dateIso: string, ev: DayEvent) => {
      const d = startOfDayUTC(new Date(dateIso));
      const key = d.toISOString();
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    };

    for (const term of terms) {
      const ts = new Date(term.startDate);
      const te = new Date(term.endDate);
      if (isWithinUTC(ts, monthStart, monthEnd)) push(term.startDate, { type: "term-start", label: `${term.name} starts` });
      if (isWithinUTC(te, monthStart, monthEnd)) push(term.endDate, { type: "term-end", label: `${term.name} ends` });
      for (const ht of term.halfTerms) {
        const cur = startOfDayUTC(new Date(ht.startDate));
        const end = startOfDayUTC(new Date(ht.endDate));
        while (cur.getTime() <= end.getTime()) {
          if (isWithinUTC(cur, monthStart, monthEnd)) {
            push(cur.toISOString(), { type: "half-term", label: ht.label ?? "Half-term" });
          }
          cur.setUTCDate(cur.getUTCDate() + 1);
        }
      }
    }
    for (const aw of assessmentWindows) {
      const cur = startOfDayUTC(new Date(aw.openAt));
      const end = startOfDayUTC(new Date(aw.closeAt));
      while (cur.getTime() <= end.getTime()) {
        if (isWithinUTC(cur, monthStart, monthEnd)) {
          push(cur.toISOString(), { type: "assessment", label: `Full survey (${aw.termKey})` });
        }
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }

    // Pulses: show materialised dates as scheduled; show overrides explicitly
    const skippedKeys = new Set(
      (pulseSchedule?.occurrences ?? [])
        .filter((o) => o.status === "skipped")
        .map((o) => startOfDayUTC(new Date(o.date)).toISOString())
    );
    for (const dIso of pulseDates) {
      const d = startOfDayUTC(new Date(dIso));
      if (isWithinUTC(d, monthStart, monthEnd)) {
        push(d.toISOString(), { type: "pulse", label: "Pulse" });
      }
    }
    for (const occ of pulseSchedule?.occurrences ?? []) {
      const d = startOfDayUTC(new Date(occ.date));
      if (occ.status === "skipped" && isWithinUTC(d, monthStart, monthEnd) && !skippedKeys.has(d.toISOString())) {
        // shouldn't happen but defensive
        push(d.toISOString(), { type: "pulse-skipped", label: "Pulse (skipped)" });
      } else if (occ.status === "skipped" && isWithinUTC(d, monthStart, monthEnd)) {
        push(d.toISOString(), { type: "pulse-skipped", label: "Pulse (skipped)" });
      }
    }
    for (const s of surveys) {
      if (s.openAt) {
        const d = startOfDayUTC(new Date(s.openAt));
        if (isWithinUTC(d, monthStart, monthEnd)) push(d.toISOString(), { type: "survey", label: `${s.title} opens`, href: `/admin/surveys/${s.id}` });
      }
      if (s.closeAt) {
        const d = startOfDayUTC(new Date(s.closeAt));
        if (isWithinUTC(d, monthStart, monthEnd)) push(d.toISOString(), { type: "survey", label: `${s.title} closes`, href: `/admin/surveys/${s.id}` });
      }
    }

    return map;
  }, [terms, assessmentWindows, pulseSchedule, pulseDates, surveys, monthStart, monthEnd]);

  // Build the day cells
  const today = startOfDayUTC(new Date());
  const firstDayOfWeek = (monthStart.getUTCDay() + 6) % 7;
  const daysInMonth = monthEnd.getUTCDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(Date.UTC(year, monthZero, d)));
  while (cells.length % 7 !== 0) cells.push(null);

  const goPrev = () => {
    const d = new Date(Date.UTC(year, monthZero - 1, 1));
    setYear(d.getUTCFullYear()); setMonthZero(d.getUTCMonth()); setOpenDayKey(null);
  };
  const goNext = () => {
    const d = new Date(Date.UTC(year, monthZero + 1, 1));
    setYear(d.getUTCFullYear()); setMonthZero(d.getUTCMonth()); setOpenDayKey(null);
  };
  const goToday = () => {
    setYear(today.getUTCFullYear()); setMonthZero(today.getUTCMonth()); setOpenDayKey(null);
  };

  // ---- Day-cell actions: skip / unskip / add-ad-hoc / remove-ad-hoc ----

  const runAction = (fn: () => Promise<{ error?: string; success?: boolean }>) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res && "error" in res && res.error) setError(res.error);
      else router.refresh();
    });
  };

  const handleSkip = (dateIso: string) => {
    if (!pulseSchedule) return;
    runAction(() => skipPulseOccurrence(pulseSchedule.id, dateIso));
    setOpenDayKey(null);
  };
  const handleUnskip = (dateIso: string) => {
    if (!pulseSchedule) return;
    runAction(() => unskipPulseOccurrence(pulseSchedule.id, dateIso));
    setOpenDayKey(null);
  };
  const handleAddAdHoc = (dateIso: string) => {
    if (!pulseSchedule) {
      setError("Set up a pulse schedule first to add ad-hoc pulses.");
      return;
    }
    runAction(() => addAdHocPulse(pulseSchedule.id, dateIso));
    setOpenDayKey(null);
  };
  const handleRemoveAdHoc = (dateIso: string) => {
    if (!pulseSchedule) return;
    runAction(() => removeAdHocPulse(pulseSchedule.id, dateIso));
    setOpenDayKey(null);
  };

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <PulseScheduleEditor academicYear={academicYear} schedule={pulseSchedule} onError={setError} />

      <AssessmentWindowsEditor academicYear={academicYear} terms={terms} windows={assessmentWindows} onError={setError} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{MONTH_NAMES[monthZero]} {year}</h2>
          <div className="flex items-center gap-1">
            <button onClick={goPrev} aria-label="Previous month" className="px-3 py-1.5 rounded-lg text-sm text-meq-sky hover:bg-meq-sky-light font-medium">←</button>
            <button onClick={goToday} className="px-3 py-1.5 rounded-lg text-sm text-meq-sky hover:bg-meq-sky-light font-medium">Today</button>
            <button onClick={goNext} aria-label="Next month" className="px-3 py-1.5 rounded-lg text-sm text-meq-sky hover:bg-meq-sky-light font-medium">→</button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="px-3 py-2 text-xs font-semibold text-gray-500 text-center">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const isToday = cell && isSameDayUTC(cell, today);
            const dayKey = cell ? cell.toISOString() : `empty-${i}`;
            const events = cell ? eventsByDay.get(cell.toISOString()) ?? [] : [];
            const hasPulse = events.some((e) => e.type === "pulse");
            const hasSkippedPulse = events.some((e) => e.type === "pulse-skipped");
            const hasAdHoc = (pulseSchedule?.occurrences ?? []).some(
              (o) => o.status === "ad_hoc" && cell && isSameDayUTC(new Date(o.date), cell)
            );
            const inAssessment = events.some((e) => e.type === "assessment");
            const inHalfTerm = events.some((e) => e.type === "half-term");
            const isOpen = openDayKey === dayKey;
            return (
              <div
                key={dayKey}
                className={`min-h-[110px] border-b border-r border-gray-100 p-1.5 relative ${
                  cell ? (inHalfTerm ? "bg-gray-50/60" : "bg-white") : "bg-gray-50/50"
                } ${(i + 1) % 7 === 0 ? "border-r-0" : ""}`}
              >
                {cell && (
                  <>
                    <button
                      type="button"
                      onClick={() => setOpenDayKey(isOpen ? null : dayKey)}
                      className={`text-xs font-medium mb-1 inline-flex items-center justify-center cursor-pointer rounded ${
                        isToday ? "w-6 h-6 rounded-full bg-meq-sky text-white" : "px-1 text-gray-500 hover:bg-gray-100"
                      }`}
                      aria-label={`${cell.toISOString().slice(0, 10)} actions`}
                    >
                      {cell.getUTCDate()}
                    </button>
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
                      {events.length > 4 && <p className="text-[9px] text-gray-400">+{events.length - 4} more</p>}
                    </div>

                    {isOpen && (
                      <div
                        className="absolute z-20 top-8 left-1 right-1 bg-white shadow-lg rounded-lg border border-gray-200 p-2 space-y-1"
                        onMouseLeave={() => setOpenDayKey(null)}
                      >
                        <p className="text-[10px] font-medium text-gray-500 mb-1">{fmtDate(cell)}</p>
                        {hasPulse && pulseSchedule && (
                          <button
                            type="button"
                            onClick={() => handleSkip(cell.toISOString())}
                            disabled={pending}
                            className="w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-50 disabled:opacity-50"
                          >
                            Skip this pulse
                          </button>
                        )}
                        {hasSkippedPulse && pulseSchedule && (
                          <button
                            type="button"
                            onClick={() => handleUnskip(cell.toISOString())}
                            disabled={pending}
                            className="w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-50 disabled:opacity-50"
                          >
                            Restore this pulse
                          </button>
                        )}
                        {!hasPulse && !hasSkippedPulse && !inAssessment && !inHalfTerm && pulseSchedule && (
                          <button
                            type="button"
                            onClick={() => handleAddAdHoc(cell.toISOString())}
                            disabled={pending}
                            className="w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-50 disabled:opacity-50"
                          >
                            Add ad-hoc pulse
                          </button>
                        )}
                        {hasAdHoc && pulseSchedule && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAdHoc(cell.toISOString())}
                            disabled={pending}
                            className="w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-50 text-red-600 disabled:opacity-50"
                          >
                            Remove ad-hoc pulse
                          </button>
                        )}
                        {(inAssessment || inHalfTerm) && !hasPulse && (
                          <p className="text-[10px] text-gray-400 px-2 py-1">
                            {inAssessment ? "Full survey day — no pulse allowed." : "Half-term — no school events."}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-purple-100 border border-purple-300"></span>Full survey
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-meq-sky-light border border-meq-sky/30"></span>Pulse
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300"></span>Custom survey
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-200 border border-slate-300"></span>Term boundary
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200"></span>Half-term
        </span>
        <span className="ml-auto text-gray-400">Click a date to skip / add a pulse</span>
      </div>
    </div>
  );
}

// ============================================================================
// Pulse schedule editor
// ============================================================================

function PulseScheduleEditor({
  academicYear,
  schedule,
  onError,
}: {
  academicYear: string;
  schedule: CalendarPulseSchedule | null;
  onError: (msg: string | null) => void;
}) {
  const router = useRouter();
  const [cadence, setCadence] = useState<CalendarPulseSchedule["cadence"]>(schedule?.cadence ?? "weekly");
  const [dayOfWeek, setDayOfWeek] = useState(schedule?.dayOfWeek ?? 1);
  const [startDate, setStartDate] = useState(dateInputValue(schedule?.startDate));
  const [endDate, setEndDate] = useState(dateInputValue(schedule?.endDate));
  const [active, setActive] = useState(schedule?.active ?? true);
  const [pending, startTransition] = useTransition();

  const handleSave = () => {
    onError(null);
    startTransition(async () => {
      const res = await upsertPulseSchedule({
        academicYear,
        cadence,
        dayOfWeek,
        startDate,
        endDate: endDate || null,
        active,
      });
      if ("error" in res && res.error) onError(res.error);
      else router.refresh();
    });
  };

  return (
    <details className="bg-white rounded-xl border border-gray-200 mb-4 group" open={!schedule}>
      <summary className="px-5 py-3 cursor-pointer flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900">Pulse schedule</h3>
          <p className="text-xs text-gray-500">
            {schedule
              ? `${cadence}, ${DAY_OF_WEEK_OPTIONS.find((o) => o.value === dayOfWeek)?.label ?? "—"}, ${active ? "active" : "paused"}`
              : "No schedule yet — set cadence to start running pulses"}
          </p>
        </div>
        <span className="text-xs text-gray-400 group-open:hidden">Click to edit</span>
      </summary>
      <div className="px-5 pb-5 pt-2 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-gray-100">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600">Cadence</span>
          <select value={cadence} onChange={(e) => setCadence(e.target.value as CalendarPulseSchedule["cadence"])} className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:border-meq-sky focus:outline-none">
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600">Day of week</span>
          <select value={dayOfWeek} onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))} className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:border-meq-sky focus:outline-none">
            {DAY_OF_WEEK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600">Start date</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600">End date</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none" />
        </label>
        <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky" />
            Active
            <span className="text-xs text-gray-400">(unchecked = scheduled but paused)</span>
          </label>
          <button
            type="button"
            onClick={handleSave}
            disabled={pending || !startDate || !endDate}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save schedule"}
          </button>
        </div>
      </div>
    </details>
  );
}

// ============================================================================
// Assessment windows editor
// ============================================================================

function AssessmentWindowsEditor({
  academicYear,
  terms,
  windows,
  onError,
}: {
  academicYear: string;
  terms: CalendarTerm[];
  windows: CalendarAssessmentWindow[];
  onError: (msg: string | null) => void;
}) {
  return (
    <details className="bg-white rounded-xl border border-gray-200 mb-4 group">
      <summary className="px-5 py-3 cursor-pointer flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900">Full survey windows</h3>
          <p className="text-xs text-gray-500">
            {windows.length === 0 ? "No windows scheduled" : `${windows.length} of ${terms.length} terms have a survey window`}
          </p>
        </div>
        <span className="text-xs text-gray-400 group-open:hidden">Click to edit</span>
      </summary>
      <div className="border-t border-gray-100 divide-y divide-gray-100">
        {terms.map((term) => (
          <AssessmentWindowRow
            key={term.key}
            academicYear={academicYear}
            term={term}
            current={windows.find((w) => w.termKey === term.key) ?? null}
            onError={onError}
          />
        ))}
      </div>
    </details>
  );
}

function AssessmentWindowRow({
  academicYear,
  term,
  current,
  onError,
}: {
  academicYear: string;
  term: CalendarTerm;
  current: CalendarAssessmentWindow | null;
  onError: (msg: string | null) => void;
}) {
  const router = useRouter();
  const [openAt, setOpenAt] = useState(dateInputValue(current?.openAt) || dateInputValue(term.startDate));
  const [closeAt, setCloseAt] = useState(dateInputValue(current?.closeAt) || dateInputValue(new Date(new Date(term.startDate).getTime() + 28 * 24 * 60 * 60 * 1000)));
  const [enabled, setEnabled] = useState(!!current);
  const [pending, startTransition] = useTransition();

  const handleSave = () => {
    onError(null);
    startTransition(async () => {
      if (enabled) {
        const res = await upsertAssessmentWindow(term.key, openAt, closeAt, academicYear);
        if ("error" in res && res.error) {
          onError(res.error);
          return;
        }
      } else if (current) {
        const res = await deleteAssessmentWindow(term.key, academicYear);
        if ("error" in res && res.error) {
          onError(res.error);
          return;
        }
      }
      router.refresh();
    });
  };

  return (
    <div className="px-5 py-3 grid sm:grid-cols-[140px_1fr_1fr_auto] gap-3 items-end">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600">{term.name}</span>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky" />
          Run this term
        </label>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600">Opens</span>
        <input type="date" value={openAt} onChange={(e) => setOpenAt(e.target.value)} disabled={!enabled} className="px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:bg-gray-50" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-600">Closes</span>
        <input type="date" value={closeAt} onChange={(e) => setCloseAt(e.target.value)} disabled={!enabled} className="px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:bg-gray-50" />
      </label>
      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="px-3 py-2 rounded-lg text-sm font-medium text-meq-sky border border-meq-sky bg-white hover:bg-meq-sky hover:text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
