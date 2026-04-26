import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import Link from "next/link";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_COLOURS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-300",
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  closed: "bg-blue-50 text-blue-700 border-blue-200",
};

interface SurveyOnDay {
  id: string;
  title: string;
  status: string;
  isStart: boolean;
  isEnd: boolean;
  responses: number;
  totalQuestions: number;
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function endOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isWithin(d: Date, start: Date, end: Date): boolean {
  const t = d.getTime();
  return t >= startOfDay(start).getTime() && t <= endOfDay(end).getTime();
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export default async function SurveyCalendarPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string };
}) {
  const session = await getAdminSession();

  const today = new Date();
  const year = parseInt(searchParams.year ?? "") || today.getFullYear();
  const month = parseInt(searchParams.month ?? "") - 1;
  const monthZero = isNaN(month) ? today.getMonth() : month;

  const monthStart = startOfMonth(year, monthZero);
  const monthEnd = endOfMonth(year, monthZero);

  // Fetch surveys whose openAt..closeAt window intersects the visible month.
  // Drafts without openAt/closeAt show only on their createdAt day so admins
  // can still find them via the calendar.
  const surveys = await prisma.survey.findMany({
    where: {
      schoolId: session.schoolId,
      OR: [
        { openAt: { lte: monthEnd }, closeAt: { gte: monthStart } },
        { openAt: { gte: monthStart, lte: monthEnd } },
        { closeAt: { gte: monthStart, lte: monthEnd } },
        { AND: [{ openAt: null }, { closeAt: null }, { createdAt: { gte: monthStart, lte: monthEnd } }] },
      ],
    },
    include: { _count: { select: { responses: true, questions: true } } },
    orderBy: { updatedAt: "desc" },
  });

  // Build the month grid starting Monday
  // Note: getDay() returns 0=Sunday, we want Mon-first
  const firstDayOfWeek = (monthStart.getDay() + 6) % 7; // Mon=0..Sun=6
  const daysInMonth = monthEnd.getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthZero, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const surveysByDay = new Map<string, SurveyOnDay[]>();
  for (const cell of cells) {
    if (!cell) continue;
    const key = cell.toISOString().slice(0, 10);
    const dayItems: SurveyOnDay[] = [];
    for (const s of surveys) {
      const start = s.openAt ?? s.createdAt;
      const end = s.closeAt ?? s.openAt ?? s.createdAt;
      if (!isWithin(cell, start, end)) continue;
      dayItems.push({
        id: s.id,
        title: s.title,
        status: s.status,
        isStart: isSameDay(cell, startOfDay(start)),
        isEnd: isSameDay(cell, startOfDay(end)),
        responses: s._count.responses,
        totalQuestions: s._count.questions,
      });
    }
    if (dayItems.length > 0) surveysByDay.set(key, dayItems);
  }

  const prevMonthDate = new Date(year, monthZero - 1, 1);
  const nextMonthDate = new Date(year, monthZero + 1, 1);
  const prevHref = `/admin/surveys/calendar?year=${prevMonthDate.getFullYear()}&month=${prevMonthDate.getMonth() + 1}`;
  const nextHref = `/admin/surveys/calendar?year=${nextMonthDate.getFullYear()}&month=${nextMonthDate.getMonth() + 1}`;
  const todayHref = `/admin/surveys/calendar?year=${today.getFullYear()}&month=${today.getMonth() + 1}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom survey schedule</h1>
          <p className="text-gray-500 mt-1">When custom surveys open and close — visualised by month. The full overview lives in the <Link href="/admin/calendar" className="text-meq-sky hover:underline">main calendar</Link>.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/surveys" className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">
            List view
          </Link>
          <Link href="/admin/surveys/new" className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90">
            Create Survey
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{MONTH_NAMES[monthZero]} {year}</h2>
          <div className="flex items-center gap-1">
            <Link href={prevHref} className="px-3 py-1.5 rounded-lg text-sm text-meq-sky hover:bg-meq-sky-light font-medium">←</Link>
            <Link href={todayHref} className="px-3 py-1.5 rounded-lg text-sm text-meq-sky hover:bg-meq-sky-light font-medium">Today</Link>
            <Link href={nextHref} className="px-3 py-1.5 rounded-lg text-sm text-meq-sky hover:bg-meq-sky-light font-medium">→</Link>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="px-3 py-2 text-xs font-semibold text-gray-500 text-center">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const isToday = cell && isSameDay(cell, today);
            const items = cell ? surveysByDay.get(cell.toISOString().slice(0, 10)) : null;
            return (
              <div
                key={i}
                className={`min-h-[120px] border-b border-r border-gray-100 p-2 ${
                  cell ? "bg-white" : "bg-gray-50/50"
                } ${(i + 1) % 7 === 0 ? "border-r-0" : ""}`}
              >
                {cell && (
                  <>
                    <div className={`text-xs font-medium mb-1 ${
                      isToday ? "inline-flex items-center justify-center w-6 h-6 rounded-full bg-meq-sky text-white" : "text-gray-500"
                    }`}>
                      {cell.getDate()}
                    </div>
                    {items && (
                      <div className="space-y-1">
                        {items.slice(0, 3).map((item, j) => (
                          <Link
                            key={`${item.id}-${j}`}
                            href={`/admin/surveys/${item.id}`}
                            className={`block text-[11px] px-1.5 py-0.5 rounded border truncate ${STATUS_COLOURS[item.status] || STATUS_COLOURS.draft}`}
                            title={`${item.title} (${item.status})`}
                          >
                            {item.isStart && "● "}
                            {item.title}
                          </Link>
                        ))}
                        {items.length > 3 && (
                          <p className="text-[10px] text-gray-400">+{items.length - 3} more</p>
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

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300"></span>
          Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-300"></span>
          Draft
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-50 border border-blue-200"></span>
          Closed
        </span>
        <span className="text-gray-400">● = first day of survey</span>
      </div>
    </div>
  );
}
