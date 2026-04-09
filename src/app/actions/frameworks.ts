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
