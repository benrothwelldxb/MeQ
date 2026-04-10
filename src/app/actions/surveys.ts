"use server";

import { prisma } from "@/lib/db";
import { getAdminSession, getStudentSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { SURVEY_TEMPLATES, moderateText } from "@/lib/surveys";

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
  const session = await getAdminSession();
  if (!session.schoolId) return;

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
}

export async function addSurveyQuestion(
  surveyId: string,
  data: { prompt: string; questionType: string; options?: string[]; required?: boolean }
) {
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
}

export async function deleteSurveyQuestion(questionId: string, surveyId: string) {
  await prisma.surveyQuestion.delete({ where: { id: questionId } });
  revalidatePath(`/admin/surveys/${surveyId}`);
}

export async function activateSurvey(surveyId: string) {
  await prisma.survey.update({
    where: { id: surveyId },
    data: { status: "active", openAt: new Date() },
  });
  revalidatePath(`/admin/surveys/${surveyId}`);
  revalidatePath("/admin/surveys");
}

export async function closeSurvey(surveyId: string) {
  await prisma.survey.update({
    where: { id: surveyId },
    data: { status: "closed", closeAt: new Date() },
  });
  revalidatePath(`/admin/surveys/${surveyId}`);
  revalidatePath("/admin/surveys");
}

export async function deleteSurvey(surveyId: string) {
  await prisma.survey.delete({ where: { id: surveyId } });
  revalidatePath("/admin/surveys");
}

export async function resetSurveyForStudent(surveyId: string, studentId: string) {
  const session = await getAdminSession();
  if (!session.schoolId) return;

  await prisma.surveyResponse.deleteMany({
    where: { surveyId, studentId },
  });
  revalidatePath(`/admin/surveys/${surveyId}`);
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

  // Moderate free text answers
  let flagged = false;
  let flagReason: string | null = null;
  for (const q of survey.questions) {
    if (q.questionType === "free_text") {
      const val = answers[q.id];
      if (typeof val === "string") {
        const mod = moderateText(val);
        if (mod.flagged) {
          flagged = true;
          flagReason = mod.reason || null;
          break;
        }
      }
    }
  }

  await prisma.surveyResponse.create({
    data: {
      surveyId,
      studentId: survey.anonymous ? null : session.studentId,
      answers: JSON.stringify(answers),
      flagged,
      flagReason,
    },
  });

  return { success: true };
}
