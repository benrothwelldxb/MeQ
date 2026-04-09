"use server";

import { prisma } from "@/lib/db";
import { parse } from "csv-parse/sync";
import { revalidatePath } from "next/cache";

export async function uploadFrameworkQuestions(
  frameworkId: string,
  tier: string,
  csvText: string
) {
  let records: Array<Record<string, string>>;
  try {
    records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    return { error: "Could not parse CSV. Check the format." };
  }

  if (records.length === 0) {
    return { error: "CSV is empty." };
  }

  const headers = Object.keys(records[0]).map((h) => h.toLowerCase().trim());

  // Find prompt column
  const promptCol = Object.keys(records[0]).find((h) => {
    const lc = h.toLowerCase().trim();
    return lc === "prompt" || lc === "question" || lc === "text";
  });
  if (!promptCol) {
    return { error: "CSV must have a 'prompt' or 'question' column." };
  }

  // Find domain column
  const domainCol = Object.keys(records[0]).find((h) => {
    const lc = h.toLowerCase().trim();
    return lc === "domain" || lc === "domain_key" || lc === "domainkey";
  });
  if (!domainCol) {
    return { error: "CSV must have a 'domain' column matching your framework domain keys." };
  }

  // Optional columns
  const typeCol = Object.keys(records[0]).find((h) => ["type", "question_type"].includes(h.toLowerCase().trim()));
  const weightCol = Object.keys(records[0]).find((h) => ["weight"].includes(h.toLowerCase().trim()));
  const reverseCol = Object.keys(records[0]).find((h) => ["reverse", "reversed", "reverse_scored"].includes(h.toLowerCase().trim()));

  const DEFAULT_ANSWER_OPTIONS = JSON.stringify([
    { label: "Not like me at all", value: 1 },
    { label: "A little like me", value: 2 },
    { label: "Quite like me", value: 3 },
    { label: "Very much like me", value: 4 },
  ]);
  const FORWARD_SCORE_MAP = JSON.stringify({ "1": 0, "2": 1, "3": 2, "4": 3 });
  const REVERSE_SCORE_MAP = JSON.stringify({ "1": 3, "2": 2, "3": 1, "4": 0 });

  // Validate domains exist
  const framework = await prisma.framework.findUnique({
    where: { id: frameworkId },
    include: { domains: true },
  });
  if (!framework) return { error: "Framework not found." };

  const validDomains = new Set(framework.domains.map((d) => d.key));

  // Get current max orderIndex for this tier
  const lastQ = await prisma.frameworkQuestion.findFirst({
    where: { frameworkId, tier },
    orderBy: { orderIndex: "desc" },
  });
  let nextOrder = (lastQ?.orderIndex ?? 0) + 1;

  const errors: string[] = [];
  let created = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const prompt = row[promptCol]?.trim();
    const domain = row[domainCol]?.trim();

    if (!prompt || !domain) {
      errors.push(`Row ${i + 2}: Missing prompt or domain`);
      continue;
    }

    if (!validDomains.has(domain)) {
      errors.push(`Row ${i + 2}: Unknown domain "${domain}". Valid: ${Array.from(validDomains).join(", ")}`);
      continue;
    }

    const type = typeCol ? (row[typeCol]?.trim().toLowerCase() || "core") : "core";
    const weight = weightCol ? (parseFloat(row[weightCol]) || 1.0) : 1.0;
    const isReversed = reverseCol ? ["yes", "true", "1", "y"].includes(row[reverseCol]?.trim().toLowerCase() || "") : false;

    await prisma.frameworkQuestion.create({
      data: {
        frameworkId,
        tier,
        orderIndex: nextOrder++,
        domainKey: domain,
        prompt,
        type: ["core", "validation", "trap"].includes(type) ? type : "core",
        questionFormat: "self-report",
        answerOptions: DEFAULT_ANSWER_OPTIONS,
        scoreMap: isReversed ? REVERSE_SCORE_MAP : FORWARD_SCORE_MAP,
        weight,
        isValidation: type === "validation",
        isTrap: type === "trap",
      },
    });
    created++;
  }

  revalidatePath(`/super/frameworks/${frameworkId}`);

  return {
    success: true,
    count: created,
    errors: errors.length > 0 ? errors : undefined,
  };
}
