// Survey templates — pre-built question sets schools can clone and customise.

export interface SurveyTemplate {
  key: string;
  title: string;
  description: string;
  category: string;
  anonymous: boolean;
  questions: Array<{
    prompt: string;
    questionType: "likert_5" | "multiple_choice" | "yes_no" | "rating_10" | "free_text";
    options?: string[];
    required?: boolean;
  }>;
}

export const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    key: "wellbeing-checkin",
    title: "Wellbeing Check-In",
    description: "A quick snapshot of how students are feeling right now.",
    category: "Wellbeing",
    anonymous: false,
    questions: [
      { prompt: "How are you feeling today?", questionType: "likert_5" },
      { prompt: "I feel safe at school", questionType: "likert_5" },
      { prompt: "I have friends I can talk to", questionType: "likert_5" },
      { prompt: "I am getting enough sleep", questionType: "likert_5" },
      { prompt: "Is there anything else you'd like to share?", questionType: "free_text", required: false },
    ],
  },
  {
    key: "distance-learning",
    title: "Distance Learning Feedback",
    description: "For use during remote or hybrid learning periods.",
    category: "Learning",
    anonymous: false,
    questions: [
      { prompt: "I can access my learning from home easily", questionType: "likert_5" },
      { prompt: "I understand what I'm being asked to do", questionType: "likert_5" },
      { prompt: "I feel connected to my teacher and classmates", questionType: "likert_5" },
      { prompt: "I have somewhere quiet to work at home", questionType: "yes_no" },
      { prompt: "Which subjects are you finding hardest at home?", questionType: "free_text", required: false },
      { prompt: "What would help you learn better from home?", questionType: "free_text", required: false },
    ],
  },
  {
    key: "transition",
    title: "Year 6 Transition Survey",
    description: "Preparing Year 6 students for secondary school.",
    category: "Transition",
    anonymous: false,
    questions: [
      { prompt: "How excited are you about moving to secondary school?", questionType: "rating_10" },
      { prompt: "How worried are you about moving to secondary school?", questionType: "rating_10" },
      { prompt: "I know what to expect at my new school", questionType: "likert_5" },
      { prompt: "What are you most looking forward to?", questionType: "free_text", required: false },
      { prompt: "What are you most worried about?", questionType: "free_text", required: false },
    ],
  },
  {
    key: "bullying-check",
    title: "Anti-Bullying Survey",
    description: "Confidential survey about bullying experiences and perceptions.",
    category: "Safeguarding",
    anonymous: true,
    questions: [
      { prompt: "I feel safe at school", questionType: "likert_5" },
      { prompt: "I know who to tell if I am being bullied", questionType: "yes_no" },
      { prompt: "Have you been bullied at this school in the last month?", questionType: "yes_no" },
      { prompt: "Have you seen someone else being bullied in the last month?", questionType: "yes_no" },
      {
        prompt: "If you have been bullied, where did it happen?",
        questionType: "multiple_choice",
        options: ["In the classroom", "On the playground", "In corridors", "Online", "On the way to or from school", "I haven't been bullied"],
        required: false,
      },
      { prompt: "Is there anything you want to tell us in confidence?", questionType: "free_text", required: false },
    ],
  },
  {
    key: "online-safety",
    title: "Online Safety & Digital Wellbeing",
    description: "Screen time, online experiences, and digital literacy.",
    category: "Digital",
    anonymous: false,
    questions: [
      { prompt: "How many hours do you typically spend on screens outside school?", questionType: "multiple_choice", options: ["Less than 1 hour", "1-2 hours", "3-4 hours", "5-6 hours", "More than 6 hours"] },
      { prompt: "I know how to stay safe online", questionType: "likert_5" },
      { prompt: "I know what to do if something online upsets me", questionType: "likert_5" },
      { prompt: "I have seen something online that worried me in the last month", questionType: "yes_no" },
      { prompt: "I have an adult I can talk to about things online", questionType: "yes_no" },
    ],
  },
  {
    key: "school-climate",
    title: "School Climate & Belonging",
    description: "How students experience the school community.",
    category: "Climate",
    anonymous: true,
    questions: [
      { prompt: "I feel I belong at this school", questionType: "likert_5" },
      { prompt: "Teachers at this school care about me", questionType: "likert_5" },
      { prompt: "I feel proud to be part of this school", questionType: "likert_5" },
      { prompt: "Students at this school treat each other with respect", questionType: "likert_5" },
      { prompt: "I feel my voice is heard at school", questionType: "likert_5" },
      { prompt: "What one thing would make our school better?", questionType: "free_text", required: false },
    ],
  },
  {
    key: "reading-for-pleasure",
    title: "Reading for Pleasure",
    description: "Student attitudes and habits around reading.",
    category: "Learning",
    anonymous: false,
    questions: [
      { prompt: "How often do you read for fun outside school?", questionType: "multiple_choice", options: ["Every day", "A few times a week", "About once a week", "Rarely", "Never"] },
      { prompt: "I enjoy reading", questionType: "likert_5" },
      { prompt: "I can easily find books I want to read", questionType: "likert_5" },
      { prompt: "What is your favourite type of book?", questionType: "free_text", required: false },
      { prompt: "What would help you read more?", questionType: "free_text", required: false },
    ],
  },
  {
    key: "end-of-year",
    title: "End-of-Year Reflection",
    description: "Reflect on the year and look forward to the next.",
    category: "Reflection",
    anonymous: false,
    questions: [
      { prompt: "What has been your favourite thing about this year?", questionType: "free_text", required: false },
      { prompt: "What are you most proud of from this year?", questionType: "free_text", required: false },
      { prompt: "I have grown as a learner this year", questionType: "likert_5" },
      { prompt: "I have made new friends this year", questionType: "likert_5" },
      { prompt: "What are you looking forward to next year?", questionType: "free_text", required: false },
    ],
  },
  {
    key: "post-holiday",
    title: "Back to School — Post-Holiday Check-In",
    description: "How students are settling back in after a break.",
    category: "Wellbeing",
    anonymous: false,
    questions: [
      { prompt: "How are you feeling about being back at school?", questionType: "rating_10" },
      { prompt: "I feel ready to learn this term", questionType: "likert_5" },
      { prompt: "I'm looking forward to seeing my friends", questionType: "likert_5" },
      { prompt: "I have any worries about this term?", questionType: "yes_no" },
      { prompt: "Is there anything you'd like your teacher to know?", questionType: "free_text", required: false },
    ],
  },
];

