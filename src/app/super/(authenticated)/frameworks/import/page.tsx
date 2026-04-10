import { prisma } from "@/lib/db";
import Link from "next/link";
import ImportClient from "./ImportClient";

export default async function ImportFrameworkPage() {
  const schools = await prisma.school.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-3xl">
      <Link href="/super/frameworks" className="text-sm text-gray-400 hover:text-white">&larr; Back to Frameworks</Link>
      <h1 className="text-2xl font-bold text-white mt-2 mb-2">Import Framework from JSON</h1>
      <p className="text-gray-400 mb-6">
        Import a complete framework definition — domains, questions, interventions, pulse questions,
        messages, and scoring — from a structured JSON file. Use this for schools that want
        a bespoke framework built by Wasil.
      </p>

      <ImportClient schools={schools} />
    </div>
  );
}
