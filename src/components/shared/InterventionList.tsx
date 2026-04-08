import { prisma } from "@/lib/db";

export default async function InterventionList({
  domain,
  level,
  tier,
  audience,
}: {
  domain: string;
  level: string;
  tier: string;
  audience: "student" | "teacher";
}) {
  const interventions = await prisma.intervention.findMany({
    where: { domain, level, tier, audience },
    orderBy: { sortOrder: "asc" },
    take: 3,
  });

  if (interventions.length === 0) return null;

  return (
    <ul className="space-y-2">
      {interventions.map((iv) => (
        <li key={iv.id} className="flex items-start gap-2">
          <span className="text-meq-sky mt-0.5 flex-shrink-0">&bull;</span>
          <div>
            <span className="font-medium text-gray-900 text-sm">{iv.title}</span>
            <p className="text-sm text-gray-600">{iv.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
