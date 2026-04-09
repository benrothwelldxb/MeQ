"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createFramework(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const domainCount = parseInt(formData.get("domainCount") as string) || 0;

  if (!name) return { error: "Framework name is required." };
  if (domainCount < 1) return { error: "At least one domain is required." };

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const existing = await prisma.framework.findUnique({ where: { slug } });
  if (existing) return { error: "A framework with this name already exists." };

  const domains: Array<{ key: string; label: string; color: string; sortOrder: number }> = [];
  for (let i = 0; i < domainCount; i++) {
    const label = (formData.get(`domain_label_${i}`) as string)?.trim();
    const key = (formData.get(`domain_key_${i}`) as string)?.trim() || label?.replace(/\s+/g, "");
    const color = (formData.get(`domain_color_${i}`) as string) || "blue";

    if (!label || !key) continue;
    domains.push({ key, label, color, sortOrder: i });
  }

  if (domains.length === 0) return { error: "At least one valid domain is required." };

  // Create framework with default config
  const defaultConfig = {
    levels: ["Emerging", "Developing", "Secure", "Advanced"],
    tiers: {
      standard: {
        levelThresholds: [
          { level: "Advanced", min: 18 },
          { level: "Secure", min: 15 },
          { level: "Developing", min: 10 },
          { level: "Emerging", min: 0 },
        ],
        overallThresholds: [
          { level: "Advanced", min: Math.round(18 * domains.length) },
          { level: "Secure", min: Math.round(15 * domains.length) },
          { level: "Developing", min: Math.round(10 * domains.length) },
          { level: "Emerging", min: 0 },
        ],
        maxDomainScore: 26,
        maxTotalScore: 26 * domains.length,
      },
      junior: {
        levelThresholds: [
          { level: "Advanced", min: 14 },
          { level: "Secure", min: 11 },
          { level: "Developing", min: 8 },
          { level: "Emerging", min: 0 },
        ],
        overallThresholds: [
          { level: "Advanced", min: Math.round(14 * domains.length) },
          { level: "Secure", min: Math.round(11 * domains.length) },
          { level: "Developing", min: Math.round(8 * domains.length) },
          { level: "Emerging", min: 0 },
        ],
        maxDomainScore: 16,
        maxTotalScore: 16 * domains.length,
      },
    },
  };

  await prisma.framework.create({
    data: {
      name,
      slug,
      description,
      config: JSON.stringify(defaultConfig),
      domains: {
        create: domains,
      },
    },
  });

  revalidatePath("/super/frameworks");
  return { success: true };
}

export async function updateFrameworkConfig(frameworkId: string, config: string) {
  await prisma.framework.update({
    where: { id: frameworkId },
    data: { config },
  });
  revalidatePath(`/super/frameworks/${frameworkId}`);
}

export async function addFrameworkQuestion(
  frameworkId: string,
  data: {
    domainKey: string;
    tier: string;
    prompt: string;
    questionFormat: string;
    answerOptions: string;
    scoreMap: string;
    weight: number;
    type: string;
  }
) {
  // Get next orderIndex for this framework+tier
  const lastQ = await prisma.frameworkQuestion.findFirst({
    where: { frameworkId, tier: data.tier },
    orderBy: { orderIndex: "desc" },
  });
  const orderIndex = (lastQ?.orderIndex ?? 0) + 1;

  await prisma.frameworkQuestion.create({
    data: {
      frameworkId,
      orderIndex,
      ...data,
    },
  });

  revalidatePath(`/super/frameworks/${frameworkId}`);
}

export async function deleteFrameworkQuestion(questionId: string, frameworkId: string) {
  await prisma.frameworkQuestion.delete({ where: { id: questionId } });
  revalidatePath(`/super/frameworks/${frameworkId}`);
}

export async function updateFrameworkDomain(
  domainId: string,
  frameworkId: string,
  data: { label?: string; description?: string; color?: string }
) {
  await prisma.frameworkDomain.update({
    where: { id: domainId },
    data,
  });
  revalidatePath(`/super/frameworks/${frameworkId}`);
}

export async function addFrameworkDomain(
  frameworkId: string,
  data: { key: string; label: string; color: string; description?: string }
) {
  const lastDomain = await prisma.frameworkDomain.findFirst({
    where: { frameworkId },
    orderBy: { sortOrder: "desc" },
  });

  await prisma.frameworkDomain.create({
    data: {
      frameworkId,
      sortOrder: (lastDomain?.sortOrder ?? -1) + 1,
      ...data,
    },
  });
  revalidatePath(`/super/frameworks/${frameworkId}`);
}

export async function deleteFrameworkDomain(domainId: string, frameworkId: string) {
  await prisma.frameworkDomain.delete({ where: { id: domainId } });
  revalidatePath(`/super/frameworks/${frameworkId}`);
}

export async function addFrameworkIntervention(
  frameworkId: string,
  data: { domain: string; level: string; audience: string; title: string; description: string }
) {
  const lastIv = await prisma.intervention.findFirst({
    where: { frameworkId, domain: data.domain, level: data.level, audience: data.audience },
    orderBy: { sortOrder: "desc" },
  });

  await prisma.intervention.create({
    data: {
      ...data,
      tier: "standard",
      frameworkId,
      isDefault: true,
      sortOrder: (lastIv?.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath(`/super/frameworks/${frameworkId}`);
}

export async function deleteFrameworkIntervention(interventionId: string, frameworkId: string) {
  await prisma.intervention.delete({ where: { id: interventionId } });
  revalidatePath(`/super/frameworks/${frameworkId}`);
}
