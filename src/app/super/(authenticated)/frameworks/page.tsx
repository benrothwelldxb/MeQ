import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function FrameworksPage() {
  const frameworks = await prisma.framework.findMany({
    include: {
      domains: { orderBy: { sortOrder: "asc" } },
      _count: { select: { schools: true, questions: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Frameworks</h1>
          <p className="text-gray-400 mt-1">Assessment frameworks and custom curricula</p>
        </div>
        <Link
          href="/super/frameworks/new"
          className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all"
        >
          Create Framework
        </Link>
      </div>

      <div className="grid gap-4">
        {frameworks.map((fw) => (
          <div key={fw.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white">{fw.name}</h2>
                {fw.isDefault && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-meq-sky/20 text-meq-sky">Default</span>
                )}
              </div>
              <div className="text-sm text-gray-400">
                {fw._count.schools} school{fw._count.schools !== 1 ? "s" : ""} &middot; {fw._count.questions} questions
              </div>
            </div>

            {fw.description && (
              <p className="text-sm text-gray-400 mb-3">{fw.description}</p>
            )}

            <div className="flex gap-2 flex-wrap">
              {fw.domains.map((d) => {
                const colorMap: Record<string, string> = {
                  blue: "bg-blue-500/20 text-blue-400",
                  emerald: "bg-emerald-500/20 text-emerald-400",
                  purple: "bg-purple-500/20 text-purple-400",
                  amber: "bg-amber-500/20 text-amber-400",
                  rose: "bg-rose-500/20 text-rose-400",
                  red: "bg-red-500/20 text-red-400",
                  green: "bg-green-500/20 text-green-400",
                  indigo: "bg-indigo-500/20 text-indigo-400",
                  pink: "bg-pink-500/20 text-pink-400",
                  teal: "bg-teal-500/20 text-teal-400",
                };
                return (
                  <span key={d.id} className={`text-xs font-medium px-2.5 py-1 rounded-full ${colorMap[d.color] || colorMap.blue}`}>
                    {d.label}
                  </span>
                );
              })}
            </div>
          </div>
        ))}

        {frameworks.length === 0 && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
            <p className="text-gray-400">No frameworks yet. Run the seed to create the MeQ Standard framework.</p>
          </div>
        )}
      </div>
    </div>
  );
}
