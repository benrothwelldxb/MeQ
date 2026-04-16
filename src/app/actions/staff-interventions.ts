"use server";

import { prisma } from "@/lib/db";
import { getSuperAdminSession, getAdminSession } from "@/lib/session";
import { parse } from "csv-parse/sync";
import { revalidatePath } from "next/cache";

const VALID_LEVELS = ["Emerging", "Developing", "Secure", "Advanced"];

const DEFAULT_STAFF_INTERVENTIONS: Array<{
  domainKey: string;
  level: string;
  title: string;
  description: string;
}> = [
  // SelfAwareness
  { domainKey: "SelfAwareness", level: "Developing", title: "Daily Check-In", description: "Take 2 minutes to identify how you are feeling and why." },
  { domainKey: "SelfAwareness", level: "Developing", title: "Trigger Spotting", description: "Notice one moment in the day that affects your mood." },
  { domainKey: "SelfAwareness", level: "Developing", title: "Name It", description: "Label your emotion in a challenging moment." },
  { domainKey: "SelfAwareness", level: "Secure", title: "Reflect and Adjust", description: "Reflect on how your emotions affected your teaching today." },
  { domainKey: "SelfAwareness", level: "Secure", title: "Pattern Recognition", description: "Identify patterns in your emotional responses across the week." },
  { domainKey: "SelfAwareness", level: "Secure", title: "Strength Awareness", description: "List one strength you used effectively today." },
  { domainKey: "SelfAwareness", level: "Advanced", title: "Model Awareness", description: "Verbally model emotional awareness to students." },
  { domainKey: "SelfAwareness", level: "Advanced", title: "Coach Others", description: "Support a colleague in reflecting on their responses." },
  { domainKey: "SelfAwareness", level: "Advanced", title: "Deep Reflection", description: "Journal on how your mindset shapes classroom climate." },

  // SelfManagement
  { domainKey: "SelfManagement", level: "Developing", title: "Pause Strategy", description: "Take a deliberate pause before responding in a stressful moment." },
  { domainKey: "SelfManagement", level: "Developing", title: "Break Reset", description: "Schedule one short break to reset during the day." },
  { domainKey: "SelfManagement", level: "Developing", title: "Reduce Load", description: "Identify and remove one unnecessary task." },
  { domainKey: "SelfManagement", level: "Secure", title: "Plan Responses", description: "Plan how you will respond to a known stress trigger." },
  { domainKey: "SelfManagement", level: "Secure", title: "Energy Management", description: "Structure your day around high/low energy periods." },
  { domainKey: "SelfManagement", level: "Secure", title: "Stay Calm", description: "Use a breathing strategy in a challenging situation." },
  { domainKey: "SelfManagement", level: "Advanced", title: "Model Calm", description: "Demonstrate calm responses in high-pressure moments." },
  { domainKey: "SelfManagement", level: "Advanced", title: "Support Others", description: "Help a colleague manage workload or stress." },
  { domainKey: "SelfManagement", level: "Advanced", title: "Sustain Performance", description: "Maintain consistent regulation across a full week." },

  // RelationalEmpathy
  { domainKey: "RelationalEmpathy", level: "Developing", title: "Active Listening", description: "Give full attention when a pupil or colleague speaks." },
  { domainKey: "RelationalEmpathy", level: "Developing", title: "Check Understanding", description: "Repeat back what someone has said to confirm." },
  { domainKey: "RelationalEmpathy", level: "Developing", title: "Notice Signals", description: "Look for one non-verbal cue in a conversation." },
  { domainKey: "RelationalEmpathy", level: "Secure", title: "Respond Thoughtfully", description: "Adjust your response based on others' emotions." },
  { domainKey: "RelationalEmpathy", level: "Secure", title: "Build Trust", description: "Have a short positive interaction with a pupil." },
  { domainKey: "RelationalEmpathy", level: "Secure", title: "Perspective Taking", description: "Consider a situation from a pupil's viewpoint." },
  { domainKey: "RelationalEmpathy", level: "Advanced", title: "Model Empathy", description: "Demonstrate empathetic responses in front of others." },
  { domainKey: "RelationalEmpathy", level: "Advanced", title: "Support Colleagues", description: "Actively support a colleague in a difficult moment." },
  { domainKey: "RelationalEmpathy", level: "Advanced", title: "Shape Culture", description: "Promote a culture of listening and understanding." },

  // TeamCollaboration
  { domainKey: "TeamCollaboration", level: "Developing", title: "Ask for Help", description: "Seek support from a colleague when needed." },
  { domainKey: "TeamCollaboration", level: "Developing", title: "Share Practice", description: "Share one idea or resource with your team." },
  { domainKey: "TeamCollaboration", level: "Developing", title: "Join In", description: "Contribute at least once in a team discussion." },
  { domainKey: "TeamCollaboration", level: "Secure", title: "Collaborate Actively", description: "Work with a colleague on a shared task." },
  { domainKey: "TeamCollaboration", level: "Secure", title: "Support Team", description: "Offer help to a team member." },
  { domainKey: "TeamCollaboration", level: "Secure", title: "Build Relationships", description: "Strengthen one professional relationship." },
  { domainKey: "TeamCollaboration", level: "Advanced", title: "Lead Collaboration", description: "Facilitate a productive team discussion." },
  { domainKey: "TeamCollaboration", level: "Advanced", title: "Mentor Others", description: "Support a colleague's development." },
  { domainKey: "TeamCollaboration", level: "Advanced", title: "Drive Team Success", description: "Align team efforts towards shared goals." },

  // ProfessionalPurpose
  { domainKey: "ProfessionalPurpose", level: "Developing", title: "Reconnect Purpose", description: "Reflect on why you chose teaching." },
  { domainKey: "ProfessionalPurpose", level: "Developing", title: "Small Wins", description: "Identify one meaningful moment in your day." },
  { domainKey: "ProfessionalPurpose", level: "Developing", title: "Align Actions", description: "Choose one task that aligns with your values." },
  { domainKey: "ProfessionalPurpose", level: "Secure", title: "Values Check", description: "Reflect on how your work aligns with your values." },
  { domainKey: "ProfessionalPurpose", level: "Secure", title: "Impact Focus", description: "Identify how your actions impact pupils." },
  { domainKey: "ProfessionalPurpose", level: "Secure", title: "Growth Planning", description: "Plan one professional development step." },
  { domainKey: "ProfessionalPurpose", level: "Advanced", title: "Model Purpose", description: "Share your sense of purpose with others." },
  { domainKey: "ProfessionalPurpose", level: "Advanced", title: "Lead with Values", description: "Make decisions aligned with core values." },
  { domainKey: "ProfessionalPurpose", level: "Advanced", title: "Inspire Others", description: "Encourage colleagues to connect with their purpose." },
];

