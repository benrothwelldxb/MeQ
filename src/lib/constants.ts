export const LOGIN_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const LOGIN_CODE_LENGTH = 8;
export const TOTAL_QUESTIONS = 40;

export const DOMAINS = [
  "KnowMe",
  "ManageMe",
  "UnderstandOthers",
  "WorkWithOthers",
  "ChooseWell",
] as const;

export type Domain = (typeof DOMAINS)[number];

export const DOMAIN_LABELS: Record<Domain, string> = {
  KnowMe: "Know Me",
  ManageMe: "Manage Me",
  UnderstandOthers: "Understand Others",
  WorkWithOthers: "Work With Others",
  ChooseWell: "Choose Well",
};

export const DOMAIN_DESCRIPTIONS: Record<Domain, string> = {
  KnowMe: "Understanding your own feelings and what makes you tick",
  ManageMe: "Handling big emotions and staying on track",
  UnderstandOthers: "Noticing how other people feel and showing you care",
  WorkWithOthers: "Getting along, sharing ideas, and solving problems together",
  ChooseWell: "Making good decisions and thinking about what's right",
};

export const DOMAIN_COLORS: Record<Domain, { bg: string; text: string; border: string }> = {
  KnowMe: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  ManageMe: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  UnderstandOthers: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  WorkWithOthers: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  ChooseWell: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

export const LEVELS = ["Emerging", "Developing", "Secure", "Advanced"] as const;
export type Level = (typeof LEVELS)[number];

// Raw weighted-sum thresholds per domain
export const LEVEL_THRESHOLDS: { level: Level; min: number }[] = [
  { level: "Advanced", min: 18 },
  { level: "Secure", min: 15 },
  { level: "Developing", min: 10 },
  { level: "Emerging", min: 0 },
];

// Overall MeQ score thresholds (sum of 5 domain scores)
export const OVERALL_LEVEL_THRESHOLDS: { level: Level; min: number }[] = [
  { level: "Advanced", min: 90 },
  { level: "Secure", min: 75 },
  { level: "Developing", min: 50 },
  { level: "Emerging", min: 0 },
];

// Max possible domain score: 5 core questions with weights (1+1+1+1.5+2) × 4 = 26
export const MAX_DOMAIN_SCORE = 26;
// Max possible total score: 5 domains × 26 = 130
export const MAX_TOTAL_SCORE = 130;

export const LEVEL_COLORS: Record<Level, { bg: string; text: string }> = {
  Emerging: { bg: "bg-gray-100", text: "text-gray-700" },
  Developing: { bg: "bg-amber-100", text: "text-amber-800" },
  Secure: { bg: "bg-blue-100", text: "text-blue-800" },
  Advanced: { bg: "bg-emerald-100", text: "text-emerald-800" },
};

// Student-facing strength messages
export const STRENGTH_MESSAGES: Record<Domain, string> = {
  KnowMe: "You show strong skills in understanding your own feelings.",
  ManageMe: "You show strong skills in managing your emotions and staying on track.",
  UnderstandOthers: "You show strong skills in understanding how other people feel.",
  WorkWithOthers: "You show strong skills in working well with others.",
  ChooseWell: "You show strong skills in making thoughtful choices.",
};

// Student-facing next step suggestions for lower-scoring domains
export const NEXT_STEPS: Record<Domain, string[]> = {
  KnowMe: [
    "Try naming your feelings when you notice them — are you happy, frustrated, nervous?",
    "Keep a short feelings diary to spot patterns in your mood.",
  ],
  ManageMe: [
    "Try taking three slow, deep breaths when you feel strong emotions.",
    "Practise pausing before you react — count to five in your head.",
  ],
  UnderstandOthers: [
    "Watch people's faces and body language to guess how they might feel.",
    "Ask a friend how they are doing and really listen to their answer.",
  ],
  WorkWithOthers: [
    "Practise taking turns and letting others share their ideas first.",
    "Try turn-taking games and listening activities with friends.",
  ],
  ChooseWell: [
    "Before you act, think: what could happen next?",
    "Talk through tricky decisions with someone you trust.",
  ],
};
