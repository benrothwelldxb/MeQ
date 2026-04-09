import { prisma } from "./db";

export interface FrameworkConfig {
  levels?: string[];
  tiers?: Record<string, {
    levelThresholds?: Array<{ level: string; min: number }>;
    overallThresholds?: Array<{ level: string; min: number }>;
    maxDomainScore?: number;
    maxTotalScore?: number;
  }>;
  strengthMessages?: Record<string, string>;
  nextSteps?: Record<string, string[]>;
}

export interface DomainDef {
  key: string;
  label: string;
  color: string;
  description: string | null;
  sortOrder: number;
}

export interface ScoringModelDef {
  key: string;
  name: string;
  thresholds: Array<{ level: string; min: number }>;
  overallThresholds: Array<{ level: string; min: number }>;
  maxDomainScore: number;
  maxTotalScore: number;
}

export interface FrameworkData {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  config: FrameworkConfig;
  domains: DomainDef[];
  scoringModels: Record<string, ScoringModelDef>;
  messages: Record<string, Record<string, string[]>>; // domainKey -> messageType -> contents
}

/**
 * Get framework data for a school. Always returns a framework —
 * falls back to the default MeQ Standard if school has none set.
 */
export async function getSchoolFramework(schoolId: string): Promise<FrameworkData> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { frameworkId: true },
  });

  const frameworkId = school?.frameworkId;

  const framework = frameworkId
    ? await prisma.framework.findUnique({
        where: { id: frameworkId },
        include: {
          domains: { orderBy: { sortOrder: "asc" }, include: { messages: true } },
          scoringModels: true,
        },
      })
    : null;

  // Fall back to default framework
  const fw = framework || await prisma.framework.findFirst({
    where: { isDefault: true },
    include: {
      domains: { orderBy: { sortOrder: "asc" }, include: { messages: true } },
      scoringModels: true,
    },
  });

  if (!fw) {
    throw new Error("No framework found. Run the seed to create the default framework.");
  }

  // Build scoring models map
  const scoringModels: Record<string, ScoringModelDef> = {};
  for (const sm of fw.scoringModels) {
    scoringModels[sm.key] = {
      key: sm.key,
      name: sm.name,
      thresholds: JSON.parse(sm.thresholds),
      overallThresholds: JSON.parse(sm.overallThresholds),
      maxDomainScore: sm.maxDomainScore,
      maxTotalScore: sm.maxTotalScore,
    };
  }

  // Fall back to config JSON if no scoring models yet (migration transitional)
  if (Object.keys(scoringModels).length === 0 && fw.config) {
    const config = JSON.parse(fw.config) as FrameworkConfig;
    if (config.tiers) {
      for (const [key, tier] of Object.entries(config.tiers)) {
        scoringModels[key] = {
          key,
          name: key === "standard" ? "Standard (8-11)" : "Junior (5-7)",
          thresholds: tier.levelThresholds || [],
          overallThresholds: tier.overallThresholds || [],
          maxDomainScore: tier.maxDomainScore || 26,
          maxTotalScore: tier.maxTotalScore || 130,
        };
      }
    }
  }

  // Build messages map
  const messages: Record<string, Record<string, string[]>> = {};
  for (const domain of fw.domains) {
    messages[domain.key] = {};
    for (const msg of domain.messages) {
      if (!messages[domain.key][msg.messageType]) {
        messages[domain.key][msg.messageType] = [];
      }
      messages[domain.key][msg.messageType].push(msg.content);
    }
  }

  // Fall back to config JSON messages
  if (Object.keys(messages).every((k) => Object.keys(messages[k]).length === 0)) {
    const config = JSON.parse(fw.config || "{}") as FrameworkConfig;
    if (config.strengthMessages) {
      for (const [key, msg] of Object.entries(config.strengthMessages)) {
        if (!messages[key]) messages[key] = {};
        messages[key]["strength"] = [msg];
      }
    }
    if (config.nextSteps) {
      for (const [key, steps] of Object.entries(config.nextSteps)) {
        if (!messages[key]) messages[key] = {};
        messages[key]["next_step"] = steps;
      }
    }
  }

  return {
    id: fw.id,
    name: fw.name,
    slug: fw.slug,
    isDefault: fw.isDefault,
    config: JSON.parse(fw.config || "{}"),
    domains: fw.domains.map((d) => ({
      key: d.key,
      label: d.label,
      color: d.color,
      description: d.description,
      sortOrder: d.sortOrder,
    })),
    scoringModels,
    messages,
  };
}

/**
 * Get framework from an assessment's frameworkId, or fall back to school's framework.
 */
export async function getAssessmentFramework(
  assessmentFrameworkId: string | null,
  schoolId: string
): Promise<FrameworkData> {
  if (assessmentFrameworkId) {
    const fw = await prisma.framework.findUnique({
      where: { id: assessmentFrameworkId },
      include: {
        domains: { orderBy: { sortOrder: "asc" }, include: { messages: true } },
        scoringModels: true,
      },
    });
    if (fw) {
      // Reuse the same building logic
      return getSchoolFramework(assessmentFrameworkId); // this will find by frameworkId
    }
  }
  return getSchoolFramework(schoolId);
}

/**
 * Load quiz questions for a framework.
 */
export async function getFrameworkQuestions(frameworkId: string, tier: string) {
  return prisma.frameworkQuestion.findMany({
    where: { frameworkId, tier },
    orderBy: { orderIndex: "asc" },
  });
}

/**
 * Get a level from thresholds array.
 */
export function getLevelFromThresholds(
  score: number,
  thresholds: Array<{ level: string; min: number }>
): string {
  for (const { level, min } of thresholds) {
    if (score >= min) return level;
  }
  return thresholds[thresholds.length - 1]?.level || "Emerging";
}
