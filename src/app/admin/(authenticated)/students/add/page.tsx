"use client";

import { useState, useEffect } from "react";
import { addStudent } from "@/app/actions/students";
import CopyButton from "@/components/shared/CopyButton";
import Link from "next/link";

interface ClassGroup { id: string; name: string; }
interface YearGroup { id: string; name: string; tier: string; classes: ClassGroup[]; }

export default function AddStudentPage() {
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
  const [selectedYG, setSelectedYG] = useState("");
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [showCustomCode, setShowCustomCode] = useState(false);
  const [result, setResult] = useState<{ loginCode?: string; error?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/year-groups").then((r) => r.json()).then(setYearGroups);
  }, []);

  const handleYGChange = (id: string) => {
    setSelectedYG(id);
    const yg = yearGroups.find((y) => y.id === id);
    setClasses(yg?.classes || []);
  };

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true);
    const res = await addStudent(formData);
    setResult(res);
    setSubmitting(false);
  };

  if (result?.loginCode) {
    return (
      <div className="max-w-md">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Student Added!</h2>
          <p className="text-gray-500 mb-6">Their login code is:</p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <code className="text-3xl font-mono font-bold tracking-[0.2em] text-meq-sky bg-meq-sky-light px-6 py-3 rounded-xl">
              {result.loginCode}
            </code>
            <CopyButton text={result.loginCode} />
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setResult(null); setSelectedYG(""); }}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90"
            >
              Add Another
            </button>
            <Link href="/admin/students" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">
              Back to Students
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <Link href="/admin/students" className="text-sm text-meq-sky hover:underline">&larr; Back to Students</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Add Student</h1>

      <form action={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input name="firstName" required className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input name="lastName" required className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year Group *</label>
          <select
            name="yearGroupId"
            required
            value={selectedYG}
            onChange={(e) => handleYGChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none"
          >
            <option value="">Select year group</option>
            {yearGroups.map((yg) => (
              <option key={yg.id} value={yg.id}>{yg.name}</option>
            ))}
          </select>
        </div>

        {selectedYG && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            {classes.length > 0 ? (
              <select name="classGroupId" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none">
                <option value="">No class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-gray-400 py-2">No classes set up for this year group. <Link href="/admin/settings/year-groups" className="text-meq-sky hover:underline">Add classes</Link></p>
            )}
          </div>
        )}

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-700 mb-1">Tags</legend>
          <label className="flex items-center gap-3">
            <input type="checkbox" id="sen" name="sen" className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky" />
            <span className="text-sm text-gray-700">SEND <span className="text-gray-400">— Special Educational Needs &amp; Disabilities</span></span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" id="magt" name="magt" className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky" />
            <span className="text-sm text-gray-700">MAGT <span className="text-gray-400">— More Able, Gifted &amp; Talented</span></span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" id="eal" name="eal" className="w-4 h-4 rounded border-gray-300 text-meq-sky focus:ring-meq-sky" />
            <span className="text-sm text-gray-700">EAL <span className="text-gray-400">— English as an Additional Language</span></span>
          </label>
        </fieldset>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">School ID (optional)</label>
          <input name="schoolUuid" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none" />
        </div>

        <div>
          <button type="button" onClick={() => setShowCustomCode(!showCustomCode)} className="text-xs text-gray-500 hover:text-meq-sky">
            {showCustomCode ? "Use auto-generated code" : "Set custom login code"}
          </button>
          {showCustomCode && (
            <input
              name="loginCode"
              placeholder="e.g. ABCD2345"
              maxLength={8}
              onChange={(e) => {
                e.target.value = e.target.value
                  .toUpperCase()
                  .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, "");
              }}
              className="mt-2 w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-meq-sky focus:outline-none font-mono uppercase tracking-wider"
            />
          )}
        </div>

        {result?.error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{result.error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
        >
          {submitting ? "Adding..." : "Add Student"}
        </button>
      </form>
    </div>
  );
}
