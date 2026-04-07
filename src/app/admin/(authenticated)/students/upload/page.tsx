"use client";

import { useState } from "react";
import { uploadStudentsCSV } from "@/app/actions/students";
import Link from "next/link";

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
  const [result, setResult] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setUploading(true);
    const res = await uploadStudentsCSV(formData);
    setResult(res);
    setUploading(false);
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
        <Link
          href="/admin/students"
          className="text-sm text-meq-sky hover:underline"
        >
          &larr; Back to Students
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Upload Students
        </h1>
        <p className="text-gray-500 mt-1">
          Upload a CSV file with student details. Login codes will be generated
          automatically.
        </p>
      </div>

      {/* CSV Format */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <p className="text-sm font-medium text-blue-900 mb-2">
          Required CSV columns:
        </p>
        <code className="text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded">
          first_name, last_name, year_group
        </code>
        <p className="text-xs text-blue-700 mt-2">
          Optional: <code className="bg-blue-100 px-1 rounded">class_name</code>,{" "}
          <code className="bg-blue-100 px-1 rounded">login_code</code>
        </p>
      </div>

      {!result?.success && (
        <form action={handleSubmit}>
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

          {result?.error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg p-3">
              {result.error}
            </p>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="mt-4 w-full py-3 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
          >
            {uploading ? "Uploading..." : "Upload & Generate Codes"}
          </button>
        </form>
      )}

      {result?.success && result.students && (
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
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Code
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Year
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {result.students.map((s, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-sm">{s.name}</td>
                    <td className="px-4 py-2">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                        {s.code}
                      </code>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {s.yearGroup}
                    </td>
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