/** Seeds the default staff interventions if none exist. Idempotent — safe to run repeatedly. */
export async function seedDefaultStaffInterventions() {
  const session = await getSuperAdminSession();
  if (!session.superAdminId) return { error: "Unauthorized." };

  // Fetch existing defaults once, then do all creates in parallel.
  const existing = await prisma.staffIntervention.findMany({
    where: { schoolId: null },
    select: { domainKey: true, level: true, title: true },
  });
  const existingKeys = new Set(
    existing.map((e) => `${e.domainKey}|${e.level}|${e.title}`)
  );

  const sortByGroup: Record<string, number> = {};
  const payloads: Parameters<typeof prisma.staffIntervention.create>[0]["data"][] = [];
  let skipped = 0;
  for (const iv of DEFAULT_STAFF_INTERVENTIONS) {
    if (existingKeys.has(`${iv.domainKey}|${iv.level}|${iv.title}`)) {
      skipped++;
      continue;
    }
    const groupKey = `${iv.domainKey}-${iv.level}`;
    sortByGroup[groupKey] = (sortByGroup[groupKey] ?? -1) + 1;
    payloads.push({
      domainKey: iv.domainKey,
      level: iv.level,
      title: iv.title,
      description: iv.description,
      sortOrder: sortByGroup[groupKey],
      isDefault: true,
    });
  }

  if (payloads.length > 0) {
    await prisma.staffIntervention.createMany({ data: payloads });
  }

  revalidatePath("/super/staff-wellbeing");
  return { success: true, created: payloads.length, skipped };
}

