import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import Link from "next/link";

const ACTION_LABELS: Record<string, string> = {
  "student.delete": "Deleted student",
  "student.bulk_delete": "Bulk-deleted students",
  "survey.delete": "Deleted survey",
  "alert.resolve": "Resolved safeguarding alert",
  "alert.dismiss": "Dismissed safeguarding alert",
};

export default async function AuditLogPage() {
  const session = await getAdminSession();

  const entries = await prisma.auditLog.findMany({
    where: { schoolId: session.schoolId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="max-w-3xl">
      <Link href="/admin/settings" className="text-sm text-meq-sky hover:underline">
        &larr; Back to Settings
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">Audit log</h1>
      <p className="text-gray-500 mb-6">
        The 200 most recent destructive or sensitive actions taken at this school.
      </p>

      {entries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No audit events yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">When</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((e) => {
                let meta: Record<string, unknown> | null = null;
                if (e.meta) {
                  try { meta = JSON.parse(e.meta); } catch { /* ignore */ }
                }
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {ACTION_LABELS[e.action] ?? e.action}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {e.actorLabel ?? e.actorType}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {e.entityType && e.entityId ? `${e.entityType}:${e.entityId.slice(0, 8)}…` : "—"}
                      {meta && (
                        <span className="ml-2 text-gray-400">
                          {Object.entries(meta).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(" · ")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
