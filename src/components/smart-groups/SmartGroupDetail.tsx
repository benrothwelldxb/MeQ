import Link from "next/link";
import { getDomainTailwind } from "@/lib/domain-colors";
import StudentTagPills from "@/components/StudentTagPills";

interface DomainInfo {
  key: string;
  label: string;
  color: string;
}

interface StudentRow {
  id: string;
  firstName: string;
  lastName: string;
  yearGroup: string;
  className: string | null;
  sen: boolean;
  magt: boolean;
  eal: boolean;
  overallLevel: string | null;
  domainScores: Record<string, number> | null;
}

interface PulseSummary {
  domain: string;
  average: number | null; // null if no data
}

export default function SmartGroupDetail({
  group,
  students,
  domains,
  pulseSummary,
  baseHref,
  studentLinkBase,
  canEdit,
}: {
  group: {
    id: string;
    name: string;
    description: string | null;
    purpose: string | null;
    creatorLabel: string | null;
    sharedWithNames: string[];
  };
  students: StudentRow[];
  domains: DomainInfo[];
  pulseSummary: PulseSummary[];
  baseHref: string;
  studentLinkBase: string;
  canEdit: boolean;
}) {
  const domainAverages = domains.map((d) => {
    const scores = students
      .map((s) => s.domainScores?.[d.key])
      .filter((v): v is number => typeof v === "number");
    const avg = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;
    return { domain: d, avg, n: scores.length };
  });

  const levelCounts = students.reduce((acc, s) => {
    const level = s.overallLevel ?? "Not assessed";
    acc[level] = (acc[level] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const LEVEL_COLORS: Record<string, string> = {
    Advanced: "bg-emerald-100 text-emerald-700",
    Secure: "bg-blue-100 text-blue-700",
    Developing: "bg-amber-100 text-amber-700",
    Emerging: "bg-red-100 text-red-700",
    "Not assessed": "bg-gray-100 text-gray-500",
  };

  return (
    <div className="max-w-5xl">
      <Link href={baseHref} className="text-sm text-meq-sky hover:underline">&larr; Back to Groups</Link>

      <div className="flex items-start justify-between mt-2 mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          {group.purpose && <p className="text-sm text-meq-sky font-medium mt-1">{group.purpose}</p>}
          {group.description && <p className="text-gray-600 mt-2 max-w-2xl">{group.description}</p>}
          <p className="text-xs text-gray-400 mt-2">
            By {group.creatorLabel ?? "admin"}
            {group.sharedWithNames.length > 0 && (
              <> &middot; Shared with {group.sharedWithNames.join(", ")}</>
            )}
          </p>
        </div>
        {canEdit && (
          <Link
            href={`${baseHref}/${group.id}/edit`}
            className="px-4 py-2 rounded-lg text-sm font-bold text-meq-sky border border-meq-sky hover:bg-meq-sky hover:text-white transition-all"
          >
            Edit group
          </Link>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 mb-6 sm:grid-cols-3">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Students</p>
          <p className="text-2xl font-bold text-gray-900">{students.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-2">Overall level spread</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(levelCounts).length === 0 ? (
              <span className="text-sm text-gray-400">No data</span>
            ) : (
              Object.entries(levelCounts).map(([level, count]) => (
                <span key={level} className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[level] ?? "bg-gray-100 text-gray-700"}`}>
                  {level}: {count}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-2">Latest pulse (group average)</p>
          <div className="space-y-0.5">
            {pulseSummary.length === 0 ? (
              <span className="text-sm text-gray-400">No pulse data yet</span>
            ) : (
              pulseSummary.map((p) => (
                <div key={p.domain} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{p.domain}</span>
                  <span className={`font-bold ${
                    p.average === null ? "text-gray-400"
                    : p.average >= 4 ? "text-emerald-600"
                    : p.average >= 3 ? "text-gray-700"
                    : p.average >= 2 ? "text-amber-600"
                    : "text-red-600"
                  }`}>
                    {p.average === null ? "—" : p.average.toFixed(1)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Domain averages */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-3">Domain averages (assessment)</h2>
        {domainAverages.every((d) => d.avg === null) ? (
          <p className="text-sm text-gray-400">No completed assessments in this group yet.</p>
        ) : (
          <div className="space-y-2">
            {domainAverages.map(({ domain, avg, n }) => {
              const styles = getDomainTailwind(domain.color);
              return (
                <div key={domain.key} className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.bg} ${styles.text}`}>
                    {domain.label}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 min-w-[60px]">
                    {avg === null ? "—" : avg.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">(n = {n})</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Student list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Members</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Student</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Year / Class</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Overall</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                    No students in this group yet.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{s.firstName} {s.lastName}</span>
                        <StudentTagPills sen={s.sen} magt={s.magt} eal={s.eal} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {s.yearGroup}{s.className ? ` / ${s.className}` : ""}
                    </td>
                    <td className="px-3 py-3">
                      {s.overallLevel ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[s.overallLevel] ?? "bg-gray-100"}`}>
                          {s.overallLevel}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not assessed</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`${studentLinkBase}/${s.id}`}
                        className="text-xs text-meq-sky hover:underline font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
