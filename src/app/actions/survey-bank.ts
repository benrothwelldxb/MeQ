"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { parseStringArray } from "@/lib/json";
import { revalidatePath } from "next/cache";

export interface BankQuestionView {
  id: string;
  prompt: string;
  description: string | null;
  questionType: string;
  defaultOptions: string[] | null;
  category: string;
  subcategory: string | null;
  domainKey: string | null;
  ageTags: string[];
  source: string | null;
  isSchoolCustom: boolean;
}

/**
 * Returns all bank questions visible to this admin: platform defaults +
 * the school's own custom questions. Sorted by category then prompt for a
 * predictable picker order.
 */
export async function listBankQuestions(): Promise<BankQuestionView[]> {
  const session = await getAdminSession();
  if (!session.adminId) return [];

  const rows = await prisma.surveyBankQuestion.findMany({
    where: {
      OR: [
        { isDefault: true, schoolId: null },
        { schoolId: session.schoolId },
      ],
    },
    orderBy: [{ category: "asc" }, { prompt: "asc" }],
  });

  return rows.map((r) => {
    const ageTags = parseStringArray(r.ageTags);
    return {
      id: r.id,
      prompt: r.prompt,
      description: r.description,
      questionType: r.questionType,
      defaultOptions: r.defaultOptions ? parseStringArray(r.defaultOptions) : null,
      category: r.category,
      subcategory: r.subcategory,
      domainKey: r.domainKey,
      ageTags: ageTags.length > 0 ? ageTags : ["junior", "standard"],
      source: r.source,
      isSchoolCustom: r.schoolId === session.schoolId,
    };
  });
}

/**
 * School-side: save an existing survey question into the school's own bank
 * so it can be reused across future surveys.
 */
export async function saveQuestionToSchoolBank(params: {
  prompt: string;
  questionType: string;
  options?: string[] | null;
  category: string;
  subcategory?: string | null;
}) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized" as const };

  const prompt = params.prompt.trim();
  if (!prompt) return { error: "Prompt is required" as const };
  const category = params.category.trim() || "Custom";

  // Avoid duplicates within the same school.
  const existing = await prisma.surveyBankQuestion.findFirst({
    where: { schoolId: session.schoolId, prompt },
  });
  if (existing) return { error: "Already in your bank" as const };

  await prisma.surveyBankQuestion.create({
    data: {
      prompt,
      questionType: params.questionType,
      defaultOptions: params.options ? JSON.stringify(params.options) : null,
      category,
      subcategory: params.subcategory ?? null,
      ageTags: JSON.stringify(["junior", "standard"]),
      isDefault: false,
      schoolId: session.schoolId,
    },
  });

  await recordAudit({
    schoolId: session.schoolId,
    actorType: "admin",
    actorId: session.adminId,
    actorLabel: session.email,
    action: "bank_question.create",
    entityType: "bank_question",
    meta: { prompt: prompt.slice(0, 80) },
  });

  revalidatePath("/admin/settings/question-bank");
  return { success: true as const };
}

export async function deleteSchoolBankQuestion(bankQuestionId: string) {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized" as const };

  const row = await prisma.surveyBankQuestion.findUnique({ where: { id: bankQuestionId } });
  if (!row) return { error: "Not found" as const };
  // Schools can only delete their own custom rows, never platform defaults.
  if (row.isDefault || row.schoolId !== session.schoolId) {
    return { error: "Not allowed" as const };
  }

  await prisma.surveyBankQuestion.delete({ where: { id: bankQuestionId } });
  revalidatePath("/admin/settings/question-bank");
  return { success: true as const };
}

export async function getCategories(): Promise<string[]> {
  const session = await getAdminSession();
  if (!session.adminId) return [];

  const rows = await prisma.surveyBankQuestion.findMany({
    where: {
      OR: [
        { isDefault: true, schoolId: null },
        { schoolId: session.schoolId },
      ],
    },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category);
}
