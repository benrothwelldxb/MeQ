"use client";

import { useState } from "react";
import { createSchool } from "@/app/actions/schools";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddSchoolPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true);
    setError("");
    const result = await createSchool(formData);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      router.push("/super");
    }
  };

  return (
    <div className="max-w-md">
      <Link href="/super" className="text-sm text-meq-sky hover:underline">&larr; Back to Schools</Link>
      <h1 className="text-2xl font-bold text-white mt-2 mb-6">Add School</h1>

      <form action={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">School Name *</label>
          <input
            name="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-meq-sky focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">URL Slug *</label>
          <input
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            required
            className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white font-mono focus:border-meq-sky focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">Used as a unique identifier</p>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <p className="text-sm font-medium text-gray-300 mb-3">School Admin Account</p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Admin Email *</label>
              <input name="adminEmail" type="email" required className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-meq-sky focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Admin Password</label>
              <input name="adminPassword" type="password" minLength={6} placeholder="Optional if using Google SSO" className="w-full px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-meq-sky focus:outline-none placeholder:text-gray-500" />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all"
        >
          {submitting ? "Creating..." : "Create School"}
        </button>

        <p className="text-xs text-gray-500">
          Default year groups (FS2 - Year 6) will be created automatically.
        </p>
      </form>
    </div>
  );
}
