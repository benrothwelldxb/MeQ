"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createFramework } from "@/app/actions/frameworks";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full py-3 rounded-lg text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 disabled:opacity-50 transition-all">
      {pending ? "Creating..." : "Create Framework"}
    </button>
  );
}

export default function NewFrameworkPage() {
  const [state, formAction] = useFormState(createFramework, null);
  const [domains, setDomains] = useState([
    { key: "", label: "", color: "blue" },
  ]);

  const colors = ["blue", "emerald", "purple", "amber", "rose", "red", "green", "indigo", "pink", "teal"];

  const addDomain = () => {
    setDomains([...domains, { key: "", label: "", color: colors[domains.length % colors.length] }]);
  };

  const updateDomain = (index: number, field: string, value: string) => {
    const updated = [...domains];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "label" && !updated[index].key) {
      updated[index].key = value.replace(/\s+/g, "").replace(/[^a-zA-Z]/g, "");
    }
    setDomains(updated);
  };

  const removeDomain = (index: number) => {
    setDomains(domains.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-xl">
      <Link href="/super/frameworks" className="text-sm text-gray-400 hover:text-white">&larr; Back to Frameworks</Link>
      <h1 className="text-2xl font-bold text-white mt-2 mb-6">Create Framework</h1>

      <form action={formAction}>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Framework Name</label>
            <input name="name" required placeholder="e.g. HEART" className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-meq-sky focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea name="description" rows={2} placeholder="Brief description of this framework" className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-meq-sky focus:outline-none" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Domains</h2>
            <button type="button" onClick={addDomain} className="text-xs text-meq-sky hover:text-meq-sky/80">+ Add Domain</button>
          </div>

          <div className="space-y-3">
            {domains.map((domain, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex-1">
                  <input
                    name={`domain_label_${i}`}
                    value={domain.label}
                    onChange={(e) => updateDomain(i, "label", e.target.value)}
                    placeholder="Domain name (e.g. Head)"
                    required
                    className="w-full px-3 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
                  />
                </div>
                <select
                  name={`domain_color_${i}`}
                  value={domain.color}
                  onChange={(e) => updateDomain(i, "color", e.target.value)}
                  className="px-3 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-meq-sky focus:outline-none"
                >
                  {colors.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input type="hidden" name={`domain_key_${i}`} value={domain.key || domain.label.replace(/\s+/g, "").replace(/[^a-zA-Z]/g, "")} />
                {domains.length > 1 && (
                  <button type="button" onClick={() => removeDomain(i)} className="text-red-400 hover:text-red-300 text-sm px-2 py-2.5">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <input type="hidden" name="domainCount" value={domains.length} />
        </div>

        {state?.error && <p className="text-sm text-red-400 mb-4">{state.error}</p>}
        {state?.success && <p className="text-sm text-emerald-400 mb-4">Framework created! <Link href="/super/frameworks" className="underline">View all</Link></p>}

        <SubmitButton />
      </form>
    </div>
  );
}
