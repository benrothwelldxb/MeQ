"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignFrameworkToSchool, unassignFrameworkFromSchool } from "@/app/actions/framework-import";

interface School {
  id: string;
  name: string;
  slug: string;
}

export default function AssignmentPanel({
  frameworkId,
  allSchools,
  assignedSchoolIds,
}: {
  frameworkId: string;
  allSchools: School[];
  assignedSchoolIds: string[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const assignedSet = new Set(assignedSchoolIds);
  const isPublic = assignedSchoolIds.length === 0;

  const handleToggle = async (schoolId: string) => {
    setPending(schoolId);
    if (assignedSet.has(schoolId)) {
      await unassignFrameworkFromSchool(frameworkId, schoolId);
    } else {
      await assignFrameworkToSchool(frameworkId, schoolId);
    }
    setPending(null);
    router.refresh();
  };

  const assignedSchools = allSchools.filter((s) => assignedSet.has(s.id));
  const unassignedSchools = allSchools.filter((s) => !assignedSet.has(s.id));

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-bold text-white">School Access</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {isPublic
              ? "Available to all schools. Assign to specific schools to make it private."
              : `Only visible to ${assignedSchoolIds.length} assigned school${assignedSchoolIds.length !== 1 ? "s" : ""}.`}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-meq-sky hover:underline"
        >
          {expanded ? "Hide" : "Manage"}
        </button>
      </div>

      {!isPublic && !expanded && (
        <div className="flex flex-wrap gap-2 mt-3">
          {assignedSchools.map((s) => (
            <span key={s.id} className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400">
              {s.name}
            </span>
          ))}
        </div>
      )}

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Assigned */}
          {assignedSchools.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Assigned ({assignedSchools.length})
              </p>
              <div className="space-y-1">
                {assignedSchools.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-amber-500/10">
                    <div>
                      <p className="text-sm text-white">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.slug}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(s.id)}
                      disabled={pending === s.id}
                      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      {pending === s.id ? "..." : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available */}
          {unassignedSchools.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Available Schools ({unassignedSchools.length})
              </p>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {unassignedSchools.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-900/50 hover:bg-gray-900">
                    <div>
                      <p className="text-sm text-white">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.slug}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(s.id)}
                      disabled={pending === s.id}
                      className="text-xs text-meq-sky hover:text-meq-sky/80 disabled:opacity-50"
                    >
                      {pending === s.id ? "..." : "Assign"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {allSchools.length === 0 && (
            <p className="text-xs text-gray-500">No schools available to assign.</p>
          )}
        </div>
      )}
    </div>
  );
}
