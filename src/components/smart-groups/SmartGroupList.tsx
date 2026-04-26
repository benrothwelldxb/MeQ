import Link from "next/link";

interface GroupRow {
  id: string;
  name: string;
  purpose: string | null;
  description: string | null;
  updatedAt: Date;
  memberCount: number;
  creatorLabel: string | null; // e.g. teacher name, or null if admin
}

export default function SmartGroupList({
  groups,
  baseHref,
  canCreate,
  heading,
  subheading,
}: {
  groups: GroupRow[];
  baseHref: string;
  canCreate: boolean;
  heading: string;
  subheading: string;
}) {
  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
          <p className="text-gray-500 mt-1">{subheading}</p>
        </div>
        {canCreate && (
          <Link
            href={`${baseHref}/new`}
            className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90"
          >
            + New group
          </Link>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-1">No groups yet.</p>
          {canCreate && (
            <p className="text-sm text-gray-400">
              Create a group to monitor students across classes — for example, a nurture group, social skills cohort, or MAGT set.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`${baseHref}/${g.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-meq-sky hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-bold text-gray-900 text-base leading-tight">{g.name}</h2>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {g.memberCount} student{g.memberCount === 1 ? "" : "s"}
                </span>
              </div>
              {g.purpose && (
                <p className="text-xs font-medium text-meq-sky mb-2">{g.purpose}</p>
              )}
              {g.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{g.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                <span>By {g.creatorLabel ?? "admin"}</span>
                <span>Updated {new Date(g.updatedAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
