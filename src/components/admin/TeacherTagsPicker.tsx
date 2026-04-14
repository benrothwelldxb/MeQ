"use client";

import { useState } from "react";
import { TEACHER_TAGS, type TeacherTag, TAG_STYLES } from "@/lib/teacher-tags";

/** Tag picker for use inside a form — submits hidden inputs named "tags". */
export default function TeacherTagsPicker({
  defaultTags = [],
}: {
  defaultTags?: TeacherTag[];
}) {
  const [selected, setSelected] = useState<Set<TeacherTag>>(new Set(defaultTags));

  function toggle(tag: TeacherTag) {
    const next = new Set(selected);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    setSelected(next);
  }

  return (
    <div>
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
      {Array.from(selected).map((tag) => (
        <input key={tag} type="hidden" name="tags" value={tag} />
      ))}
    </div>
  );
}
