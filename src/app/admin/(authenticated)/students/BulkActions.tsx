"use client";

import { useState } from "react";
import { bulkDeleteStudents, bulkReassignClass } from "@/app/actions/students";

interface ClassOption {
  id: string;
  name: string;
  yearGroupName: string;
}

export default function BulkActions({
  selectedIds,
  onClear,
  classes,
}: {
  selectedIds: string[];
  onClear: () => void;
  classes: ClassOption[];
}) {
  const [loading, setLoading] = useState(false);
  const [showReassign, setShowReassign] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} student${selectedIds.length !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    setLoading(true);
    await bulkDeleteStudents(selectedIds);
    onClear();
    setLoading(false);
  };

  const handleReassign = async (classGroupId: string) => {
    setLoading(true);
    await bulkReassignClass(selectedIds, classGroupId);
    onClear();
    setShowReassign(false);
    setLoading(false);
  };

  const handleExport = () => {
    // Trigger download via hidden link — data is already on the page
    const event = new CustomEvent("export-selected", { detail: selectedIds });
    window.dispatchEvent(event);
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="bg-meq-sky-light border border-meq-sky/20 rounded-xl p-3 mb-4 flex items-center gap-3 flex-wrap">
      <span className="text-sm font-medium text-meq-sky">
        {selectedIds.length} selected
      </span>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleExport}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          Export CSV
        </button>
        <button
          onClick={() => setShowReassign(!showReassign)}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          Reassign Class
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-50"
        >
          {loading ? "..." : "Delete"}
        </button>
        <button
          onClick={onClear}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      </div>

      {showReassign && (
        <div className="w-full mt-2">
          <select
            onChange={(e) => { if (e.target.value) handleReassign(e.target.value); }}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
            defaultValue=""
          >
            <option value="" disabled>Select a class...</option>
            <option value="none">No class (remove)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.yearGroupName} — {c.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
