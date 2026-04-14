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

  const framework = await getSchoolFramework(student.schoolId);
  const scoringModel =
    framework.scoringModels[student.tier] ??
    framework.scoringModels.standard ??
    Object.values(framework.scoringModels)[0];

  // All completed assessments (self-report)
  const rawAssessments = await prisma.assessment.findMany({
    where: { studentId, status: "completed" },
    orderBy: [{ academicYear: "asc" }, { term: "asc" }],
  });

  const assessments = rawAssessments.map((a) => ({
    id: a.id,
    term: a.term,
    academicYear: a.academicYear,
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

  // Custom survey responses (only non-anonymous)
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
      id: framework.id,
      name: framework.name,
      domains: framework.domains.map((d) => ({
        key: d.key,
        label: d.label,
        color: d.color,
      })),
      maxDomainScore: scoringModel?.maxDomainScore ?? 26,
      maxTotalScore: scoringModel?.maxTotalScore ?? 130,
    },
    assessments,
    teacherAssessments,
    pulseChecks,
    surveyResponses,
  };
}
