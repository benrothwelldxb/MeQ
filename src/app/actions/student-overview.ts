"use server";

import { prisma } from "@/lib/db";
import { getSchoolFramework } from "@/lib/framework";

export type StudentOverview = Awaited<ReturnType<typeof getStudentOverview>>;

export async function getStudentOverview(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          currentTerm: true,
          academicYear: true,
          pulseEnabled: true,
        },
      },
      yearGroupRef: { select: { name: true } },
      classGroupRef: { select: { name: true } },
    },
  });
  if (!student) return null;

  // All completed assessments (self-report), newest last
  const rawAssessments = await prisma.assessment.findMany({
    where: { studentId, status: "completed" },
    orderBy: [{ academicYear: "asc" }, { term: "asc" }],
  });

  // Use the framework from the most recent assessment if available, because
  // stored domain scores are keyed by that framework's domain keys. The
  // school's current framework may have changed since the assessment ran.
  const latest = rawAssessments[rawAssessments.length - 1];
  const displayFrameworkId = latest?.frameworkId ?? null;

  const frameworkRecord = displayFrameworkId
    ? await prisma.framework.findUnique({
        where: { id: displayFrameworkId },
        include: {
          domains: { orderBy: { sortOrder: "asc" } },
          scoringModels: true,
        },
      })
    : null;

  // Fall back to school's current framework if no assessments yet or the
  // assessment's framework was deleted
  const schoolFramework = frameworkRecord ? null : await getSchoolFramework(student.schoolId);

  const domains = frameworkRecord
    ? frameworkRecord.domains.map((d) => ({ key: d.key, label: d.label, color: d.color }))
    : schoolFramework!.domains.map((d) => ({ key: d.key, label: d.label, color: d.color }));

  const scoringModel = frameworkRecord
    ? frameworkRecord.scoringModels.find((m) => m.key === student.tier) ??
      frameworkRecord.scoringModels.find((m) => m.key === "standard") ??
      frameworkRecord.scoringModels[0]
    : schoolFramework!.scoringModels[student.tier] ??
      schoolFramework!.scoringModels.standard ??
      Object.values(schoolFramework!.scoringModels)[0];

  const frameworkName = frameworkRecord?.name ?? schoolFramework!.name;
  const frameworkId = frameworkRecord?.id ?? schoolFramework!.id;

  const assessments = rawAssessments.map((a) => ({
    id: a.id,
    term: a.term,
    academicYear: a.academicYear,
    frameworkId: a.frameworkId,
    totalScore: a.totalScore ?? 0,
    overallLevel: a.overallLevel ?? "Emerging",
    reliability: a.reliabilityScore ?? "Unknown",
    domainScores: a.domainScoresJson
      ? (JSON.parse(a.domainScoresJson) as Record<string, number>)
      : {},
    domainLevels: a.domainLevelsJson
      ? (JSON.parse(a.domainLevelsJson) as Record<string, string>)
      : {},
    completedAt: a.completedAt,
  }));

  // Teacher assessments
  const rawTeacherAssessments = await prisma.teacherAssessment.findMany({
    where: { studentId, status: "completed" },
    include: { teacher: { select: { firstName: true, lastName: true } } },
    orderBy: [{ academicYear: "asc" }, { term: "asc" }],
  });

  const teacherAssessments = rawTeacherAssessments.map((t) => ({
    id: t.id,
    term: t.term,
    academicYear: t.academicYear,
    teacherName: `${t.teacher.firstName} ${t.teacher.lastName}`,
    frameworkId: t.frameworkId,
    domainScores: t.domainScoresJson
      ? (JSON.parse(t.domainScoresJson) as Record<string, number>)
      : {},
    domainLevels: t.domainLevelsJson
      ? (JSON.parse(t.domainLevelsJson) as Record<string, string>)
      : {},
    completedAt: t.completedAt,
  }));

  // Pulse checks — last 12 weeks
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);
  const rawPulseChecks = await prisma.pulseCheck.findMany({
    where: { studentId, completedAt: { not: null, gte: twelveWeeksAgo } },
    orderBy: { weekOf: "asc" },
  });

  const pulseChecks = rawPulseChecks.map((p) => ({
    weekOf: p.weekOf,
    answers: JSON.parse(p.answers) as Record<string, number>,
    freeText: p.freeText,
    completedAt: p.completedAt,
  }));

  // Custom survey responses
  const rawSurveyResponses = await prisma.surveyResponse.findMany({
    where: { studentId },
    include: {
      survey: {
        select: {
          title: true,
          description: true,
          questions: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              prompt: true,
              questionType: true,
              options: true,
            },
          },
        },
      },
    },
    orderBy: { completedAt: "desc" },
  });

  // Intervention application history
  const rawInterventionLogs = await prisma.interventionLog.findMany({
    where: { studentId },
    orderBy: { appliedAt: "desc" },
    take: 50,
  });
  // Hydrate teacher / admin who logged each one
  const adminIds = Array.from(new Set(rawInterventionLogs.map((l) => l.adminId).filter(Boolean) as string[]));
  const teacherIds = Array.from(new Set(rawInterventionLogs.map((l) => l.teacherId).filter(Boolean) as string[]));
  const [adminMap, teacherMap] = await Promise.all([
    adminIds.length > 0
      ? prisma.admin.findMany({ where: { id: { in: adminIds } }, select: { id: true, email: true } })
      : Promise.resolve([]),
    teacherIds.length > 0
      ? prisma.teacher.findMany({ where: { id: { in: teacherIds } }, select: { id: true, firstName: true, lastName: true } })
      : Promise.resolve([]),
  ]);
  const adminById = new Map(adminMap.map((a) => [a.id, a.email]));
  const teacherById = new Map(teacherMap.map((t) => [t.id, `${t.firstName} ${t.lastName}`]));

  const interventionLogs = rawInterventionLogs.map((l) => ({
    id: l.id,
    domainKey: l.domainKey,
    level: l.level,
    title: l.title,
    notes: l.notes,
    appliedAt: l.appliedAt,
    appliedBy: l.teacherId
      ? teacherById.get(l.teacherId) ?? "Teacher"
      : l.adminId
      ? adminById.get(l.adminId) ?? "Admin"
      : "Unknown",
  }));

  const surveyResponses = rawSurveyResponses.map((r) => ({
    id: r.id,
    surveyTitle: r.survey.title,
    surveyDescription: r.survey.description,
    answers: JSON.parse(r.answers) as Record<string, string | number>,
    questions: r.survey.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      questionType: q.questionType,
      options: q.options ? (JSON.parse(q.options) as string[]) : null,
    })),
    flagged: r.flagged,
    flagReason: r.flagReason,
    completedAt: r.completedAt,
  }));

  return {
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      displayName: student.displayName,
      yearGroup: student.yearGroupRef?.name ?? student.yearGroup,
      className: student.classGroupRef?.name ?? student.className,
      tier: student.tier,
      sen: student.sen,
      schoolId: student.schoolId,
    },
    school: student.school,
    framework: {
      id: frameworkId,
      name: frameworkName,
      domains,
      maxDomainScore: scoringModel?.maxDomainScore ?? 26,
      maxTotalScore: scoringModel?.maxTotalScore ?? 130,
    },
    assessments,
    teacherAssessments,
    pulseChecks,
    surveyResponses,
    interventionLogs,
  };
}
