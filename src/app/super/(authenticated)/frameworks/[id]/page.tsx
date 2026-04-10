import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import FrameworkBuilder from "./FrameworkBuilder";

export default async function EditFrameworkPage({
  params,
}: {
  params: { id: string };
}) {
  const framework = await prisma.framework.findUnique({
    where: { id: params.id },
    include: {
      domains: { orderBy: { sortOrder: "asc" } },
      questions: { orderBy: [{ tier: "asc" }, { orderIndex: "asc" }] },
      interventions: { orderBy: [{ domain: "asc" }, { level: "asc" }, { sortOrder: "asc" }] },
      pulseQuestions: { orderBy: [{ tier: "asc" }, { orderIndex: "asc" }] },
    },
  });

  if (!framework) return notFound();

  return (
    <div>
      <Link href="/super/frameworks" className="text-sm text-gray-400 hover:text-white">&larr; Back to Frameworks</Link>
      <div className="flex items-center gap-3 mt-2 mb-6">
        <h1 className="text-2xl font-bold text-white">{framework.name}</h1>
        {framework.isDefault && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-meq-sky/20 text-meq-sky">Default</span>
        )}
      </div>

      <FrameworkBuilder
        framework={{
          id: framework.id,
          name: framework.name,
          config: framework.config,
          isDefault: framework.isDefault,
          assessmentFrequency: framework.assessmentFrequency,
          activeTerms: framework.activeTerms,
        }}
        domains={framework.domains.map((d) => ({
          id: d.id,
          key: d.key,
          label: d.label,
          description: d.description,
          color: d.color,
          sortOrder: d.sortOrder,
        }))}
        questions={framework.questions.map((q) => ({
          id: q.id,
          domainKey: q.domainKey,
          tier: q.tier,
          audience: q.audience,
          orderIndex: q.orderIndex,
          prompt: q.prompt,
          type: q.type,
          questionFormat: q.questionFormat,
          weight: q.weight,
          audioUrl: q.audioUrl,
          symbolImageUrl: q.symbolImageUrl,
        }))}
        interventions={framework.interventions.map((iv) => ({
          id: iv.id,
          domain: iv.domain,
          level: iv.level,
          audience: iv.audience,
          title: iv.title,
          description: iv.description,
        }))}
        pulseQuestions={framework.pulseQuestions.map((pq) => ({
          id: pq.id,
          tier: pq.tier,
          domain: pq.domain,
          prompt: pq.prompt,
          emoji: pq.emoji,
          orderIndex: pq.orderIndex,
        }))}
      />
    </div>
  );
}
