export const LOGIN_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const LOGIN_CODE_LENGTH = 8;

// === TIERS ===

export const TIERS = ["junior", "standard"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_LABELS: Record<Tier, string> = {
  junior: "Junior (5-7)",
  standard: "Standard (8-11)",
};

// Total questions per tier
export const TOTAL_QUESTIONS: Record<Tier, number> = {
  junior: 20,
  standard: 40,
};

// Map year groups to tiers
export function getTierFromYearGroup(yearGroup: string): Tier {
  const normalized = yearGroup.toLowerCase().trim();
  // FS2/Reception, Year 1, Year 2 → junior
  if (
    normalized.includes("reception") ||
    normalized.includes("fs2") ||
    normalized.includes("year 1") ||
    normalized.includes("year 2") ||
    normalized === "r" ||
    normalized === "y1" ||
    normalized === "y2"
  ) {
    return "junior";
  }
  return "standard";
}

// === DOMAINS ===

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

// Junior-friendly domain descriptions
export const DOMAIN_DESCRIPTIONS_JUNIOR: Record<Domain, string> = {
  KnowMe: "Knowing how you feel inside",
  ManageMe: "Staying calm when things are tricky",
  UnderstandOthers: "Noticing how your friends feel",
  WorkWithOthers: "Playing and working nicely with others",
  ChooseWell: "Making good choices",
};

// === CASEL ALIGNMENT ===

export const CASEL_ALIGNMENT: Record<Domain, {
  caselName: string;
  caselDefinition: string;
  caselSkills: string[];
  meqAlignment: string;
}> = {
  KnowMe: {
    caselName: "Self-Awareness",
    caselDefinition: "The abilities to understand one's own emotions, thoughts, and values and how they influence behaviour across contexts. This includes recognising one's strengths and limitations with confidence and purpose.",
    caselSkills: [
      "Identifying one's emotions",
      "Having a growth mindset",
      "Demonstrating honesty and integrity",
      "Experiencing self-efficacy",
      "Developing interests and sense of purpose",
    ],
    meqAlignment: "Know Me measures how well a child can identify, name, and understand their own emotions. It captures the foundational CASEL skill of emotional self-awareness through age-appropriate self-report and scenario questions.",
  },
  ManageMe: {
    caselName: "Self-Management",
    caselDefinition: "The abilities to manage one's emotions, thoughts, and behaviours effectively in different situations and to achieve goals and aspirations. This includes delaying gratification, managing stress, and feeling agency.",
    caselSkills: [
      "Managing one's emotions",
      "Identifying and using stress management strategies",
      "Exhibiting self-discipline and self-motivation",
      "Setting personal and collective goals",
      "Showing courage to take initiative",
    ],
    meqAlignment: "Manage Me assesses a child's capacity to regulate emotions, persevere through difficulty, and exercise self-control. It directly maps to the CASEL competency of managing emotions and behaviours to achieve goals.",
  },
  UnderstandOthers: {
    caselName: "Social Awareness",
    caselDefinition: "The abilities to understand the perspectives of and empathise with others, including those from diverse backgrounds, cultures, and contexts. This includes recognising community resources and supports.",
    caselSkills: [
      "Taking others' perspectives",
      "Demonstrating empathy and compassion",
      "Showing concern for others' feelings",
      "Recognising strengths in others",
      "Understanding and expressing gratitude",
    ],
    meqAlignment: "Understand Others measures a child's ability to recognise emotions in others, show empathy, and consider different perspectives. It aligns with the CASEL competency of perspective-taking and compassion.",
  },
  WorkWithOthers: {
    caselName: "Relationship Skills",
    caselDefinition: "The abilities to establish and maintain healthy and supportive relationships and to effectively navigate settings with diverse individuals and groups. This includes clear communication and collaborative problem-solving.",
    caselSkills: [
      "Communicating effectively",
      "Developing positive relationships",
      "Practising teamwork and collaborative problem-solving",
      "Resolving conflicts constructively",
      "Seeking or offering support when needed",
    ],
    meqAlignment: "Work With Others assesses how well a child collaborates, communicates, and resolves conflicts with peers. It maps directly to the CASEL competency of building and maintaining healthy relationships.",
  },
  ChooseWell: {
    caselName: "Responsible Decision-Making",
    caselDefinition: "The abilities to make caring and constructive choices about personal behaviour and social interactions across diverse situations. This includes considering ethical standards and evaluating consequences.",
    caselSkills: [
      "Making reasoned judgments after analysing information",
      "Anticipating and evaluating consequences of actions",
      "Identifying solutions for personal and social problems",
      "Reflecting on one's role in promoting well-being",
      "Demonstrating curiosity and open-mindedness",
    ],
    meqAlignment: "Choose Well measures a child's ability to think before acting, consider consequences, and make responsible choices. It aligns with the CASEL competency of ethical, caring decision-making.",
  },
};

export const DOMAIN_COLORS: Record<Domain, { bg: string; text: string; border: string }> = {
  KnowMe: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  ManageMe: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  UnderstandOthers: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  WorkWithOthers: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  ChooseWell: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

// === LEVELS ===

export const LEVELS = ["Emerging", "Developing", "Secure", "Advanced"] as const;
export type Level = (typeof LEVELS)[number];

// Standard tier: raw weighted-sum thresholds per domain
export const LEVEL_THRESHOLDS: { level: Level; min: number }[] = [
  { level: "Advanced", min: 18 },
  { level: "Secure", min: 15 },
  { level: "Developing", min: 10 },
  { level: "Emerging", min: 0 },
];

// Junior tier: 4 questions per domain, all weight 1.0, max 16 per domain
export const JUNIOR_LEVEL_THRESHOLDS: { level: Level; min: number }[] = [
  { level: "Advanced", min: 14 },
  { level: "Secure", min: 11 },
  { level: "Developing", min: 8 },
  { level: "Emerging", min: 0 },
];

// Overall MeQ score thresholds (sum of 5 domain scores)
export const OVERALL_LEVEL_THRESHOLDS: { level: Level; min: number }[] = [
  { level: "Advanced", min: 90 },
  { level: "Secure", min: 75 },
  { level: "Developing", min: 50 },
  { level: "Emerging", min: 0 },
];

export const JUNIOR_OVERALL_LEVEL_THRESHOLDS: { level: Level; min: number }[] = [
  { level: "Advanced", min: 70 },
  { level: "Secure", min: 55 },
  { level: "Developing", min: 40 },
  { level: "Emerging", min: 0 },
];

// Max possible domain score per tier
// Standard: 5 core questions with weights (1+1+1+1.5+2) × 4 = 26
// Junior: 4 core questions all weight 1.0 × 4 = 16
export const MAX_DOMAIN_SCORE: Record<Tier, number> = {
  standard: 26,
  junior: 16,
};
export const MAX_TOTAL_SCORE: Record<Tier, number> = {
  standard: 130,
  junior: 80,
};

export const LEVEL_COLORS: Record<Level, { bg: string; text: string }> = {
  Emerging: { bg: "bg-gray-100", text: "text-gray-700" },
  Developing: { bg: "bg-amber-100", text: "text-amber-800" },
  Secure: { bg: "bg-blue-100", text: "text-blue-800" },
  Advanced: { bg: "bg-emerald-100", text: "text-emerald-800" },
};

// === STUDENT-FACING TEXT ===

// Standard strength messages
export const STRENGTH_MESSAGES: Record<Domain, string> = {
  KnowMe: "You show strong skills in understanding your own feelings.",
  ManageMe: "You show strong skills in managing your emotions and staying on track.",
  UnderstandOthers: "You show strong skills in understanding how other people feel.",
  WorkWithOthers: "You show strong skills in working well with others.",
  ChooseWell: "You show strong skills in making thoughtful choices.",
};

// Junior strength messages
export const JUNIOR_STRENGTH_MESSAGES: Record<Domain, string> = {
  KnowMe: "You're really good at knowing how you feel!",
  ManageMe: "You're really good at staying calm!",
  UnderstandOthers: "You're really good at understanding your friends!",
  WorkWithOthers: "You're really good at playing and working with others!",
  ChooseWell: "You're really good at making good choices!",
};

// Standard next step suggestions
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

// Junior next step suggestions
export const JUNIOR_NEXT_STEPS: Record<Domain, string[]> = {
  KnowMe: [
    "Try telling a grown-up how you feel each day — happy, sad, or something else!",
    "Draw a picture of how you feel.",
  ],
  ManageMe: [
    "When you feel cross, try taking three big breaths like blowing out candles.",
    "Count to five before you do anything when you feel upset.",
  ],
  UnderstandOthers: [
    "Look at your friends' faces — are they happy or sad?",
    "If someone looks sad, try asking them if they're OK.",
  ],
  WorkWithOthers: [
    "Practise sharing your toys and taking turns in games.",
    "Try listening to your friend's idea before you share yours.",
  ],
  ChooseWell: [
    "Before you do something, ask yourself: is this kind?",
    "If you're not sure what to do, ask a grown-up for help.",
  ],
};
