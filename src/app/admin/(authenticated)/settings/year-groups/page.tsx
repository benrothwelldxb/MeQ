"use client";

import { useState, useEffect } from "react";
import { createYearGroup, deleteYearGroup } from "@/app/actions/year-groups";
import { createClassGroup, deleteClassGroup } from "@/app/actions/class-groups";
import Link from "next/link";

interface ClassGroup {
  id: string;
  name: string;
}

interface YearGroup {
  id: string;
  name: string;
  tier: string;
  sortOrder: number;
  classes: ClassGroup[];
}

export default function YearGroupsPage() {
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const res = await fetch("/api/year-groups");
    const data = await res.json();
    setYearGroups(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleAddYearGroup = async (formData: FormData) => {
    const result = await createYearGroup(formData);
    if (result.error) alert(result.error);
    else loadData();
  };

  const handleDeleteYearGroup = async (id: string) => {
    if (!confirm("Delete this year group and all its classes?")) return;
    await deleteYearGroup(id);
    loadData();
  };

  const handleAddClass = async (formData: FormData) => {
    const result = await createClassGroup(formData);
    if (result.error) alert(result.error);
    else loadData();
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Delete this class?")) return;
    await deleteClassGroup(id);
    loadData();
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/settings" className="text-sm text-meq-sky hover:underline">&larr; Back to Settings</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Year Groups & Classes</h1>

      {/* Add Year Group */}
      <form action={handleAddYearGroup} className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <h3 className="font-bold text-gray-900 text-sm mb-3">Add Year Group</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <input name="name" placeholder="e.g. Year 3" required className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none" />
          </div>
          <div>
            <select name="tier" className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none">
              <option value="standard">Standard (8-11)</option>
              <option value="junior">Junior (5-7)</option>
            </select>
          </div>
          <input type="hidden" name="sortOrder" value={yearGroups.length} />
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90">Add</button>
        </div>
      </form>

      {/* Year Groups List */}
      <div className="space-y-4">
        {yearGroups.map((yg) => (
          <div key={yg.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">{yg.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  yg.tier === "junior" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                }`}>{yg.tier}</span>
              </div>
              <button onClick={() => handleDeleteYearGroup(yg.id)} className="text-xs text-gray-400 hover:text-red-600">Delete</button>
            </div>

            {/* Classes */}
            <div className="ml-4 space-y-1 mb-3">
              {yg.classes.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-700">{cls.name}</span>
                  <button onClick={() => handleDeleteClass(cls.id)} className="text-xs text-gray-400 hover:text-red-600">Remove</button>
                </div>
              ))}
              {yg.classes.length === 0 && <p className="text-xs text-gray-400">No classes yet</p>}
            </div>

            {/* Add Class */}
            <form action={handleAddClass} className="flex gap-2 ml-4">
              <input type="hidden" name="yearGroupId" value={yg.id} />
              <input name="name" placeholder="e.g. 3A" required className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:border-meq-sky focus:outline-none" />
              <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-bold text-meq-sky bg-meq-sky-light hover:bg-blue-100">Add Class</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
