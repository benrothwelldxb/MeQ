import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import FrameworkBuilder from "./FrameworkBuilder";
import AssignmentPanel from "./AssignmentPanel";
import ExportButton from "./ExportButton";

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
      assignments: {
        include: { school: { select: { id: true, name: true, slug: true } } },
      },
    },
  });

  if (!framework) return notFound();

  const allSchools = await prisma.school.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  const isPublic = framework.assignments.length === 0;

  return (
    <div>
      <Link href="/super/frameworks" className="text-sm text-gray-400 hover:text-white">&larr; Back to Frameworks</Link>
      <div className="flex items-center justify-between mt-2 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{framework.name}</h1>
          {framework.isDefault && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-meq-sky/20 text-meq-sky">Default</span>
          )}
          {isPublic ? (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Public</span>
          ) : (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
              Private &middot; {framework.assignments.length} school{framework.assignments.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <ExportButton frameworkId={framework.id} frameworkName={framework.name} />
      </div>

      {!framework.isDefault && (
        <AssignmentPanel
          frameworkId={framework.id}
          allSchools={allSchools}
          assignedSchoolIds={framework.assignments.map((a) => a.schoolId)}
        />
      )}

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
