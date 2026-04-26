import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { parseEmailList } from "@/lib/email";
import Link from "next/link";
import AlertCard from "./AlertCard";
import CheckInCard from "./CheckInCard";

type Tab = "open" | "checkins" | "resolved";

export default async function SafeguardingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getAdminSession();
  const { tab: tabParam } = await searchParams;
  const tab: Tab = tabParam === "checkins" ? "checkins" : tabParam === "resolved" ? "resolved" : "open";

  const [admin, school] = await Promise.all([
    prisma.admin.findUnique({ where: { id: session.adminId }, select: { email: true } }),
    prisma.school.findUnique({
      where: { id: session.schoolId },
      select: { dslEmail: true, name: true },
    }),
  ]);

  const dslEmails = parseEmailList(school?.dslEmail);
  const isDsl = !!admin && dslEmails.includes(admin.email.toLowerCase());

  if (!isDsl) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Safeguarding</h1>
        <p className="text-gray-500 mb-6">
          Safeguarding alerts contain sensitive information about individual students.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-900">Only DSLs can view alerts</p>
              <p className="text-xs text-amber-800 mt-1">
                Your email address isn&apos;t listed as a Designated Safeguarding Lead for {school?.name ?? "this school"}.
                Only admins whose email matches a DSL email can view, action, or resolve flagged responses.
              </p>
              {dslEmails.length > 0 ? (
                <p className="text-xs text-amber-800 mt-2">
                  <span className="font-medium">Current DSLs:</span> {dslEmails.join(", ")}
                </p>
              ) : (
                <p className="text-xs text-amber-800 mt-2">
                  No DSL email is set for this school. Add one in{" "}
                  <Link href="/admin/settings" className="underline">Settings</Link>.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-2">What you can see</h2>
          <p className="text-sm text-gray-600 mb-4">
            You can still read the safeguarding policy, keyword list, and email previews to understand
            how the system works.
          </p>
          <Link
            href="/admin/safeguarding/policy"
            className="inline-block px-4 py-2 rounded-lg text-sm font-medium text-meq-sky border border-meq-sky hover:bg-meq-sky hover:text-white transition-all"
          >
            View policy &amp; keywords &rarr;
          </Link>
        </div>
      </div>
    );
  }

  // DSL — show alerts + check-ins
  const [openAlerts, resolvedAlerts, openCheckIns, resolvedCheckIns] = await Promise.all([
    prisma.safeguardingAlert.findMany({
      where: { schoolId: session.schoolId, status: "open" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.safeguardingAlert.findMany({
      where: { schoolId: session.schoolId, status: { in: ["resolved", "dismissed"] } },
      orderBy: { resolvedAt: "desc" },
      take: 50,
    }),
    prisma.checkInRequest.findMany({
      where: { schoolId: session.schoolId, status: "open" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.checkInRequest.findMany({
      where: { schoolId: session.schoolId, status: "resolved" },
      orderBy: { resolvedAt: "desc" },
      take: 50,
    }),
  ]);

  // Hydrate student + context (for alerts)
  const studentIds = Array.from(new Set([
    ...openAlerts.map((a) => a.studentId).filter(Boolean) as string[],
    ...resolvedAlerts.map((a) => a.studentId).filter(Boolean) as string[],
    ...openCheckIns.map((c) => c.studentId),
    ...resolvedCheckIns.map((c) => c.studentId),
  ]));
  const pulseIds = Array.from(new Set([...openAlerts, ...resolvedAlerts].map((a) => a.pulseCheckId).filter(Boolean) as string[]));
  const surveyRespIds = Array.from(new Set([...openAlerts, ...resolvedAlerts].map((a) => a.surveyResponseId).filter(Boolean) as string[]));
  const teacherIds = Array.from(new Set([...openCheckIns, ...resolvedCheckIns].map((c) => c.targetTeacherId).filter(Boolean) as string[]));

  const [students, pulses, surveyResps, resolvers, teachers] = await Promise.all([
    studentIds.length > 0
      ? prisma.student.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, firstName: true, lastName: true, yearGroup: true, className: true },
        })
      : [],
    pulseIds.length > 0
      ? prisma.pulseCheck.findMany({
          where: { id: { in: pulseIds } },
          select: { id: true, answers: true, weekOf: true },
        })
      : [],
    surveyRespIds.length > 0
      ? prisma.surveyResponse.findMany({
          where: { id: { in: surveyRespIds } },
          select: { id: true, surveyId: true, survey: { select: { title: true, anonymous: true } } },
        })
      : [],
    prisma.admin.findMany({
      where: { id: { in: [...openAlerts, ...resolvedAlerts].map((a) => a.resolvedByAdminId).filter(Boolean) as string[] } },
      select: { id: true, email: true },
    }),
    teacherIds.length > 0
      ? prisma.teacher.findMany({
          where: { id: { in: teacherIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [],
  ]);

  const studentMap = new Map(students.map((s) => [s.id, s]));
  const pulseMap = new Map(pulses.map((p) => [p.id, p]));
  const surveyMap = new Map(surveyResps.map((r) => [r.id, r]));
  const resolverMap = new Map(resolvers.map((r) => [r.id, r.email]));
  const teacherMap = new Map(teachers.map((t) => [t.id, `${t.firstName} ${t.lastName}`]));

  // Hydrate check-in resolvers (could be admin or teacher)
  const checkInResolverTeacherIds = Array.from(new Set(
    resolvedCheckIns.filter((c) => c.resolvedByType === "teacher").map((c) => c.resolvedById).filter(Boolean) as string[]
  ));
  const checkInResolverAdminIds = Array.from(new Set(
    resolvedCheckIns.filter((c) => c.resolvedByType === "admin").map((c) => c.resolvedById).filter(Boolean) as string[]
  ));
  const [checkInResolverTeachers, checkInResolverAdmins] = await Promise.all([
    checkInResolverTeacherIds.length > 0
      ? prisma.teacher.findMany({
          where: { id: { in: checkInResolverTeacherIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [],
    checkInResolverAdminIds.length > 0
      ? prisma.admin.findMany({
          where: { id: { in: checkInResolverAdminIds } },
          select: { id: true, email: true },
        })
      : [],
  ]);
  const checkInResolverTeacherMap = new Map(checkInResolverTeachers.map((t) => [t.id, `${t.firstName} ${t.lastName}`]));
  const checkInResolverAdminMap = new Map(checkInResolverAdmins.map((a) => [a.id, a.email]));

  const visibleAlerts = tab === "resolved" ? resolvedAlerts : tab === "open" ? openAlerts : [];
  const visibleCheckIns = tab === "checkins" ? openCheckIns : tab === "resolved" ? resolvedCheckIns : [];

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Safeguarding</h1>
          <p className="text-gray-500">
            {openAlerts.length === 0 && openCheckIns.length === 0
              ? "No active alerts or check-in requests."
              : [
                  openAlerts.length > 0 && `${openAlerts.length} open alert${openAlerts.length === 1 ? "" : "s"}`,
                  openCheckIns.length > 0 && `${openCheckIns.length} open check-in${openCheckIns.length === 1 ? "" : "s"}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
          </p>
        </div>
        <Link
          href="/admin/safeguarding/policy"
          className="text-sm text-meq-sky hover:underline"
        >
          Policy &amp; keywords &rarr;
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <Link
          href="/admin/safeguarding"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "open"
              ? "border-meq-sky text-meq-sky"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Flagged alerts ({openAlerts.length})
        </Link>
        <Link
          href="/admin/safeguarding?tab=checkins"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "checkins"
              ? "border-meq-sky text-meq-sky"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Check-in requests ({openCheckIns.length})
        </Link>
        <Link
          href="/admin/safeguarding?tab=resolved"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "resolved"
              ? "border-meq-sky text-meq-sky"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Resolved ({resolvedAlerts.length + resolvedCheckIns.length})
        </Link>
      </div>

      {tab === "checkins" && (
        <>
          {visibleCheckIns.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No open check-in requests. 🎉</p>
              <p className="text-xs text-gray-400 mt-2">
                When a student asks to talk with a staff member, their request will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleCheckIns.map((c) => (
                <CheckInCard
                  key={c.id}
                  checkIn={{
                    id: c.id,
                    status: c.status,
                    freeText: c.freeText,
                    notes: c.notes,
                    createdAt: c.createdAt,
                    resolvedAt: c.resolvedAt,
                    resolvedByType: c.resolvedByType,
                    resolverLabel: null,
                  }}
                  student={c.studentId ? studentMap.get(c.studentId) ?? null : null}
                  targetTeacherName={c.targetTeacherId ? teacherMap.get(c.targetTeacherId) ?? null : null}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "open" && (
        <>
          {visibleAlerts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No open alerts. 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleAlerts.map((alert) => {
                const student = alert.studentId ? studentMap.get(alert.studentId) ?? null : null;
                const pulse = alert.pulseCheckId ? pulseMap.get(alert.pulseCheckId) ?? null : null;
                const surveyResp = alert.surveyResponseId ? surveyMap.get(alert.surveyResponseId) ?? null : null;
                const resolverEmail = alert.resolvedByAdminId ? resolverMap.get(alert.resolvedByAdminId) ?? null : null;

                return (
                  <AlertCard
                    key={alert.id}
                    alert={{
                      id: alert.id,
                      type: alert.type,
                      status: alert.status,
                      flagReason: alert.flagReason,
                      flaggedText: alert.flaggedText,
                      notes: alert.notes,
                      createdAt: alert.createdAt,
                      resolvedAt: alert.resolvedAt,
                      resolverEmail,
                    }}
                    student={student}
                    pulse={pulse ? { answers: pulse.answers, weekOf: pulse.weekOf } : null}
                    survey={surveyResp ? { title: surveyResp.survey.title, anonymous: surveyResp.survey.anonymous, surveyId: surveyResp.surveyId } : null}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "resolved" && (
        <>
          {visibleAlerts.length === 0 && visibleCheckIns.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No resolved items yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleAlerts.map((alert) => {
                const student = alert.studentId ? studentMap.get(alert.studentId) ?? null : null;
                const pulse = alert.pulseCheckId ? pulseMap.get(alert.pulseCheckId) ?? null : null;
                const surveyResp = alert.surveyResponseId ? surveyMap.get(alert.surveyResponseId) ?? null : null;
                const resolverEmail = alert.resolvedByAdminId ? resolverMap.get(alert.resolvedByAdminId) ?? null : null;
                return (
                  <AlertCard
                    key={alert.id}
                    alert={{
                      id: alert.id,
                      type: alert.type,
                      status: alert.status,
                      flagReason: alert.flagReason,
                      flaggedText: alert.flaggedText,
                      notes: alert.notes,
                      createdAt: alert.createdAt,
                      resolvedAt: alert.resolvedAt,
                      resolverEmail,
                    }}
                    student={student}
                    pulse={pulse ? { answers: pulse.answers, weekOf: pulse.weekOf } : null}
                    survey={surveyResp ? { title: surveyResp.survey.title, anonymous: surveyResp.survey.anonymous, surveyId: surveyResp.surveyId } : null}
                  />
                );
              })}
              {visibleCheckIns.map((c) => {
                const resolverLabel =
                  c.resolvedByType === "teacher" && c.resolvedById
                    ? checkInResolverTeacherMap.get(c.resolvedById) ?? null
                    : c.resolvedByType === "admin" && c.resolvedById
                    ? checkInResolverAdminMap.get(c.resolvedById) ?? null
                    : null;
                return (
                  <CheckInCard
                    key={c.id}
                    checkIn={{
                      id: c.id,
                      status: c.status,
                      freeText: c.freeText,
                      notes: c.notes,
                      createdAt: c.createdAt,
                      resolvedAt: c.resolvedAt,
                      resolvedByType: c.resolvedByType,
                      resolverLabel,
                    }}
                    student={c.studentId ? studentMap.get(c.studentId) ?? null : null}
                    targetTeacherName={c.targetTeacherId ? teacherMap.get(c.targetTeacherId) ?? null : null}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
