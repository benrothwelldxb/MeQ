"use server";

import { prisma } from "@/lib/db";
import { parse } from "csv-parse/sync";
import { revalidatePath } from "next/cache";

// === INTERVENTIONS BULK UPLOAD ===

export async function uploadFrameworkInterventions(
  frameworkId: string,
  csvText: string
) {
  let records: Array<Record<string, string>>;
  try {
    records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    return { error: "Could not parse CSV." };
  }

  if (records.length === 0) return { error: "CSV is empty." };

  // Required columns
  const findCol = (names: string[]) => {
    return Object.keys(records[0]).find((k) => names.includes(k.toLowerCase().trim()));
  };

  const domainCol = findCol(["domain", "domain_key"]);
  const levelCol = findCol(["level"]);
  const audienceCol = findCol(["audience"]);
  const tierCol = findCol(["tier"]);
  const titleCol = findCol(["title"]);
  const descCol = findCol(["description", "desc"]);

  if (!domainCol || !levelCol || !titleCol || !descCol) {
    return { error: "CSV must have columns: domain, level, title, description (audience and tier optional — audience defaults to teacher, tier defaults to standard)" };
  }

  // Validate framework + build domain lookup
  const framework = await prisma.framework.findUnique({
    where: { id: frameworkId },
    include: { domains: true },
  });
  if (!framework) return { error: "Framework not found." };

  const keySet = new Set(framework.domains.map((d) => d.key));
  const labelToKey: Record<string, string> = {};
  for (const d of framework.domains) {
    labelToKey[d.label.toLowerCase()] = d.key;
    labelToKey[d.key.toLowerCase()] = d.key;
  }

  const resolveDomain = (input: string): string | null => {
    if (keySet.has(input)) return input;
    return labelToKey[input.toLowerCase()] || null;
  };

  const VALID_LEVELS = ["Emerging", "Developing", "Secure", "Advanced"];
  const VALID_AUDIENCES = ["teacher", "student"];
  const VALID_TIERS = ["standard", "junior"];

  let created = 0;
  const errors: string[] = [];
  const validLabels = framework.domains.map((d) => `${d.label} (${d.key})`).join(", ");

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const domainRaw = row[domainCol]?.trim();
    const level = row[levelCol]?.trim();
    const audience = audienceCol ? (row[audienceCol]?.trim().toLowerCase() || "teacher") : "teacher";
    const tier = tierCol ? (row[tierCol]?.trim().toLowerCase() || "standard") : "standard";
    const title = row[titleCol]?.trim();
    const description = row[descCol]?.trim();

    if (!domainRaw || !level || !title || !description) {
      errors.push(`Row ${i + 2}: Missing required fields`);
      continue;
    }

    const domain = resolveDomain(domainRaw);
    if (!domain) {
      errors.push(`Row ${i + 2}: Unknown domain "${domainRaw}". Valid: ${validLabels}`);
      continue;
    }

    if (!VALID_LEVELS.includes(level)) {
      errors.push(`Row ${i + 2}: Invalid level "${level}". Must be: ${VALID_LEVELS.join(", ")}`);
      continue;
    }

    if (!VALID_AUDIENCES.includes(audience)) {
      errors.push(`Row ${i + 2}: Invalid audience "${audience}". Must be: ${VALID_AUDIENCES.join(", ")}`);
      continue;
    }

    if (!VALID_TIERS.includes(tier)) {
      errors.push(`Row ${i + 2}: Invalid tier "${tier}". Must be: ${VALID_TIERS.join(", ")}`);
      continue;
    }

    const lastIv = await prisma.intervention.findFirst({
      where: { frameworkId, domain, level, audience, tier },
      orderBy: { sortOrder: "desc" },
    });

    await prisma.intervention.create({
      data: {
        frameworkId,
        domain,
        level,
        audience,
        tier,
        title,
        description,
        isDefault: true,
        sortOrder: (lastIv?.sortOrder ?? -1) + 1,
      },
    });
    created++;
  }

  revalidatePath(`/super/frameworks/${frameworkId}`);
  return {
    success: true,
    count: created,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// === PULSE QUESTIONS BULK UPLOAD ===

export async function uploadFrameworkPulseQuestions(
  frameworkId: string,
  csvText: string
) {
  let records: Array<Record<string, string>>;
  try {
    records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    return { error: "Could not parse CSV." };
  }

  if (records.length === 0) return { error: "CSV is empty." };

  const findCol = (names: string[]) => {
    return Object.keys(records[0]).find((k) => names.includes(k.toLowerCase().trim()));
  };

  const domainCol = findCol(["domain", "domain_key"]);
  const tierCol = findCol(["tier"]);
  const promptCol = findCol(["prompt", "question", "text"]);
  const emojiCol = findCol(["emoji"]);

  if (!domainCol || !promptCol) {
    return { error: "CSV must have columns: domain, prompt (tier and emoji optional)" };
  }

  const framework = await prisma.framework.findUnique({
    where: { id: frameworkId },
    include: { domains: true },
  });
  if (!framework) return { error: "Framework not found." };

  const keySet = new Set(framework.domains.map((d) => d.key));
  const labelToKey: Record<string, string> = {};
  for (const d of framework.domains) {
    labelToKey[d.label.toLowerCase()] = d.key;
    labelToKey[d.key.toLowerCase()] = d.key;
  }

  const resolveDomain = (input: string): string | null => {
    if (keySet.has(input)) return input;
    return labelToKey[input.toLowerCase()] || null;
  };

  const VALID_TIERS = ["standard", "junior"];

  let created = 0;
  const errors: string[] = [];
  const validLabels = framework.domains.map((d) => `${d.label} (${d.key})`).join(", ");

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const domainRaw = row[domainCol]?.trim();
    const prompt = row[promptCol]?.trim();
    const tier = tierCol ? (row[tierCol]?.trim().toLowerCase() || "standard") : "standard";
    const emoji = emojiCol ? row[emojiCol]?.trim() || null : null;

    if (!domainRaw || !prompt) {
      errors.push(`Row ${i + 2}: Missing domain or prompt`);
      continue;
    }

    const domain = resolveDomain(domainRaw);
    if (!domain) {
      errors.push(`Row ${i + 2}: Unknown domain "${domainRaw}". Valid: ${validLabels}`);
      continue;
    }

    if (!VALID_TIERS.includes(tier)) {
      errors.push(`Row ${i + 2}: Invalid tier "${tier}". Must be: ${VALID_TIERS.join(", ")}`);
      continue;
    }

    // Upsert by (framework, tier, domain) — one pulse question per domain per tier
    const existing = await prisma.pulseQuestion.findFirst({
      where: { frameworkId, tier, domain },
    });

    const lastOrder = await prisma.pulseQuestion.findFirst({
      where: { frameworkId, tier },
      orderBy: { orderIndex: "desc" },
    });

    if (existing) {
      await prisma.pulseQuestion.update({
        where: { id: existing.id },
        data: { prompt, emoji },
      });
    } else {
      await prisma.pulseQuestion.create({
        data: {
          frameworkId,
          domain,
          tier,
          prompt,
          emoji,
          orderIndex: (lastOrder?.orderIndex ?? 0) + 1,
        },
      });
    }
    created++;
  }

  revalidatePath(`/super/frameworks/${frameworkId}`);
  return {
    success: true,
    count: created,
    errors: errors.length > 0 ? errors : undefined,
  };
}