/** Bulk upload staff interventions via CSV. Columns: domain, level, title, description */
export async function uploadStaffInterventions(csvText: string) {
  const session = await getSuperAdminSession();
  if (!session.superAdminId) return { error: "Unauthorized." };

  let records: Array<Record<string, string>>;
  try {
    records = parse(csvText, { columns: true, skip_empty_lines: true, trim: true });
  } catch {
    return { error: "Could not parse CSV." };
  }
  if (records.length === 0) return { error: "CSV is empty." };

  const findCol = (names: string[]) =>
    Object.keys(records[0]).find((k) => names.includes(k.toLowerCase().trim()));

  const domainCol = findCol(["domain", "domain_key", "domainkey"]);
  const levelCol = findCol(["level"]);
  const titleCol = findCol(["title"]);
  const descCol = findCol(["description", "desc"]);

  if (!domainCol || !levelCol || !titleCol || !descCol) {
    return { error: "CSV must have columns: domain, level, title, description" };
  }

  const staffDomains = await prisma.staffDomain.findMany({ select: { key: true, label: true } });
  const keySet = new Set(staffDomains.map((d) => d.key));
  const labelToKey: Record<string, string> = {};
  for (const d of staffDomains) {
    labelToKey[d.label.toLowerCase()] = d.key;
    labelToKey[d.key.toLowerCase()] = d.key;
  }
  const resolveDomain = (input: string): string | null => {
    if (keySet.has(input)) return input;
    return labelToKey[input.toLowerCase()] ?? null;
  };

  let created = 0;
  const errors: string[] = [];
  const validLabels = staffDomains.map((d) => `${d.label} (${d.key})`).join(", ");

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const domainRaw = row[domainCol]?.trim();
    const level = row[levelCol]?.trim();
    const title = row[titleCol]?.trim();
    const description = row[descCol]?.trim();

    if (!domainRaw || !level || !title || !description) {
      errors.push(`Row ${i + 2}: Missing required fields`);
      continue;
    }
    const domain = resolveDomain(domainRaw);
    if (!domain) {
      errors.push(`Row ${i + 2}: Unknown staff domain "${domainRaw}". Valid: ${validLabels}`);
      continue;
    }
    if (!VALID_LEVELS.includes(level)) {
      errors.push(`Row ${i + 2}: Invalid level "${level}". Must be one of: ${VALID_LEVELS.join(", ")}`);
      continue;
    }

    const lastIv = await prisma.staffIntervention.findFirst({
      where: { domainKey: domain, level, schoolId: null },
      orderBy: { sortOrder: "desc" },
    });

    await prisma.staffIntervention.create({
      data: {
        domainKey: domain,
        level,
        title,
        description,
        isDefault: true,
        sortOrder: (lastIv?.sortOrder ?? -1) + 1,
      },
    });
    created++;
  }

  revalidatePath("/super/staff-wellbeing");
  return { success: true, count: created, errors: errors.length > 0 ? errors : undefined };
}

/** Lookup interventions for a teacher's wellbeing results — used on the teacher wellbeing page */
export async function getStaffInterventionsByDomain(
  domainLevels: Record<string, string>
) {
  const session = await getAdminSession().catch(() => null);
  // Either admin or teacher session is fine; if neither, no auth context required for default interventions
  void session;

  const results: Record<string, { id: string; title: string; description: string }[]> = {};
  for (const [domain, level] of Object.entries(domainLevels)) {
    const list = await prisma.staffIntervention.findMany({
      where: { domainKey: domain, level },
      orderBy: { sortOrder: "asc" },
      select: { id: true, title: true, description: true },
    });
    results[domain] = list;
  }
  return results;
}
