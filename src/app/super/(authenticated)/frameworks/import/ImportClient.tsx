"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateFrameworkImport, importFramework } from "@/app/actions/framework-import";
import Link from "next/link";

interface School {
  id: string;
  name: string;
  slug: string;
}

interface ValidationResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary?: {
    name: string;
    domainCount: number;
    standardQuestions: number;
    juniorQuestions: number;
    interventions: number;
    pulseQuestions: number;
    messages: number;
  };
}

export default function ImportClient({ schools }: { schools: School[] }) {
  const router = useRouter();
  const [jsonText, setJsonText] = useState("");
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [assignmentMode, setAssignmentMode] = useState<"public" | "private">("public");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setJsonText(text);
    setValidation(null);
  };

  const handleValidate = async () => {
    setValidating(true);
    const res = await validateFrameworkImport(jsonText);
    setValidation(res);
    setValidating(false);
  };

  const handleImport = async () => {
    if (!validation?.valid) return;
    setImporting(true);
    const schoolIds = assignmentMode === "private" ? selectedSchoolIds : [];
    const res = await importFramework(jsonText, schoolIds);
    setImporting(false);
    if ("error" in res && res.error) {
      alert(`Import failed: ${res.error}`);
      return;
    }
    if (res.frameworkId) {
      router.push(`/super/frameworks/${res.frameworkId}`);
    }
  };

  const toggleSchool = (id: string) => {
    setSelectedSchoolIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* JSON input */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white">Framework JSON</h2>
          <div className="flex gap-2">
            <label
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 cursor-pointer"
            >
              Upload file
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <Link
              href="/framework-template.json"
              download
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-meq-sky bg-meq-sky/10 hover:bg-meq-sky/20"
            >
              Download template
            </Link>
          </div>
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setValidation(null);
          }}
          rows={14}
          placeholder='{"name": "HEART", "domains": [...], "questions": [...]}'
          className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-xs font-mono focus:border-meq-sky focus:outline-none"
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleValidate}
            disabled={!jsonText.trim() || validating}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 transition-all"
          >
            {validating ? "Validating..." : "Validate"}
          </button>
        </div>
      </div>

      {/* Validation results */}
      {validation && (
        <div className={`rounded-xl border p-5 ${validation.valid ? "bg-emerald-900/20 border-emerald-700/50" : "bg-red-900/20 border-red-700/50"}`}>
          <div className="flex items-center gap-2 mb-3">
            {validation.valid ? (
              <>
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-bold text-emerald-400">Valid</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-bold text-red-400">Invalid — {validation.errors.length} error{validation.errors.length !== 1 ? "s" : ""}</span>
              </>
            )}
          </div>

          {validation.errors.length > 0 && (
            <div className="mb-3">
              <ul className="space-y-1">
                {validation.errors.map((err, i) => (
                  <li key={i} className="text-sm text-red-300">&middot; {err}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-amber-400 mb-1">Warnings:</p>
              <ul className="space-y-1">
                {validation.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-amber-300">&middot; {w}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.summary && (
            <div className="bg-gray-900/50 rounded-lg p-4 mt-3">
              <p className="text-sm font-bold text-white mb-2">{validation.summary.name}</p>
              <div className="grid grid-cols-3 gap-3 text-xs text-gray-400">
                <div><span className="text-white font-bold">{validation.summary.domainCount}</span> domains</div>
                <div><span className="text-white font-bold">{validation.summary.standardQuestions}</span> standard questions</div>
                <div><span className="text-white font-bold">{validation.summary.juniorQuestions}</span> junior questions</div>
                <div><span className="text-white font-bold">{validation.summary.interventions}</span> interventions</div>
                <div><span className="text-white font-bold">{validation.summary.pulseQuestions}</span> pulse questions</div>
                <div><span className="text-white font-bold">{validation.summary.messages}</span> messages</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assignment */}
      {validation?.valid && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h2 className="font-bold text-white mb-3">Who can use this framework?</h2>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-700/50 cursor-pointer">
              <input
                type="radio"
                name="assignment"
                checked={assignmentMode === "public"}
                onChange={() => setAssignmentMode("public")}
                className="mt-0.5 w-4 h-4 text-meq-sky focus:ring-meq-sky"
              />
              <div>
                <p className="text-sm font-medium text-white">Public — available to all schools</p>
                <p className="text-xs text-gray-500 mt-0.5">Any school can select this framework in their settings.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-700/50 cursor-pointer">
              <input
                type="radio"
                name="assignment"
                checked={assignmentMode === "private"}
                onChange={() => setAssignmentMode("private")}
                className="mt-0.5 w-4 h-4 text-meq-sky focus:ring-meq-sky"
              />
              <div>
                <p className="text-sm font-medium text-white">Private — only assigned schools</p>
                <p className="text-xs text-gray-500 mt-0.5">Only the schools you select below will see this framework.</p>
              </div>
            </label>
          </div>

          {assignmentMode === "private" && (
            <div className="mt-4 bg-gray-900/50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-3">Select schools to assign:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {schools.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSchoolIds.includes(s.id)}
                      onChange={() => toggleSchool(s.id)}
                      className="w-4 h-4 rounded border-gray-600 text-meq-sky focus:ring-meq-sky"
                    />
                    <span className="text-sm text-white">{s.name}</span>
                    <span className="text-xs text-gray-500">{s.slug}</span>
                  </label>
                ))}
                {schools.length === 0 && (
                  <p className="text-xs text-gray-500">No schools available.</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                {selectedSchoolIds.length} school{selectedSchoolIds.length !== 1 ? "s" : ""} selected
              </p>
            </div>
          )}
        </div>
      )}

      {/* Import */}
      {validation?.valid && (
        <button
          onClick={handleImport}
          disabled={importing || (assignmentMode === "private" && selectedSchoolIds.length === 0)}
          className="w-full py-3 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
        >
          {importing ? "Importing..." : "Import Framework"}
        </button>
      )}
    </div>
  );
}
