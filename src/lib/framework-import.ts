// Framework import/export types and validation.
// Use to bulk-import a full framework definition (domains, questions,
// interventions, pulse questions, messages, scoring) from a single JSON file.

export interface FrameworkImportJson {
  name: string;
  slug?: string;
  description?: string;
  assessmentFrequency?: "termly" | "biannual" | "annual" | "custom";
  activeTerms?: string[];
  domains: Array<{
    key: string;
    label: string;
    description?: string;
    color?: string;
    sortOrder?: number;
  }>;
  scoring?: {
    standard?: {
      levelThresholds: Array<{ level: string; min: number }>;
      overallThresholds: Array<{ level: string; min: number }>;
      maxDomainScore: number;
      maxTotalScore: number;
    };
    junior?: {
      levelThresholds: Array<{ level: string; min: number }>;
      overallThresholds: Array<{ level: string; min: number }>;
      maxDomainScore: number;
      maxTotalScore: number;
    };
  };
  questions: Array<{
    tier: "standard" | "junior";
    domain: string; // matches domain key or label
    orderIndex?: number;
    prompt: string;
    type?: "core" | "validation" | "trap";
    questionFormat?: string;
    answerOptions?: Array<{ label: string; value: number }>;
    scoreMap?: Record<string, number>;
    weight?: number;
    reverse?: boolean;
    isValidation?: boolean;
    isTrap?: boolean;
    validationPair?: number;
  }>;
  pulseQuestions?: Array<{
    tier: "standard" | "junior";
    domain: string;
    prompt: string;
    emoji?: string;
  }>;
  interventions?: Array<{
    domain: string;
    level: "Emerging" | "Developing" | "Secure" | "Advanced";
    audience: "teacher" | "student";
    title: string;
    description: string;
  }>;
  messages?: Array<{
    domain: string;
    type: "strength" | "strength_junior" | "next_step" | "next_step_junior" | "pulse_tip";
    content: string;
  }>;
}

export interface ValidationResult {
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

const VALID_LEVELS = ["Emerging", "Developing", "Secure", "Advanced"];
const VALID_AUDIENCES = ["teacher", "student"];
const VALID_TIERS = ["standard", "junior"];
const VALID_TYPES = ["core", "validation", "trap"];
const VALID_MESSAGE_TYPES = [
  "strength",
  "strength_junior",
  "next_step",
  "next_step_junior",
  "pulse_tip",
];

export function validateFrameworkJson(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Root must be an object"], warnings: [] };
  }

  const fw = data as Record<string, unknown>;

  if (!fw.name || typeof fw.name !== "string") {
    errors.push("Framework name is required");
  }

  if (!Array.isArray(fw.domains) || fw.domains.length === 0) {
    errors.push("At least one domain is required");
  }

  const domainKeys = new Set<string>();
  const domainLabels = new Map<string, string>(); // label (lowercase) -> key
  if (Array.isArray(fw.domains)) {
    for (let i = 0; i < fw.domains.length; i++) {
      const d = fw.domains[i] as Record<string, unknown>;
      if (!d.key || typeof d.key !== "string") {
        errors.push(`Domain ${i + 1}: key is required`);
        continue;
      }
      if (!d.label || typeof d.label !== "string") {
        errors.push(`Domain ${i + 1} (${d.key}): label is required`);
      }
      if (domainKeys.has(d.key)) {
        errors.push(`Domain key "${d.key}" is used more than once`);
      }
      domainKeys.add(d.key);
      if (typeof d.label === "string") {
        domainLabels.set(d.label.toLowerCase(), d.key);
      }
    }
  }

  function resolveDomain(input: string): string | null {
    if (domainKeys.has(input)) return input;
    return domainLabels.get(input.toLowerCase()) || null;
  }

  // Questions
  if (!Array.isArray(fw.questions) || fw.questions.length === 0) {
    errors.push("At least one question is required");
  } else {
    for (let i = 0; i < fw.questions.length; i++) {
      const q = fw.questions[i] as Record<string, unknown>;
      const rowNum = i + 1;
      if (!q.tier || !VALID_TIERS.includes(q.tier as string)) {
        errors.push(`Question ${rowNum}: tier must be "standard" or "junior"`);
      }
      if (!q.domain || typeof q.domain !== "string") {
        errors.push(`Question ${rowNum}: domain is required`);
      } else if (!resolveDomain(q.domain)) {
        errors.push(`Question ${rowNum}: unknown domain "${q.domain}"`);
      }
      if (!q.prompt || typeof q.prompt !== "string") {
        errors.push(`Question ${rowNum}: prompt is required`);
      }
      if (q.type && !VALID_TYPES.includes(q.type as string)) {
        errors.push(`Question ${rowNum}: type must be "core", "validation", or "trap"`);
      }
    }
  }

