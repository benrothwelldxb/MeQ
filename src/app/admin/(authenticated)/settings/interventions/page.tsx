import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolFramework } from "@/lib/framework";
import Link from "next/link";

const LEVELS = ["Emerging", "Developing", "Secure", "Advanced"];

export default async function InterventionsPage() {
  const session = await getAdminSession();
  const framework = await getSchoolFramework(session.schoolId);
  const domains = framework.domains;

  const interventions = await prisma.intervention.findMany({
    where: {
      OR: [
        { schoolId: session.schoolId },
        { isDefault: true, schoolId: null, frameworkId: framework.id },
        { isDefault: true, schoolId: null, frameworkId: null }, // Legacy interventions
      ],
    },
    orderBy: [{ domain: "asc" }, { level: "asc" }, { audience: "asc" }, { sortOrder: "asc" }],
  });

  // Group by domain → level
  const grouped: Record<string, Record<string, typeof interventions>> = {};
  for (const iv of interventions) {
    if (!grouped[iv.domain]) grouped[iv.domain] = {};
    if (!grouped[iv.domain][iv.level]) grouped[iv.domain][iv.level] = [];
    grouped[iv.domain][iv.level].push(iv);
  }

  return (
    <div className="max-w-4xl">
      <Link href="/admin/settings" className="text-sm text-meq-sky hover:underline">&larr; Back to Settings</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">Intervention Bank</h1>
      <p className="text-gray-500 mb-6">
        {interventions.length} interventions — {framework.name} framework
      </p>

      {domains.map((domain) => (
        <div key={domain.key} className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{domain.label}</h2>
          <div className="space-y-3">
            {LEVELS.map((level) => {
              const items = grouped[domain.key]?.[level] || [];
              if (items.length === 0) return null;

              return (
                <div key={level} className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-2">{level}</h3>
                  <div className="space-y-2">
                    {items.map((iv) => (
                      <div key={iv.id} className="flex items-start justify-between gap-4 py-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">{iv.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              iv.audience === "student" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                            }`}>
                              {iv.audience}
                            </span>
                            {iv.isDefault && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">default</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{iv.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {domains.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No domains configured for this framework.</p>
        </div>
      )}
    </div>
  );
}
