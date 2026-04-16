"use server";

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getSchoolSettings, TERM_LABELS } from "@/lib/school";
import { parseEmailList } from "@/lib/email";
import { parseNumberRecord, parseStringRecord } from "@/lib/json";
import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";

const MIN_COHORT = 5;
const MODEL = "claude-opus-4-6";

export type InsightNarrative = {
  summary: string;
  strengths: Array<{ title: string; detail: string }>;
  developmentAreas: Array<{ title: string; detail: string }>;
  nextSteps: string[];
};

type GenerateResult =
  | { success: true; narrative: InsightNarrative; regenerated: boolean }
  | { error: string };

/**
 * Only DSL-matched admins can trigger generation — staff data is sensitive.
 * (We already gate the full alerts dashboard the same way.)
 */
async function requireDslAdmin() {
  const session = await getAdminSession();
  if (!session.adminId) return { error: "Unauthorized." as const };

  const [admin, school] = await Promise.all([
    prisma.admin.findUnique({ where: { id: session.adminId }, select: { email: true } }),
    prisma.school.findUnique({
      where: { id: session.schoolId },
      select: { dslEmail: true, staffWellbeingEnabled: true, name: true },
    }),
  ]);
  if (!admin || !school) return { error: "Unauthorized." as const };
  if (!school.staffWellbeingEnabled) {
    return { error: "Staff wellbeing is not enabled." as const };
  }

  const dslEmails = parseEmailList(school.dslEmail);
  if (!dslEmails.includes(admin.email.toLowerCase())) {
    return {
      error: "Only Designated Safeguarding Leads can generate staff insights." as const,
    };
  }

  return { session, school };
}

