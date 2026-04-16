"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

/**
 * Returns a complete export of all data held about a single student —
 * used for GDPR Subject Access Requests and parental data requests.
 * Admin-only, scoped to their school.
 */
export async function exportStudentData(studentId: string) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized." as const };

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      school: { select: { id: true, name: true, academicYear: true } },
      yearGroupRef: { select: { name: true, tier: true } },
      classGroupRef: { select: { name: true } },
    },
  });
  if (!student || student.schoolId !== session.schoolId) {
    return { error: "Student not found." as const };
  }

  const [
    assessments,
    assessmentDomainScores,
    teacherAssessments,
    teacherAssessmentDomainScores,
    pulseChecks,
    surveyResponses,
    interventionLogs,
    safeguardingAlerts,
  ] = await Promise.all([
    prisma.assessment.findMany({ where: { studentId }, orderBy: { startedAt: "asc" } }),
    prisma.assessmentDomainScore.findMany({
      where: { assessment: { studentId } },
      include: { assessment: { select: { term: true, academicYear: true } } },
    }),
    prisma.teacherAssessment.findMany({
      where: { studentId },
      include: { teacher: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.teacherAssessmentDomainScore.findMany({
      where: { teacherAssessment: { studentId } },
    }),
    prisma.pulseCheck.findMany({ where: { studentId }, orderBy: { weekOf: "asc" } }),
    prisma.surveyResponse.findMany({
      where: { studentId },
      include: { survey: { select: { title: true, anonymous: true } } },
      orderBy: { completedAt: "asc" },
    }),
    prisma.interventionLog.findMany({ where: { studentId }, orderBy: { appliedAt: "asc" } }),
    prisma.safeguardingAlert.findMany({
      where: { studentId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const exportedAt = new Date().toISOString();

  return {
    exportedAt,
    school: student.school,
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      displayName: student.displayName,
      yearGroup: student.yearGroupRef?.name ?? student.yearGroup,
      className: student.classGroupRef?.name ?? student.className,
      tier: student.tier,
      sen: student.sen,
      loginCode: student.loginCode,
      schoolUuid: student.schoolUuid,
      createdAt: student.createdAt,
    },
    assessments: assessments.map((a) => ({
      ...a,
      answers: tryParse(a.answers),
      domainScoresJson: tryParse(a.domainScoresJson),
      domainLevelsJson: tryParse(a.domainLevelsJson),
      rawResponseJson: tryParse(a.rawResponseJson),
    })),
    assessmentDomainScores,
    teacherAssessments: teacherAssessments.map((t) => ({
      ...t,
      answers: tryParse(t.answers),
      domainScoresJson: tryParse(t.domainScoresJson),
      domainLevelsJson: tryParse(t.domainLevelsJson),
    })),
    teacherAssessmentDomainScores,
    pulseChecks: pulseChecks.map((p) => ({
      ...p,
      answers: tryParse(p.answers),
    })),
    surveyResponses: surveyResponses.map((r) => ({
      surveyTitle: r.survey.title,
      surveyAnonymous: r.survey.anonymous,
      answers: tryParse(r.answers),
      flagged: r.flagged,
      flagReason: r.flagReason,
      completedAt: r.completedAt,
    })),
    interventionLogs,
    safeguardingAlerts,
  };
}

function tryParse(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
