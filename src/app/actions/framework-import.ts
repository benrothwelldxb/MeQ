"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { validateFrameworkJson, type FrameworkImportJson } from "@/lib/framework-import";

const DEFAULT_ANSWER_OPTIONS = JSON.stringify([
  { label: "Not like me at all", value: 1 },
  { label: "A little like me", value: 2 },
  { label: "Quite like me", value: 3 },
  { label: "Very much like me", value: 4 },
]);
const DEFAULT_SCORE_MAP = JSON.stringify({ "1": 0, "2": 1, "3": 2, "4": 3 });
const REVERSE_SCORE_MAP = JSON.stringify({ "1": 3, "2": 2, "3": 1, "4": 0 });

export async function validateFrameworkImport(jsonText: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    return {
      valid: false,
      errors: [`Invalid JSON: ${(e as Error).message}`],
      warnings: [],
    };
  }
  return validateFrameworkJson(parsed);
}

export async function importFramework(jsonText: string, schoolIdsToAssign: string[] = []) {
  let parsed: FrameworkImportJson;
  try {
    parsed = JSON.parse(jsonText) as FrameworkImportJson;
  } catch (e) {
    return { error: `Invalid JSON: ${(e as Error).message}` };
  }

  const validation = validateFrameworkJson(parsed);
  if (!validation.valid) {
    return { error: "Validation failed", errors: validation.errors };
  }

  // Generate slug from name
  const baseSlug = parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let slug = parsed.slug || baseSlug;

  // Ensure unique slug
  let suffix = 1;
  while (await prisma.framework.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  // Build config JSON for backward compat
  const config = parsed.scoring
    ? JSON.stringify({
        levels: ["Emerging", "Developing", "Secure", "Advanced"],
        tiers: parsed.scoring,
      })
    : "{}";

  // Create the framework
  const framework = await prisma.framework.create({
    data: {
      name: parsed.name,
      slug,
      description: parsed.description || null,
      config,
      assessmentFrequency: parsed.assessmentFrequency || "termly",
      activeTerms: JSON.stringify(parsed.activeTerms || ["term1", "term2", "term3"]),
    },
  });

  // Create domains
  const domainIdByKey: Record<string, string> = {};
  const domainKeyByLabel: Record<string, string> = {};
  for (let i = 0; i < parsed.domains.length; i++) {
    const d = parsed.domains[i];
    const created = await prisma.frameworkDomain.create({
      data: {
        frameworkId: framework.id,
        key: d.key,
        label: d.label,
        description: d.description || null,
        color: d.color || "blue",
        sortOrder: d.sortOrder ?? i,
      },
    });
    domainIdByKey[d.key] = created.id;
    domainKeyByLabel[d.label.toLowerCase()] = d.key;
  }

  const resolveDomain = (input: string): string | null => {
    if (domainIdByKey[input]) return input;
    return domainKeyByLabel[input.toLowerCase()] || null;
  };

  // Create scoring models
  if (parsed.scoring) {
    for (const [tierKey, tierConfig] of Object.entries(parsed.scoring)) {
      if (!tierConfig) continue;
      await prisma.frameworkScoringModel.create({
        data: {
          frameworkId: framework.id,
          key: tierKey,
          name: tierKey === "standard" ? "Standard (8-11)" : "Junior (5-7)",
          thresholds: JSON.stringify(tierConfig.levelThresholds),
          overallThresholds: JSON.stringify(tierConfig.overallThresholds),
          maxDomainScore: tierConfig.maxDomainScore,
          maxTotalScore: tierConfig.maxTotalScore,
        },
      });
    }
  }

  // Create questions
  const orderIndexByTier: Record<string, number> = { standard: 0, junior: 0 };
  for (const q of parsed.questions) {
    const domainKey = resolveDomain(q.domain);
    if (!domainKey) continue;
    orderIndexByTier[q.tier] = (orderIndexByTier[q.tier] ?? 0) + 1;
    await prisma.frameworkQuestion.create({
      data: {
        frameworkId: framework.id,
        domainKey,
        tier: q.tier,
        orderIndex: q.orderIndex ?? orderIndexByTier[q.tier],
        prompt: q.prompt,
        type: q.type || "core",
        questionFormat: q.questionFormat || "self-report",
        answerOptions: q.answerOptions ? JSON.stringify(q.answerOptions) : DEFAULT_ANSWER_OPTIONS,
        scoreMap: q.scoreMap
          ? JSON.stringify(q.scoreMap)
          : q.reverse
          ? REVERSE_SCORE_MAP
          : DEFAULT_SCORE_MAP,
        weight: q.weight ?? 1.0,
        isValidation: q.isValidation ?? q.type === "validation",
        isTrap: q.isTrap ?? q.type === "trap",
        validationPair: q.validationPair ?? null,
      },
    });
  }

  // Create pulse questions
  if (parsed.pulseQuestions) {
    const pulseOrderByTier: Record<string, number> = { standard: 0, junior: 0 };
    for (const pq of parsed.pulseQuestions) {
      const domainKey = resolveDomain(pq.domain);
      if (!domainKey) continue;
      pulseOrderByTier[pq.tier] = (pulseOrderByTier[pq.tier] ?? 0) + 1;
      await prisma.pulseQuestion.create({
        data: {
          frameworkId: framework.id,
          tier: pq.tier,
          domain: domainKey,
          prompt: pq.prompt,
          emoji: pq.emoji || null,
          orderIndex: pulseOrderByTier[pq.tier],
        },
      });
    }
  }

  // Create interventions
  if (parsed.interventions) {
    const ivSortByGroup: Record<string, number> = {};
    for (const iv of parsed.interventions) {
      const domainKey = resolveDomain(iv.domain);
      if (!domainKey) continue;
      const tier = iv.tier ?? "standard";
      const groupKey = `${domainKey}-${iv.level}-${iv.audience}-${tier}`;
      ivSortByGroup[groupKey] = (ivSortByGroup[groupKey] ?? -1) + 1;
      await prisma.intervention.create({
        data: {
          frameworkId: framework.id,
          domain: domainKey,
          level: iv.level,
          audience: iv.audience,
          title: iv.title,
          description: iv.description,
          tier,
          isDefault: true,
          sortOrder: ivSortByGroup[groupKey],
        },
      });
    }
  }

  // Create domain messages
  if (parsed.messages) {
    const msgSortByDomain: Record<string, number> = {};
    for (const m of parsed.messages) {
      const domainKey = resolveDomain(m.domain);
      if (!domainKey) continue;
      const domainRecord = await prisma.frameworkDomain.findUnique({
        where: { frameworkId_key: { frameworkId: framework.id, key: domainKey } },
      });
      if (!domainRecord) continue;
      const sortKey = `${domainKey}-${m.type}`;
      msgSortByDomain[sortKey] = (msgSortByDomain[sortKey] ?? -1) + 1;
      await prisma.frameworkDomainMessage.create({
        data: {
          frameworkDomainId: domainRecord.id,
          messageType: m.type,
          content: m.content,
          sortOrder: msgSortByDomain[sortKey],
        },
      });
    }
  }

  // Assign to schools (if specified)
  if (schoolIdsToAssign.length > 0) {
    for (const schoolId of schoolIdsToAssign) {
      await prisma.frameworkAssignment.create({
        data: { frameworkId: framework.id, schoolId },
      });
    }
  }

  revalidatePath("/super/frameworks");
  return {
    success: true,
    frameworkId: framework.id,
    summary: validation.summary,
  };
}

export async function exportFrameworkJson(frameworkId: string) {
  const framework = await prisma.framework.findUnique({
    where: { id: frameworkId },
    include: {
      domains: {
        orderBy: { sortOrder: "asc" },
        include: { messages: true },
      },
      questions: { orderBy: [{ tier: "asc" }, { orderIndex: "asc" }] },
      interventions: { orderBy: [{ domain: "asc" }, { level: "asc" }, { sortOrder: "asc" }] },
      pulseQuestions: { orderBy: [{ tier: "asc" }, { orderIndex: "asc" }] },
      scoringModels: true,
    },
  });

  if (!framework) return null;

  const scoring: FrameworkImportJson["scoring"] = {};
  for (const sm of framework.scoringModels) {
    scoring[sm.key as "standard" | "junior"] = {
      levelThresholds: JSON.parse(sm.thresholds),
      overallThresholds: JSON.parse(sm.overallThresholds),
      maxDomainScore: sm.maxDomainScore,
      maxTotalScore: sm.maxTotalScore,
    };
  }

  const domainLabelByKey: Record<string, string> = {};
  for (const d of framework.domains) domainLabelByKey[d.key] = d.label;

  const exported: FrameworkImportJson = {
    name: framework.name,
    slug: framework.slug,
    description: framework.description || undefined,
    assessmentFrequency: framework.assessmentFrequency as FrameworkImportJson["assessmentFrequency"],
    activeTerms: JSON.parse(framework.activeTerms),
    domains: framework.domains.map((d) => ({
      key: d.key,
      label: d.label,
      description: d.description || undefined,
      color: d.color,
      sortOrder: d.sortOrder,
    })),
    scoring: Object.keys(scoring).length > 0 ? scoring : undefined,
    questions: framework.questions.map((q) => ({
      tier: q.tier as "standard" | "junior",
      domain: q.domainKey,
      orderIndex: q.orderIndex,
      prompt: q.prompt,
      type: q.type as "core" | "validation" | "trap",
      questionFormat: q.questionFormat,
      answerOptions: JSON.parse(q.answerOptions),
      scoreMap: JSON.parse(q.scoreMap),
      weight: q.weight,
      isValidation: q.isValidation,
      isTrap: q.isTrap,
      validationPair: q.validationPair || undefined,
    })),
    pulseQuestions: framework.pulseQuestions.map((pq) => ({
      tier: pq.tier as "standard" | "junior",
      domain: pq.domain,
      prompt: pq.prompt,
      emoji: pq.emoji || undefined,
    })),
    interventions: framework.interventions.map((iv) => ({
      domain: iv.domain,
      level: iv.level as "Emerging" | "Developing" | "Secure" | "Advanced",
      tier: iv.tier as "standard" | "junior",
      audience: iv.audience as "teacher" | "student",
      title: iv.title,
      description: iv.description,
    })),
    messages: framework.domains.flatMap((d) =>
      d.messages.map((m) => ({
        domain: d.key,
        type: m.messageType as "strength" | "strength_junior" | "next_step" | "next_step_junior" | "pulse_tip",
        content: m.content,
      }))
    ),
  };

  return exported;
}

// === Assignment management ===

export async function assignFrameworkToSchool(frameworkId: string, schoolId: string) {
  await prisma.frameworkAssignment.upsert({
    where: { frameworkId_schoolId: { frameworkId, schoolId } },
    update: {},
    create: { frameworkId, schoolId },
  });
  revalidatePath(`/super/frameworks/${frameworkId}`);
}

export async function unassignFrameworkFromSchool(frameworkId: string, schoolId: string) {
  await prisma.frameworkAssignment.deleteMany({
    where: { frameworkId, schoolId },
  });
  revalidatePath(`/super/frameworks/${frameworkId}`);
}
