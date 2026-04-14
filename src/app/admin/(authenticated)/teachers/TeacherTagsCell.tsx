"use client";

import { useState, useTransition } from "react";
import { TEACHER_TAGS, type TeacherTag, TAG_STYLES } from "@/lib/teacher-tags";
import { updateTeacherTags } from "@/app/actions/teachers";

export default function TeacherTagsCell({
  teacherId,
  teacherName,
  currentTags,
}: {
  teacherId: string;
  teacherName: string;
  currentTags: TeacherTag[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<TeacherTag>>(new Set(currentTags));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(tag: TeacherTag) {
    const next = new Set(selected);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    setSelected(next);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateTeacherTags(teacherId, Array.from(selected));
      if (result?.error) setError(result.error);
      else setOpen(false);
    });
  }

  function handleCancel() {
    setSelected(new Set(currentTags));
    setError(null);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-wrap gap-1 text-left hover:bg-gray-100 rounded -mx-1 px-1 py-0.5 transition-colors"
        title="Edit tags"
      >
        {currentTags.length > 0 ? (
          currentTags.map((tag) => (
            <span key={tag} className={`text-xs px-2 py-0.5 rounded-full border ${TAG_STYLES[tag]}`}>
              {tag}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400 hover:text-meq-sky">Add tags…</span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={handleCancel}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Role tags</h3>
              <p className="text-sm text-gray-500 mt-0.5">{teacherName}</p>
            </div>

            <div className="px-6 py-4">
              <div className="flex flex-wrap gap-2">
                {TEACHER_TAGS.map((tag) => {
                  const active = selected.has(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggle(tag)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        active
                          ? `${TAG_STYLES[tag]} font-medium`
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
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
      )}
    </>
  );
}
