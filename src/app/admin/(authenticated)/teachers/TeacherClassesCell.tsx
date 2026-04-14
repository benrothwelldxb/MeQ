"use client";

import { useState, useTransition } from "react";
import { updateTeacherClasses } from "@/app/actions/teachers";

type ClassOption = {
  id: string;
  name: string;
  yearGroupId: string;
  yearGroupName: string;
};

export default function TeacherClassesCell({
  teacherId,
  teacherName,
  assignedIds,
  assignedLabels,
  allClasses,
}: {
  teacherId: string;
  teacherName: string;
  assignedIds: string[];
  assignedLabels: { id: string; label: string }[];
  allClasses: ClassOption[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(assignedIds));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateTeacherClasses(teacherId, Array.from(selected));
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  function handleCancel() {
    setSelected(new Set(assignedIds));
    setError(null);
    setOpen(false);
  }

  // Group classes by year group for display
  const byYear: Record<string, { name: string; classes: ClassOption[] }> = {};
  for (const c of allClasses) {
    if (!byYear[c.yearGroupId]) byYear[c.yearGroupId] = { name: c.yearGroupName, classes: [] };
    byYear[c.yearGroupId].classes.push(c);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-wrap gap-1 text-left hover:bg-gray-100 rounded -mx-1 px-1 py-0.5 transition-colors"
        title="Edit classes"
      >
        {assignedLabels.length > 0 ? (
          assignedLabels.map((l) => (
            <span key={l.id} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {l.label}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400 hover:text-meq-sky">Assign classes…</span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={handleCancel}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Assign classes</h3>
              <p className="text-sm text-gray-500 mt-0.5">{teacherName}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {Object.keys(byYear).length === 0 ? (
                <p className="text-sm text-gray-500">No classes set up yet.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(byYear).map(([yearId, { name, classes }]) => (
                    <div key={yearId}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{name}</p>
                      <div className="space-y-1">
                        {classes.map((c) => (
                          <label
                            key={c.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(c.id)}
                              onChange={() => toggle(c.id)}
                              className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky"
                            />
                            <span className="text-sm text-gray-700">{c.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">{selected.size} selected</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
