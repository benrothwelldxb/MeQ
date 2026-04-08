"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createIntervention(formData: FormData) {
  const session = await getAdminSession();
  const domain = formData.get("domain") as string;
  const level = formData.get("level") as string;
  const tier = (formData.get("tier") as string) || "standard";
  const audience = formData.get("audience") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  if (!domain || !level || !audience || !title || !description) {
    return { error: "All fields are required." };
  }

  await prisma.intervention.create({
    data: { domain, level, tier, audience, title, description, isDefault: false, schoolId: session.schoolId },
  });

  revalidatePath("/admin/settings/interventions");
  return { success: true };
}

export async function deleteIntervention(id: string) {
  await prisma.intervention.delete({ where: { id } });
  revalidatePath("/admin/settings/interventions");
}
