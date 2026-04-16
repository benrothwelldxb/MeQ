"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { parseEmailList } from "@/lib/email";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

/** Returns the logged-in admin and confirms they're a DSL for their school. */
async function requireDslAdmin() {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized." as const };

  const [admin, school] = await Promise.all([
    prisma.admin.findUnique({ where: { id: session.adminId }, select: { email: true } }),
    prisma.school.findUnique({ where: { id: session.schoolId }, select: { dslEmail: true } }),
  ]);
  if (!admin || !school) return { error: "Unauthorized." as const };

  const dslEmails = parseEmailList(school.dslEmail);
  if (!dslEmails.includes(admin.email.toLowerCase())) {
    return { error: "Only Designated Safeguarding Leads can action alerts." as const };
  }
  return { session, adminEmail: admin.email };
}

export async function resolveSafeguardingAlert(
  alertId: string,
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const auth = await requireDslAdmin();
  if ("error" in auth) return { error: auth.error };

  const status = (formData.get("status") as string) || "resolved";
  const notes = ((formData.get("notes") as string) || "").trim() || null;

  if (!["resolved", "dismissed"].includes(status)) {
    return { error: "Invalid status." };
  }

  const alert = await prisma.safeguardingAlert.findUnique({ where: { id: alertId } });
  if (!alert || alert.schoolId !== auth.session.schoolId) {
    return { error: "Alert not found." };
  }

  await prisma.safeguardingAlert.update({
    where: { id: alertId },
    data: {
      status,
      notes,
      resolvedAt: new Date(),
      resolvedByAdminId: auth.session.adminId,
    },
  });

  await recordAudit({
    schoolId: auth.session.schoolId,
    actorType: "admin",
    actorId: auth.session.adminId,
    actorLabel: auth.adminEmail,
    action: status === "resolved" ? "alert.resolve" : "alert.dismiss",
    entityType: "safeguarding_alert",
    entityId: alertId,
    meta: notes ? { notes } : undefined,
  });

  revalidatePath("/admin/safeguarding");
  return { success: true };
}

const RESERVED_KEYWORDS = new Set(
  // Prevent duplicates with platform-level keywords (exported from lib/surveys)
  [
    "kill myself", "kill my self", "suicide", "suicidal", "end my life", "want to die",
    "hurt myself", "cut myself", "cutting myself", "self harm", "self-harm", "harm myself",
    "abuse", "abused", "abusing", "hit me", "hits me", "hurts me", "touching me",
    "inappropriate touching", "hurt at home",
    "bullied every day", "hate myself", "no one likes me", "nobody likes me",
    "run away", "running away", "starving", "not eating",
  ]
);

export async function addCustomKeyword(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const auth = await requireDslAdmin();
  if ("error" in auth) return { error: auth.error };

  const raw = ((formData.get("keyword") as string) || "").trim().toLowerCase();
  if (!raw) return { error: "Enter a keyword." };
  if (raw.length < 3) return { error: "Keyword must be at least 3 characters." };
  if (raw.length > 100) return { error: "Keyword is too long." };
  if (RESERVED_KEYWORDS.has(raw)) {
    return { error: "That keyword is already in the platform default list." };
  }

  const existing = await prisma.schoolSafeguardingKeyword.findFirst({
    where: { schoolId: auth.session.schoolId, keyword: raw },
  });
  if (existing) return { error: "This keyword is already in your list." };

  await prisma.schoolSafeguardingKeyword.create({
    data: {
      schoolId: auth.session.schoolId,
      keyword: raw,
      addedByAdminId: auth.session.adminId,
    },
  });

  revalidatePath("/admin/safeguarding/policy");
  return { success: true };
}

export async function removeCustomKeyword(keywordId: string) {
  const auth = await requireDslAdmin();
  if ("error" in auth) return { error: auth.error };

  const keyword = await prisma.schoolSafeguardingKeyword.findUnique({
    where: { id: keywordId },
  });
  if (!keyword || keyword.schoolId !== auth.session.schoolId) {
    return { error: "Keyword not found." };
  }

  await prisma.schoolSafeguardingKeyword.delete({ where: { id: keywordId } });
  revalidatePath("/admin/safeguarding/policy");
  return { success: true };
}

export async function reopenSafeguardingAlert(alertId: string) {
  const auth = await requireDslAdmin();
  if ("error" in auth) return { error: auth.error };

  const alert = await prisma.safeguardingAlert.findUnique({ where: { id: alertId } });
  if (!alert || alert.schoolId !== auth.session.schoolId) {
    return { error: "Alert not found." };
  }

  await prisma.safeguardingAlert.update({
    where: { id: alertId },
    data: { status: "open", resolvedAt: null, resolvedByAdminId: null, notes: null },
  });

  revalidatePath("/admin/safeguarding");
  return { success: true };
}
