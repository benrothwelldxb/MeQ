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

export interface FrameworkData {
  id: string;
  name: string;
  config: FrameworkConfig;
  domains: Array<{
    key: string;
    label: string;
    color: string;
    description: string | null;
  }>;
}

/**
 * Get framework data for a school. Returns null if the school
 * uses the default MeQ Standard framework (handled by existing constants).
 */
export async function getSchoolFramework(schoolId: string): Promise<FrameworkData | null> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { frameworkId: true },
  });

  if (!school?.frameworkId) return null;

  const framework = await prisma.framework.findUnique({
    where: { id: school.frameworkId },
    include: {
      domains: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!framework || framework.isDefault) return null;

  return {
    id: framework.id,
    name: framework.name,
    config: JSON.parse(framework.config) as FrameworkConfig,
    domains: framework.domains.map((d) => ({
      key: d.key,
      label: d.label,
      color: d.color,
      description: d.description,
    })),
  };
}

/**
 * Load quiz questions for a framework. Falls back to legacy Question model
 * if no custom framework or no framework questions exist.
 */
export async function getFrameworkQuestions(frameworkId: string, tier: string) {
  return prisma.frameworkQuestion.findMany({
    where: { frameworkId, tier },
    orderBy: { orderIndex: "asc" },
  });
}
