"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { parseEmailList } from "@/lib/email";
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

  revalidatePath("/admin/safeguarding");
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
