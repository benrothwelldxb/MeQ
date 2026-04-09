import { prisma } from "./db";

export async function getInterventions(
  domain: string,
  level: string,
  tier: string,
  audience: "student" | "teacher",
  frameworkId?: string | null
) {
  return prisma.intervention.findMany({
    where: {
      domain,
      level,
      tier,
      audience,
      ...(frameworkId ? { frameworkId } : {}),
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getInterventionsForDomains(
  domainLevels: Record<string, string>,
  tier: string,
  audience: "student" | "teacher",
  frameworkId?: string | null
) {
  const results: Record<string, Awaited<ReturnType<typeof getInterventions>>> = {};

  for (const [domain, level] of Object.entries(domainLevels)) {
    results[domain] = await getInterventions(domain, level, tier, audience, frameworkId);
  }

  return results;
}