export async function generateStaffWellbeingInsight(
  _prev: GenerateResult | null,
  formData: FormData
): Promise<GenerateResult> {
  const auth = await requireDslAdmin();
  if ("error" in auth) return { error: auth.error as string };

  const force = formData.get("force") === "true";
  const school = await getSchoolSettings(auth.session.schoolId);
  const existing = await prisma.staffWellbeingInsight.findUnique({
    where: {
      schoolId_term_academicYear: {
        schoolId: school.id,
        term: school.currentTerm,
        academicYear: school.academicYear,
      },
    },
  });
  if (existing && !force) {
    return {
      success: true,
      narrative: JSON.parse(existing.narrativeJson) as InsightNarrative,
      regenerated: false,
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { error: "ANTHROPIC_API_KEY is not configured on the server." };
  }

  // Gather aggregate data. NOTHING individual is sent to the API.
  const domains = await prisma.staffDomain.findMany({
    orderBy: { sortOrder: "asc" },
    select: { key: true, label: true, description: true },
  });

  const assessments = await prisma.staffAssessment.findMany({
    where: {
      status: "completed",
      term: school.currentTerm,
      academicYear: school.academicYear,
      teacher: { schoolId: school.id },
    },
    select: { domainScoresJson: true, domainLevelsJson: true, totalScore: true, overallLevel: true },
  });

  if (assessments.length < MIN_COHORT) {
    return {
      error: `Cohort too small for AI insights (need ${MIN_COHORT}+ completed, have ${assessments.length}).`,
    };
  }

  const scoringConfig = await prisma.staffScoringConfig.findUnique({ where: { key: "default" } });
  const maxDomain = scoringConfig?.maxDomainScore ?? 16;
  const maxTotal = scoringConfig?.maxTotalScore ?? 80;

  // Compute per-domain averages and level distribution
  const domainAverages: Record<string, number> = {};
  const levelCounts: Record<string, Record<string, number>> = {};
  for (const d of domains) {
    domainAverages[d.key] = 0;
    levelCounts[d.key] = { Emerging: 0, Developing: 0, Secure: 0, Advanced: 0 };
  }

  for (const a of assessments) {
    const scores = parseNumberRecord(a.domainScoresJson);
    const levels = parseStringRecord(a.domainLevelsJson);
    for (const d of domains) {
      domainAverages[d.key] += scores[d.key] ?? 0;
      const level = levels[d.key];
      if (level && levelCounts[d.key][level] !== undefined) {
        levelCounts[d.key][level]++;
      }
    }
  }
  for (const d of domains) {
    domainAverages[d.key] = Math.round((domainAverages[d.key] / assessments.length) * 10) / 10;
  }

  const avgTotal =
    assessments.length > 0
      ? Math.round(
          (assessments.reduce((s, a) => s + (a.totalScore ?? 0), 0) / assessments.length) * 10
        ) / 10
      : 0;

  // Call Claude
  const anthropic = new Anthropic({ apiKey });

  const userPayload = {
    school: {
      name: school.name,
      term: `${TERM_LABELS[school.currentTerm] ?? school.currentTerm} ${school.academicYear}`,
      cohortSize: assessments.length,
      averageTotal: avgTotal,
      maxTotal,
    },
    domains: domains.map((d) => ({
      key: d.key,
      label: d.label,
      description: d.description,
      averageScore: domainAverages[d.key],
      maxScore: maxDomain,
      percentOfMax: Math.round((domainAverages[d.key] / maxDomain) * 100),
      levelDistribution: levelCounts[d.key],
    })),
  };

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system:
      [
        "You are a school wellbeing advisor with experience in UK and international primary school leadership.",
        "Your job: read the aggregated, anonymised staff wellbeing data for a school and return actionable commentary.",
        "Tone: warm but professional. Specific, not generic. Name the domains explicitly.",
        "Content rules:",
        "- Treat numbers above 70% of max as real strengths; 45–70% as solid-but-watch; below 45% as genuine development areas.",
        "- Always ground each point in a specific domain by name.",
        "- Never invent numbers — only use what the payload provides.",
        "- Next steps must be practical, low-cost, and something the headteacher or SLT could reasonably try this term.",
        "- Avoid jargon and therapy-speak. UK English spelling.",
        "Return VALID JSON matching this TypeScript type exactly, nothing else:",
        "type Output = {",
        '  summary: string;            // 2-3 sentences, plain English, sets the overall picture',
        '  strengths: { title: string; detail: string }[];  // 2-3 items',
        '  developmentAreas: { title: string; detail: string }[]; // 2-3 items',
        '  nextSteps: string[];        // 3-5 short practical actions',
        "};",
      ].join("\n"),
    messages: [
      {
        role: "user",
        content: `Here is the anonymised aggregate data for our staff wellbeing check-in.\n\n${JSON.stringify(
          userPayload,
          null,
          2
        )}\n\nGenerate the commentary JSON.`,
      },
    ],
  });

  const textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return { error: "Model returned no text." };
  }

  // Tolerate the model wrapping the JSON in code fences.
  const raw = textBlock.text.trim();
  const jsonText = raw.startsWith("```")
    ? raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
    : raw;

  let narrative: InsightNarrative;
  try {
    narrative = JSON.parse(jsonText) as InsightNarrative;
  } catch (err) {
    console.error("[staff-insight] JSON parse failed:", err, "raw:", raw.slice(0, 500));
    return { error: "Could not parse model output. Try again." };
  }

  await prisma.staffWellbeingInsight.upsert({
    where: {
      schoolId_term_academicYear: {
        schoolId: school.id,
        term: school.currentTerm,
        academicYear: school.academicYear,
      },
    },
    update: {
      narrativeJson: JSON.stringify(narrative),
      modelUsed: MODEL,
      cohortSize: assessments.length,
      generatedAt: new Date(),
    },
    create: {
      schoolId: school.id,
      term: school.currentTerm,
      academicYear: school.academicYear,
      narrativeJson: JSON.stringify(narrative),
      modelUsed: MODEL,
      cohortSize: assessments.length,
    },
  });

  revalidatePath("/admin/staff-wellbeing");
  return { success: true, narrative, regenerated: !!existing };
}
