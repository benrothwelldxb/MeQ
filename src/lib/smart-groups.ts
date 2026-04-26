import { prisma } from "./db";
import { getSchoolFramework } from "./framework";
import { getSchoolSettings } from "./school";
import { parseNumberRecord } from "./json";

/**
 * Load the full display payload for a single smart group — members, latest
 * assessment-level-per-student, and a simple latest-pulse average per domain
 * for the whole group. Server-only.
 *
 * `schoolId` is required and used as part of the lookup so a misuse from a
 * future caller (e.g. forgetting to verify the group belongs to the actor's
 * school) fails closed — returns null rather than leaking data across schools.
 */
export async function loadSmartGroupViewData(groupId: string, schoolId: string) {
  const group = await prisma.smartGroup.findFirst({
    where: { id: groupId, schoolId },
    include: {
      createdByTeacher: { select: { firstName: true, lastName: true } },
      members: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              yearGroup: true,
              className: true,
              sen: true,
              magt: true,
              eal: true,
              schoolId: true,
            },
          },
        },
      },
      teacherAccess: {
        include: {
          teacher: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!group) return null;

  const schoolSettings = await getSchoolSettings(group.schoolId);
  const framework = await getSchoolFramework(group.schoolId);

  const studentIds = group.members.map((m) => m.student.id);

  // Latest completed assessment per student (this academic year).
  const assessments = studentIds.length > 0
    ? await prisma.assessment.findMany({
        where: {
          studentId: { in: studentIds },
          status: "completed",
          academicYear: schoolSettings.academicYear,
        },
        orderBy: { completedAt: "desc" },
        select: {
          studentId: true,
          overallLevel: true,
          domainScoresJson: true,
          completedAt: true,
        },
      })
    : [];

  const latestByStudent = new Map<string, typeof assessments[number]>();
  for (const a of assessments) {
    if (!latestByStudent.has(a.studentId)) latestByStudent.set(a.studentId, a);
  }

  // Latest pulse per student (last 4 weeks window — group avg per domain).
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const pulses = studentIds.length > 0
    ? await prisma.pulseCheck.findMany({
        where: {
          studentId: { in: studentIds },
          completedAt: { not: null, gte: fourWeeksAgo },
        },
        select: { answers: true },
      })
    : [];

  // Aggregate pulse by domain. `answers` is JSON like { "KnowMe": 4, ... }.
  // parseNumberRecord soft-fails to {} on bad JSON / wrong shape so a single
  // corrupt row can't crash the page.
  const pulseTotals: Record<string, { sum: number; n: number }> = {};
  for (const p of pulses) {
    const answers = parseNumberRecord(p.answers);
    for (const [domain, value] of Object.entries(answers)) {
      if (!pulseTotals[domain]) pulseTotals[domain] = { sum: 0, n: 0 };
      pulseTotals[domain].sum += value;
      pulseTotals[domain].n += 1;
    }
  }

  const pulseSummary = framework.domains.map((d) => {
    const bucket = pulseTotals[d.key];
    return {
      domain: d.label,
      average: bucket && bucket.n > 0 ? Math.round((bucket.sum / bucket.n) * 10) / 10 : null,
    };
  });

  const students = group.members.map((m) => {
    const latest = latestByStudent.get(m.student.id);
    const parsed = latest?.domainScoresJson ? parseNumberRecord(latest.domainScoresJson) : null;
    const domainScores: Record<string, number> | null = parsed && Object.keys(parsed).length > 0 ? parsed : null;
    return {
      id: m.student.id,
      firstName: m.student.firstName,
      lastName: m.student.lastName,
      yearGroup: m.student.yearGroup,
      className: m.student.className,
      sen: m.student.sen,
      magt: m.student.magt,
      eal: m.student.eal,
      overallLevel: latest?.overallLevel ?? null,
      domainScores,
    };
  });

  const creatorLabel = group.createdByType === "teacher" && group.createdByTeacher
    ? `${group.createdByTeacher.firstName} ${group.createdByTeacher.lastName}`
    : null; // null = admin

  const sharedWithNames = group.teacherAccess.map(
    (ta) => `${ta.teacher.firstName} ${ta.teacher.lastName}`
  );

  const sharedTeacherIds = group.teacherAccess.map((ta) => ta.teacherId);
  const memberStudentIds = group.members.map((m) => m.student.id);

  const domains = framework.domains.map((d) => ({
    key: d.key,
    label: d.label,
    color: d.color,
  }));

  return {
    group: {
      id: group.id,
      schoolId: group.schoolId,
      name: group.name,
      description: group.description,
      purpose: group.purpose,
      createdByType: group.createdByType,
      createdByTeacherId: group.createdByTeacherId,
      creatorLabel,
      sharedWithNames,
      sharedTeacherIds,
      memberStudentIds,
    },
    students,
    domains,
    pulseSummary,
  };
}
