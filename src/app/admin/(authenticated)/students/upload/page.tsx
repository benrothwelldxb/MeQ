"use client";

import { useState } from "react";
import { previewCSV, uploadStudentsCSV } from "@/app/actions/students";
import Link from "next/link";

const FIELDS = [
  { key: "first_name", label: "First Name", required: true },
  { key: "last_name", label: "Last Name", required: true },
  { key: "year_group", label: "Year Group", required: true },
  { key: "class_name", label: "Class", required: false },
  { key: "login_code", label: "Login Code", required: false },
  { key: "sen", label: "SEND", required: false },
  { key: "magt", label: "MAGT", required: false },
  { key: "eal", label: "EAL", required: false },
  { key: "school_uuid", label: "School ID", required: false },
];

interface PreviewData {
  headers: string[];
  suggestedMapping: Record<string, string>;
  preview: Array<Record<string, string>>;
  totalRows: number;
  csvText: string;
}

interface UploadResult {
  success?: boolean;
  error?: string;
  count?: number;
  errors?: string[];
  students?: Array<{
    name: string;
    code: string;
    yearGroup: string;
    className: string | null;
  }>;
}

export default function UploadPage() {
  const [step, setStep] = useState<"upload" | "map" | "result">("upload");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    const res = await previewCSV(formData);
    setLoading(false);

    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }

    const data = res as PreviewData;
    setPreviewData(data);
    setMapping(data.suggestedMapping);
    setStep("map");
  };

  const handleUpload = async () => {
    if (!previewData) return;

    const requiredFields = FIELDS.filter((f) => f.required);
    const missingRequired = requiredFields.filter((f) => !mapping[f.key]);
    if (missingRequired.length > 0) {
      setError(`Please map: ${missingRequired.map((f) => f.label).join(", ")}`);
      return;
    }

    setLoading(true);
    setError(null);
    const res = await uploadStudentsCSV(previewData.csvText, mapping);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    setResult(res);
    setStep("result");
  };

  const updateMapping = (field: string, header: string) => {
    setMapping((prev) => {
      const next = { ...prev };
      if (header === "") {
        delete next[field];
      } else {
        next[field] = header;
      }
      return next;
    });
  };

  const downloadCodes = () => {
    if (!result?.students) return;
    const csv = [
      "name,login_code,year_group,class_name",
      ...result.students.map(
        (s) => `${s.name},${s.code},${s.yearGroup},${s.className || ""}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meq-login-codes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/students" className="text-sm text-meq-sky hover:underline">
          &larr; Back to Students
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Upload Students</h1>
        <p className="text-gray-500 mt-1">
          Upload a CSV file with student details. Login codes will be generated automatically.
        </p>
      </div>

      {/* Step 1: File Upload */}
      {step === "upload" && (
        <>
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-blue-900 mb-2">CSV columns:</p>
            <p className="text-xs text-blue-700">
              Required: <code className="bg-blue-100 px-1 rounded">first_name</code>,{" "}
              <code className="bg-blue-100 px-1 rounded">last_name</code>,{" "}
              <code className="bg-blue-100 px-1 rounded">year_group</code>
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Optional: <code className="bg-blue-100 px-1 rounded">class_name</code>,{" "}
              <code className="bg-blue-100 px-1 rounded">login_code</code>,{" "}
              <code className="bg-blue-100 px-1 rounded">sen</code>
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Don&apos;t worry if your column names are different — you can map them in the next step.
            </p>
          </div>

          <form action={handlePreview}>
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
              <input
                type="file"
                name="file"
                accept=".csv"
                required
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-meq-sky-light file:text-meq-sky hover:file:bg-blue-100 cursor-pointer"
              />
              <p className="text-xs text-gray-400 mt-3">CSV files only</p>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full py-3 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
            >
              {loading ? "Reading file..." : "Preview & Map Columns"}
            </button>
          </form>
        </>
      )}

      {/* Step 2: Column Mapping */}
      {step === "map" && previewData && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-1">Map Your Columns</h2>
            <p className="text-sm text-gray-500 mb-4">
              We found {previewData.totalRows} rows and {previewData.headers.length} columns.
              Match each column to the right field.
            </p>

            <div className="space-y-3">
              {FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-3">
                  <div className="w-32 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </span>
                  </div>
                  <select
                    value={mapping[field.key] || ""}
                    onChange={(e) => updateMapping(field.key, e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:border-meq-sky focus:outline-none ${
                      mapping[field.key]
                        ? "border-emerald-300 bg-emerald-50"
                        : field.required
                        ? "border-amber-300 bg-amber-50"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">— Skip —</option>
                    {previewData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  {mapping[field.key] && (
                    <span className="text-emerald-500 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Data Preview */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">Preview (first 3 rows)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {previewData.headers.map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {previewData.preview.map((row, i) => (
                    <tr key={i}>
                      {previewData.headers.map((h) => (
                        <td key={h} className="px-3 py-2 text-sm text-gray-700">
                          {row[h] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep("upload"); setPreviewData(null); setError(null); }}
              className="px-4 py-3 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleUpload}
              disabled={loading}
              className="flex-1 py-3 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
            >
              {loading ? "Uploading..." : `Upload ${previewData.totalRows} Students`}
            </button>
          </div>
        </>
      )}

      {/* Step 3: Results */}
      {step === "result" && result?.success && result.students && (
        <div>
          <div className="bg-emerald-50 rounded-xl p-4 mb-4">
            <p className="text-sm font-medium text-emerald-800">
              Successfully added {result.count} students!
            </p>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-amber-700 font-medium">Warnings:</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-amber-600">{e}</p>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Code</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {result.students.map((s, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-sm">{s.name}</td>
                    <td className="px-4 py-2">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{s.code}</code>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{s.yearGroup}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadCodes}
              className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-meq-leaf hover:bg-meq-leaf/90 transition-all"
            >
              Download Codes CSV
            </button>
            <Link
              href="/admin/students"
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Back to Students
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
