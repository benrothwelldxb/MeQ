"use server";

import { prisma } from "@/lib/db";
import { getAdminSession, getStudentSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { SURVEY_TEMPLATES, moderateText } from "@/lib/surveys";
import { recordAudit } from "@/lib/audit";

/** Fetch a survey and verify it belongs to the admin's school. */
async function requireOwnedSurvey(surveyId: string) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized." as const };
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: { id: true, schoolId: true },
  });
  if (!survey || survey.schoolId !== session.schoolId) {
    return { error: "Survey not found." as const };
  }
  return { session, surveyId: survey.id };
}

export async function createSurveyFromTemplate(templateKey: string) {
  const session = await getAdminSession();
  if (!session.schoolId) return { error: "Not authenticated" };

  const template = SURVEY_TEMPLATES.find((t) => t.key === templateKey);
  if (!template) return { error: "Template not found" };

  const survey = await prisma.survey.create({
    data: {
      schoolId: session.schoolId,
      title: template.title,
      description: template.description,
      anonymous: template.anonymous,
      questions: {
        create: template.questions.map((q, i) => ({
          orderIndex: i + 1,
          prompt: q.prompt,
          questionType: q.questionType,
          options: q.options ? JSON.stringify(q.options) : null,
          required: q.required !== false,
        })),
      },
    },
  });

  revalidatePath("/admin/surveys");
  return { success: true, surveyId: survey.id };
}

export async function createBlankSurvey(title: string) {
  const session = await getAdminSession();
  if (!session.schoolId) return { error: "Not authenticated" };
  if (!title.trim()) return { error: "Title is required" };

  const survey = await prisma.survey.create({
    data: {
      schoolId: session.schoolId,
      title: title.trim(),
    },
  });

  revalidatePath("/admin/surveys");
  return { success: true, surveyId: survey.id };
}

export async function updateSurvey(
  surveyId: string,
  data: {
    title?: string;
    description?: string;
    anonymous?: boolean;
    allowRetake?: boolean;
    targetType?: string;
    targetIds?: string[];
  }
) {
  const auth = await requireOwnedSurvey(surveyId);
  if ("error" in auth) return { error: auth.error };

  await prisma.survey.update({
    where: { id: surveyId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.anonymous !== undefined && { anonymous: data.anonymous }),
      ...(data.allowRetake !== undefined && { allowRetake: data.allowRetake }),
      ...(data.targetType !== undefined && { targetType: data.targetType }),
      ...(data.targetIds !== undefined && { targetIds: JSON.stringify(data.targetIds) }),
    },
  });

  revalidatePath(`/admin/surveys/${surveyId}`);
  return { success: true };
}

export async function addSurveyQuestion(
  surveyId: string,
  data: { prompt: string; questionType: string; options?: string[]; required?: boolean }
) {
  const auth = await requireOwnedSurvey(surveyId);
  if ("error" in auth) return { error: auth.error };

  const lastQ = await prisma.surveyQuestion.findFirst({
    where: { surveyId },
    orderBy: { orderIndex: "desc" },
  });
  const orderIndex = (lastQ?.orderIndex ?? 0) + 1;

  await prisma.surveyQuestion.create({
    data: {
      surveyId,
      orderIndex,
      prompt: data.prompt,
      questionType: data.questionType,
      options: data.options ? JSON.stringify(data.options) : null,
      required: data.required !== false,
    },
  });

  revalidatePath(`/admin/surveys/${surveyId}`);
  return { success: true };
}

export async function deleteSurveyQuestion(questionId: string, surveyId: string) {
  const auth = await requireOwnedSurvey(surveyId);
  if ("error" in auth) return { error: auth.error };

  // Ensure the question actually belongs to this survey
  const question = await prisma.surveyQuestion.findUnique({
    where: { id: questionId },
    select: { surveyId: true },
  });
  if (!question || question.surveyId !== surveyId) {
    return { error: "Question not found." };
  }

  await prisma.surveyQuestion.delete({ where: { id: questionId } });
  revalidatePath(`/admin/surveys/${surveyId}`);
  return { success: true };
}

export async function activateSurvey(surveyId: string) {
  const auth = await requireOwnedSurvey(surveyId);
  if ("error" in auth) return { error: auth.error };

  await prisma.survey.update({
    where: { id: surveyId },
    data: { status: "active", openAt: new Date() },
  });
  revalidatePath(`/admin/surveys/${surveyId}`);
  revalidatePath("/admin/surveys");
  return { success: true };
}

