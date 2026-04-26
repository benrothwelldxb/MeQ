"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createSmartGroup,
  updateSmartGroup,
  setSmartGroupMembers,
  setSmartGroupSharedTeachers,
  deleteSmartGroup,
} from "@/app/actions/smart-groups";
import StudentTagPills from "@/components/StudentTagPills";

interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  yearGroup: string;
  className: string | null;
  sen: boolean;
  magt: boolean;
  eal: boolean;
}

interface TeacherOption {
  id: string;
  name: string;
}

export default function SmartGroupForm({
  mode,
  backHref,
  group,
  allStudents,
  allTeachers,
  canEdit,
}: {
  mode: "create" | "edit";
  backHref: string;
  group?: {
    id: string;
    name: string;
    description: string | null;
    purpose: string | null;
    memberStudentIds: string[];
    sharedTeacherIds: string[];
  };
  allStudents: StudentOption[];
  allTeachers: TeacherOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [purpose, setPurpose] = useState(group?.purpose ?? "");
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set(group?.memberStudentIds ?? []));
  const [sharedTeacherIds, setSharedTeacherIds] = useState<Set<string>>(new Set(group?.sharedTeacherIds ?? []));

  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterTag, setFilterTag] = useState<"" | "sen" | "magt" | "eal">("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const yearGroups = useMemo(() => {
    return Array.from(new Set(allStudents.map((s) => s.yearGroup))).sort();
  }, [allStudents]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allStudents.filter((s) => {
      if (filterYear && s.yearGroup !== filterYear) return false;
      if (filterTag === "sen" && !s.sen) return false;
      if (filterTag === "magt" && !s.magt) return false;
      if (filterTag === "eal" && !s.eal) return false;
      if (!q) return true;
      return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q);
    });
  }, [allStudents, search, filterYear, filterTag]);

  const toggleMember = (id: string) => {
    setMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTeacher = (id: string) => {
    setSharedTeacherIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addAllFiltered = () => {
    setMemberIds((prev) => {
      const next = new Set(prev);
      for (const s of filteredStudents) next.add(s.id);
      return next;
    });
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      if (mode === "create") {
        const res = await createSmartGroup({
          name,
          description,
          purpose,
          studentIds: Array.from(memberIds),
          sharedTeacherIds: Array.from(sharedTeacherIds),
        });
        if ("error" in res && res.error) {
          setError(res.error);
          return;
        }
        if ("id" in res) router.push(`${backHref}/${res.id}`);
      } else if (group) {
        const updates = await updateSmartGroup(group.id, { name, description, purpose });
        if ("error" in updates && updates.error) {
          setError(updates.error);
          return;
        }
        const memberRes = await setSmartGroupMembers(group.id, Array.from(memberIds));
        if ("error" in memberRes && memberRes.error) {
          setError(memberRes.error);
          return;
        }
        const teacherRes = await setSmartGroupSharedTeachers(group.id, Array.from(sharedTeacherIds));
        if ("error" in teacherRes && teacherRes.error) {
          setError(teacherRes.error);
          return;
        }
        router.push(`${backHref}/${group.id}`);
        router.refresh();
      }
    });
  };

  const handleDelete = async () => {
    if (!group) return;
    if (!confirm(`Delete "${group.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteSmartGroup(group.id);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      router.push(backHref);
      router.refresh();
    });
  };

  return (
    <div className="max-w-5xl">
      <Link href={backHref} className="text-sm text-meq-sky hover:underline">&larr; Back to Groups</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">
        {mode === "create" ? "New group" : `Edit: ${group?.name}`}
      </h1>

      <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              placeholder="e.g. Year 5 Social Skills"
              maxLength={100}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={!canEdit}
              placeholder="e.g. Nurture, MAGT monitoring, EAL support"
              maxLength={100}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Share with teachers</label>
            <p className="text-xs text-gray-500 mb-2">Shared teachers can see the group and its data, but only you (or an admin) can edit it.</p>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {allTeachers.length === 0 ? (
                <p className="text-sm text-gray-400 p-3">No other teachers available.</p>
              ) : (
                allTeachers.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={sharedTeacherIds.has(t.id)}
                      onChange={() => toggleTeacher(t.id)}
                      disabled={!canEdit}
                      className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky"
                    />
                    {t.name}
                  </label>
                ))
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {canEdit && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={pending || !name.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50"
              >
                {pending ? "Saving..." : mode === "create" ? "Create group" : "Save changes"}
              </button>
              {mode === "edit" && group && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                  title="Delete group"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Students <span className="text-sm font-normal text-gray-500">({memberIds.size} selected)</span></h2>
            {canEdit && (
              <button
                type="button"
                onClick={addAllFiltered}
                className="text-xs text-meq-sky hover:underline"
              >
                Add all filtered ({filteredStudents.length})
              </button>
            )}
          </div>

          <div className="grid gap-2 mb-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none"
            />
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:border-meq-sky focus:outline-none"
            >
              <option value="">All years</option>
              {yearGroups.map((yg) => (
                <option key={yg} value={yg}>{yg}</option>
              ))}
            </select>
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value as "" | "sen" | "magt" | "eal")}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:border-meq-sky focus:outline-none"
            >
              <option value="">All tags</option>
              <option value="sen">SEND only</option>
              <option value="magt">MAGT only</option>
              <option value="eal">EAL only</option>
            </select>
          </div>

          <div className="max-h-[480px] overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
            {filteredStudents.length === 0 ? (
              <p className="text-sm text-gray-400 p-4 text-center">No students match those filters.</p>
            ) : (
              filteredStudents.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm ${
                    memberIds.has(s.id) ? "bg-meq-sky-light/30" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={memberIds.has(s.id)}
                    onChange={() => toggleMember(s.id)}
                    disabled={!canEdit}
                    className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky"
                  />
                  <span className="font-medium text-gray-900 flex-1">
                    {s.firstName} {s.lastName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {s.yearGroup}{s.className ? ` / ${s.className}` : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <StudentTagPills sen={s.sen} magt={s.magt} eal={s.eal} />
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