// Free text moderation — keywords that flag responses for review.
// NOT a replacement for human judgement. Flagged responses are shown
// prominently to admins for follow-up.
export const MODERATION_KEYWORDS = [
  // Self-harm
  "kill myself", "kill my self", "suicide", "suicidal", "end my life", "want to die",
  "hurt myself", "cut myself", "cutting myself", "self harm", "self-harm", "harm myself",
  // Abuse
  "abuse", "abused", "abusing", "hit me", "hits me", "hurts me", "touching me",
  "inappropriate touching", "hurt at home",
  // Bullying (severe)
  "bullied every day", "hate myself", "no one likes me", "nobody likes me",
  // Other concerns
  "run away", "running away", "starving", "not eating",
];

export function moderateText(
  text: string,
  extraKeywords: string[] = []
): { flagged: boolean; reason?: string } {
  if (!text) return { flagged: false };
  const lower = text.toLowerCase();
  const matched: string[] = [];
  const all = [...MODERATION_KEYWORDS, ...extraKeywords.map((k) => k.toLowerCase().trim()).filter(Boolean)];
  for (const keyword of all) {
    if (lower.includes(keyword)) {
      matched.push(keyword);
    }
  }
  if (matched.length > 0) {
    return { flagged: true, reason: matched.join(", ") };
  }
  return { flagged: false };
}

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  likert_5: "Agreement (5-point)",
  multiple_choice: "Multiple choice",
  yes_no: "Yes / No",
  rating_10: "Rating (1-10)",
  free_text: "Free text",
};