  // Interventions
  if (Array.isArray(fw.interventions)) {
    for (let i = 0; i < fw.interventions.length; i++) {
      const iv = fw.interventions[i] as Record<string, unknown>;
      const rowNum = i + 1;
      if (!iv.domain || !resolveDomain(iv.domain as string)) {
        errors.push(`Intervention ${rowNum}: unknown or missing domain`);
      }
      if (!iv.level || !VALID_LEVELS.includes(iv.level as string)) {
        errors.push(`Intervention ${rowNum}: level must be Emerging/Developing/Secure/Advanced`);
      }
      if (!iv.audience || !VALID_AUDIENCES.includes(iv.audience as string)) {
        errors.push(`Intervention ${rowNum}: audience must be teacher or student`);
      }
      if (!iv.title || !iv.description) {
        errors.push(`Intervention ${rowNum}: title and description are required`);
      }
    }
  }

  // Pulse questions
  if (Array.isArray(fw.pulseQuestions)) {
    for (let i = 0; i < fw.pulseQuestions.length; i++) {
      const pq = fw.pulseQuestions[i] as Record<string, unknown>;
      const rowNum = i + 1;
      if (!pq.tier || !VALID_TIERS.includes(pq.tier as string)) {
        errors.push(`Pulse question ${rowNum}: tier must be "standard" or "junior"`);
      }
      if (!pq.domain || !resolveDomain(pq.domain as string)) {
        errors.push(`Pulse question ${rowNum}: unknown or missing domain`);
      }
      if (!pq.prompt || typeof pq.prompt !== "string") {
        errors.push(`Pulse question ${rowNum}: prompt is required`);
      }
    }
  }

  // Messages
  if (Array.isArray(fw.messages)) {
    for (let i = 0; i < fw.messages.length; i++) {
      const m = fw.messages[i] as Record<string, unknown>;
      const rowNum = i + 1;
      if (!m.domain || !resolveDomain(m.domain as string)) {
        errors.push(`Message ${rowNum}: unknown or missing domain`);
      }
      if (!m.type || !VALID_MESSAGE_TYPES.includes(m.type as string)) {
        errors.push(`Message ${rowNum}: type must be one of ${VALID_MESSAGE_TYPES.join(", ")}`);
      }
      if (!m.content) {
        errors.push(`Message ${rowNum}: content is required`);
      }
    }
  }

  // Warnings (non-blocking)
  if (Array.isArray(fw.questions)) {
    const standardQs = fw.questions.filter((q) => (q as Record<string, unknown>).tier === "standard").length;
    const juniorQs = fw.questions.filter((q) => (q as Record<string, unknown>).tier === "junior").length;
    const perDomainStd = standardQs / (Array.isArray(fw.domains) ? fw.domains.length : 1);
    if (standardQs > 0 && perDomainStd < 5) {
      warnings.push(`Only ${perDomainStd.toFixed(1)} standard questions per domain on average. Recommended: 5+ core per domain.`);
    }
    if (juniorQs > 0 && juniorQs / (Array.isArray(fw.domains) ? fw.domains.length : 1) < 3) {
      warnings.push(`Fewer than 3 junior questions per domain on average. Recommended: 3-4 per domain.`);
    }
  }
  if (!fw.interventions || (Array.isArray(fw.interventions) && fw.interventions.length === 0)) {
    warnings.push("No interventions provided — teacher class reports will have no suggested strategies");
  }
  if (!fw.pulseQuestions || (Array.isArray(fw.pulseQuestions) && fw.pulseQuestions.length === 0)) {
    warnings.push("No pulse questions provided — schools using this framework can't use the Weekly Pulse");
  }

  const summary = errors.length === 0 && Array.isArray(fw.domains) && Array.isArray(fw.questions)
    ? {
        name: fw.name as string,
        domainCount: fw.domains.length,
        standardQuestions: fw.questions.filter((q) => (q as Record<string, unknown>).tier === "standard").length,
        juniorQuestions: fw.questions.filter((q) => (q as Record<string, unknown>).tier === "junior").length,
        interventions: Array.isArray(fw.interventions) ? fw.interventions.length : 0,
        pulseQuestions: Array.isArray(fw.pulseQuestions) ? fw.pulseQuestions.length : 0,
        messages: Array.isArray(fw.messages) ? fw.messages.length : 0,
      }
    : undefined;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary,
  };
}
