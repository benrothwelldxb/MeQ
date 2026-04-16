export type InspectorateKey = "ofsted" | "khda" | "adek" | "estyn" | "generic";

export interface Inspectorate {
  key: InspectorateKey;
  label: string;
  jurisdiction: string;
  /** Inspection framework name as commonly referenced by schools */
  frameworkName: string;
  /** Top-level standard that wellbeing data supports */
  relevantStandard: string;
  /** Preferred level vocabulary for presentation */
  levelTerminology: "standard" | "khda";
  /** One-line statement the summary should open with */
  headline: string;
}

export const INSPECTORATES: Record<InspectorateKey, Inspectorate> = {
  ofsted: {
    key: "ofsted",
    label: "Ofsted",
    jurisdiction: "England (UK)",
    frameworkName: "Education Inspection Framework",
    relevantStandard: "Personal development · Behaviour and attitudes",
    levelTerminology: "standard",
    headline:
      "Evidence of wellbeing provision, pupil voice, and behavioural/emotional development aligned to the EIF.",
  },
  khda: {
    key: "khda",
    label: "KHDA (Dubai)",
    jurisdiction: "Dubai, UAE",
    frameworkName: "UAE School Inspection Framework / DSIB",
    relevantStandard: "Personal and social development · Innovation skills",
    levelTerminology: "khda",
    headline:
      "Evidence of pupils' personal and social development, innovation, and wellbeing — aligned to DSIB performance standards.",
  },
  adek: {
    key: "adek",
    label: "ADEK (Abu Dhabi)",
    jurisdiction: "Abu Dhabi, UAE",
    frameworkName: "Irtiqa'a Inspection Framework",
    relevantStandard: "Personal development and attitudes",
    levelTerminology: "standard",
    headline:
      "Evidence of students' personal development and attitudes in line with Irtiqa'a inspection standards.",
  },
  estyn: {
    key: "estyn",
    label: "Estyn (Wales)",
    jurisdiction: "Wales (UK)",
    frameworkName: "Common Inspection Framework",
    relevantStandard: "Wellbeing and attitudes to learning",
    levelTerminology: "standard",
    headline:
      "Evidence of pupils' wellbeing and attitudes to learning, aligned to the Estyn Common Inspection Framework.",
  },
  generic: {
    key: "generic",
    label: "Generic summary",
    jurisdiction: "—",
    frameworkName: "School wellbeing summary",
    relevantStandard: "Student wellbeing and personal development",
    levelTerminology: "standard",
    headline:
      "Evidence of student wellbeing and personal development across the school.",
  },
};

export function getInspectorate(key: string | null | undefined): Inspectorate {
  if (key && key in INSPECTORATES) return INSPECTORATES[key as InspectorateKey];
  return INSPECTORATES.generic;
}

/**
 * KHDA use: Outstanding / Very Good / Good / Acceptable / Weak
 * Everyone else: Advanced / Secure / Developing / Emerging
 * This maps our internal levels to the right external vocabulary for the summary.
 */
export function translateLevelLabel(level: string, terminology: "standard" | "khda"): string {
  if (terminology !== "khda") return level;
  switch (level) {
    case "Advanced": return "Very Good";
    case "Secure": return "Good";
    case "Developing": return "Acceptable";
    case "Emerging": return "Weak";
    default: return level;
  }
}