export async function closeSurvey(surveyId: string) {
  const auth = await requireOwnedSurvey(surveyId);
  if ("error" in auth) return { error: auth.error };

  await prisma.survey.update({
    where: { id: surveyId },
    data: { status: "closed", closeAt: new Date() },
  });
  revalidatePath(`/admin/surveys/${surveyId}`);
  revalidatePath("/admin/surveys");
  return { success: true };
}

export async function deleteSurvey(surveyId: string) {
  const auth = await requireOwnedSurvey(surveyId);
  if ("error" in auth) return { error: auth.error };

  await prisma.survey.delete({ where: { id: surveyId } });
  await recordAudit({
    schoolId: auth.session.schoolId,
    actorType: "admin",
    actorId: auth.session.adminId,
    actorLabel: auth.session.email,
    action: "survey.delete",
    entityType: "survey",
    entityId: surveyId,
  });
  revalidatePath("/admin/surveys");
  return { success: true };
}

export async function resetSurveyForStudent(surveyId: string, studentId: string) {
  const auth = await requireOwnedSurvey(surveyId);
  if ("error" in auth) return { error: auth.error };

  // Ensure student also belongs to the same school
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { schoolId: true },
  });
  if (!student || student.schoolId !== auth.session.schoolId) {
    return { error: "Student not found." };
  }

  await prisma.surveyResponse.deleteMany({
    where: { surveyId, studentId },
  });
  revalidatePath(`/admin/surveys/${surveyId}`);
  return { success: true };
}

// === Student-facing ===

export async function submitSurveyResponse(
  surveyId: string,
  answers: Record<string, string | number>
) {
  const session = await getStudentSession();
  if (!session.studentId) return { error: "Not logged in" };

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: { questions: true },
  });
  if (!survey || survey.status !== "active") return { error: "Survey not active" };

  // Check retake rule
  if (!survey.allowRetake) {
    const existing = await prisma.surveyResponse.findFirst({
      where: { surveyId, studentId: session.studentId },
    });
    if (existing) return { error: "You have already completed this survey" };
  }

  // Moderate free text answers (including any school custom keywords)
  const customKeywords = await prisma.schoolSafeguardingKeyword.findMany({
    where: { schoolId: survey.schoolId },
    select: { keyword: true },
  });
  const customKeywordList = customKeywords.map((k) => k.keyword);

  let flagged = false;
  let flagReason: string | null = null;
  let flaggedText: string | null = null;
  for (const q of survey.questions) {
    if (q.questionType === "free_text") {
      const val = answers[q.id];
      if (typeof val === "string") {
        const mod = moderateText(val, customKeywordList);
        if (mod.flagged) {
          flagged = true;
          flagReason = mod.reason || null;
          flaggedText = val;
          break;
        }
      }
    }
  }

  const surveyResponse = await prisma.surveyResponse.create({
    data: {
      surveyId,
      studentId: survey.anonymous ? null : session.studentId,
      answers: JSON.stringify(answers),
      flagged,
      flagReason,
    },
  });

  // Record + notify safeguarding alert
  if (flagged && flaggedText && flagReason) {
    const school = await prisma.school.findUnique({
      where: { id: survey.schoolId },
    });

    if (school) {
      await prisma.safeguardingAlert.create({
        data: {
          schoolId: school.id,
          type: "survey",
          studentId: survey.anonymous ? null : session.studentId,
          surveyResponseId: surveyResponse.id,
          flagReason,
          flaggedText,
        },
      });

      const { sendSurveySafeguardingAlert, parseEmailList } = await import("@/lib/email");
      const dslRecipients = parseEmailList(school.dslEmail);
      if (dslRecipients.length > 0) {
        const student = survey.anonymous
          ? null
          : await prisma.student.findUnique({
              where: { id: session.studentId },
              select: { firstName: true, lastName: true, yearGroup: true, className: true },
            });

        try {
          await sendSurveySafeguardingAlert({
            dslEmail: dslRecipients,
            schoolName: school.name,
            surveyTitle: survey.title,
            studentName: student ? `${student.firstName} ${student.lastName}` : null,
            yearGroup: student?.yearGroup || null,
            className: student?.className || null,
            flagReason,
            flaggedText,
            anonymous: survey.anonymous,
            surveyId: survey.id,
          });
        } catch (err) {
          console.error("[safeguarding-alert] Failed to send survey alert:", err);
        }
      }
    }
  }

  return { success: true };
}
