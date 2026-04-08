"use client";

import { useRouter, usePathname } from "next/navigation";

export default function ResultsFilter({
  yearGroups,
  classNames,
  terms,
  current,
}: {
  yearGroups: string[];
  classNames: string[];
  terms: { value: string; label: string }[];
  current: { yearGroup?: string; className?: string; term?: string; level?: string };
}) {
  const router = useRouter();
  const pathname = usePathname();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams();
    const filters = { ...current, [key]: value };
    for (const [k, v] of Object.entries(filters)) {
      if (v) params.set(k, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasFilters = current.yearGroup || current.className || current.term || current.level;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <select
        value={current.yearGroup || ""}
        onChange={(e) => updateFilter("yearGroup", e.target.value)}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
      >
        <option value="">All Year Groups</option>
        {yearGroups.map((yg) => (
          <option key={yg} value={yg}>{yg}</option>
        ))}
      </select>

      <select
        value={current.className || ""}
        onChange={(e) => updateFilter("className", e.target.value)}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
      >
        <option value="">All Classes</option>
        {classNames.map((cn) => (
          <option key={cn} value={cn}>{cn}</option>
        ))}
      </select>

      <select
        value={current.term || ""}
        onChange={(e) => updateFilter("term", e.target.value)}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
      >
        <option value="">All Terms</option>
        {terms.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      <select
        value={current.level || ""}
        onChange={(e) => updateFilter("level", e.target.value)}
        className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
      >
        <option value="">All Levels</option>
        <option value="Emerging">Emerging</option>
        <option value="Developing">Developing</option>
        <option value="Secure">Secure</option>
        <option value="Advanced">Advanced</option>
      </select>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-meq-sky"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
