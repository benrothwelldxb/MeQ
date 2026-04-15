"use client";

import { useState } from "react";
import { previewTeachersCSV, uploadTeachersCSV } from "@/app/actions/teachers";
import Link from "next/link";

interface PreviewData {
  headers: string[];
  preview: Array<Record<string, string>>;
  totalRows: number;
  csvText: string;
}

interface UploadResult {
  success?: boolean;
  count?: number;
  errors?: string[];
  error?: string;
  teachers?: Array<{ name: string; email: string; password: string }>;
}

export default function UploadTeachersPage() {
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    const res = await previewTeachersCSV(formData);
    setLoading(false);

    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    setPreviewData(res as PreviewData);
    setStep("preview");
  };

  const handleUpload = async () => {
    if (!previewData) return;
    setLoading(true);
    setError(null);
    const res = await uploadTeachersCSV(previewData.csvText);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    setResult(res);
    setStep("result");
  };

  const downloadPasswords = () => {
    if (!result?.teachers) return;
    const csv = [
      "name,email,password",
      ...result.teachers.map((t) => `${t.name},${t.email},${t.password}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meq-teacher-credentials.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/teachers" className="text-sm text-meq-sky hover:underline">
          &larr; Back to Teachers
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Upload Teachers</h1>
        <p className="text-gray-500 mt-1">
          Bulk-create teacher accounts from a CSV file. Welcome emails with login details will be sent automatically.
        </p>
      </div>

      {step === "upload" && (
        <>
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-blue-900 mb-2">CSV columns:</p>
            <p className="text-xs text-blue-700">
              Required: <code className="bg-blue-100 px-1 rounded">first_name</code>,{" "}
              <code className="bg-blue-100 px-1 rounded">last_name</code>,{" "}
              <code className="bg-blue-100 px-1 rounded">email</code>
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Optional: <code className="bg-blue-100 px-1 rounded">password</code> (leave blank for Google SSO),{" "}
              <code className="bg-blue-100 px-1 rounded">class</code> (e.g. &quot;Year 5 5A&quot;; comma-separated for multiple),{" "}
              <code className="bg-blue-100 px-1 rounded">tags</code> (Class Teacher, Inclusion, Specialist, Assistant, PLT)
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Alternative header names are accepted (firstname, surname, email_address, classes, roles).
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
              {loading ? "Reading file..." : "Preview"}
            </button>
          </form>
        </>
      )}

      {step === "preview" && previewData && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Preview ({previewData.totalRows} rows)
              </p>
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
              onClick={() => {
                setStep("upload");
                setPreviewData(null);
                setError(null);
              }}
              className="px-4 py-3 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleUpload}
              disabled={loading}
              className="flex-1 py-3 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
            >
              {loading ? "Creating..." : `Create ${previewData.totalRows} Teachers`}
            </button>
          </div>
        </>
      )}

      {step === "result" && result?.success && (
        <div>
          <div className="bg-emerald-50 rounded-xl p-4 mb-4">
            <p className="text-sm font-medium text-emerald-800">
              Created {result.count} teacher{result.count !== 1 ? "s" : ""}. Welcome emails sent.
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

          {result.teachers && result.teachers.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-amber-900 mb-1">Credentials generated</p>
              <p className="text-xs text-amber-700 mb-3">
                Welcome emails have been sent, but you can also download the credentials for your records.
                Keep this file secure and delete it once teachers have logged in.
              </p>
              <button
                onClick={downloadPasswords}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all"
              >
                Download Credentials CSV
              </button>
            </div>
          )}

          <Link
            href="/admin/teachers"
            className="inline-block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
          >
            Back to Teachers
          </Link>
        </div>
      )}
    </div>
  );
}
