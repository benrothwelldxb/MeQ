import { prisma } from "./db";

export async function getInterventions(
  domain: string,
  level: string,
  tier: string,
  audience: "student" | "teacher"
) {
  return prisma.intervention.findMany({
    where: { domain, level, tier, audience },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getInterventionsForDomains(
  domainLevels: Record<string, string>,
  tier: string,
  audience: "student" | "teacher"
) {
  const results: Record<string, Awaited<ReturnType<typeof getInterventions>>> = {};

  for (const [domain, level] of Object.entries(domainLevels)) {
    results[domain] = await getInterventions(domain, level, tier, audience);
  }

  return results;
}
