// Platform-seeded survey question bank — ~100 vetted questions across 11
// categories. Loaded by prisma/seed.ts on every seed run via upsert keyed by
// prompt + category, so re-running won't duplicate rows.
//
// Sources cited where prompts are adapted from validated instruments:
// - PERMA: Seligman 2011 (Positive emotion, Engagement, Relationships, Meaning, Accomplishment)
// - EPOCH: Kern et al. 2016 (adolescent wellbeing)
// - SCWBS: Stirling Children's Wellbeing Scale
// - WEMWBS: Warwick-Edinburgh Mental Wellbeing Scale (children's version)
// - KIDSCREEN-27
// - MeQ: bespoke / adapted

export interface BankSeedQuestion {
  prompt: string;
  description?: string;
  questionType:
    | "likert_5" | "multiple_choice" | "yes_no" | "rating_10" | "free_text"
    | "emoji_5" | "emoji_3" | "slider_10";
  defaultOptions?: string[];
  category: string;
  subcategory?: string;
  domainKey?: string;
  ageTags?: string[];
  source?: string;
}

export const BANK_SEED_QUESTIONS: BankSeedQuestion[] = [
  // === Emotional Wellbeing (11) ===
  { category: "Emotional Wellbeing", subcategory: "Mood", prompt: "How are you feeling today?", questionType: "emoji_5", domainKey: "KnowMe", source: "MeQ" },
  { category: "Emotional Wellbeing", subcategory: "Mood", prompt: "I have felt happy this week", questionType: "likert_5", domainKey: "KnowMe", source: "EPOCH" },
  { category: "Emotional Wellbeing", subcategory: "Mood", prompt: "I have felt calm this week", questionType: "likert_5", domainKey: "ManageMe" },
  { category: "Emotional Wellbeing", subcategory: "Anxiety", prompt: "I have felt worried or anxious this week", questionType: "likert_5", domainKey: "ManageMe", source: "MeQ" },
  { category: "Emotional Wellbeing", subcategory: "Anxiety", prompt: "When I feel worried, I know what to do to feel better", questionType: "likert_5", domainKey: "ManageMe" },
  { category: "Emotional Wellbeing", subcategory: "Regulation", prompt: "I can calm myself down when I get upset", questionType: "likert_5", domainKey: "ManageMe", source: "SCWBS" },
  { category: "Emotional Wellbeing", subcategory: "Regulation", prompt: "When I get angry, I know how to manage it", questionType: "likert_5", domainKey: "ManageMe" },
  { category: "Emotional Wellbeing", subcategory: "Awareness", prompt: "I know what I am feeling and why", questionType: "likert_5", domainKey: "KnowMe", source: "MeQ" },
  { category: "Emotional Wellbeing", subcategory: "Mood", prompt: "Are you feeling okay today?", questionType: "emoji_3", ageTags: ["junior"], source: "MeQ" },
  { category: "Emotional Wellbeing", subcategory: "Awareness", prompt: "Can you name how you feel right now?", questionType: "yes_no", ageTags: ["junior"] },
  { category: "Emotional Wellbeing", subcategory: "Open", prompt: "Is there anything making you feel worried at the moment?", questionType: "free_text" },

  // === Self-Confidence & Identity (9) ===
  { category: "Self-Confidence", subcategory: "Self-worth", prompt: "I feel good about myself", questionType: "likert_5", domainKey: "KnowMe", source: "WEMWBS" },
  { category: "Self-Confidence", subcategory: "Self-worth", prompt: "I am proud of who I am", questionType: "likert_5", domainKey: "KnowMe", source: "EPOCH" },
  { category: "Self-Confidence", subcategory: "Self-worth", prompt: "I feel confident in myself", questionType: "emoji_5", domainKey: "KnowMe" },
  { category: "Self-Confidence", subcategory: "Strengths", prompt: "I know what I am good at", questionType: "likert_5", domainKey: "KnowMe", source: "MeQ" },
  { category: "Self-Confidence", subcategory: "Strengths", prompt: "I have things I am proud of", questionType: "likert_5", domainKey: "KnowMe" },
  { category: "Self-Confidence", subcategory: "Identity", prompt: "I like being me", questionType: "likert_5", ageTags: ["junior", "standard"], source: "SCWBS" },
  { category: "Self-Confidence", subcategory: "Self-talk", prompt: "I am kind to myself when I make a mistake", questionType: "likert_5", domainKey: "ManageMe" },
  { category: "Self-Confidence", subcategory: "Self-worth", prompt: "Do you like being you?", questionType: "yes_no", ageTags: ["junior"] },
  { category: "Self-Confidence", subcategory: "Open", prompt: "What is something you are proud of about yourself?", questionType: "free_text" },

  // === Social Connection (10) ===
  { category: "Social Connection", subcategory: "Friendships", prompt: "I have friends I can talk to", questionType: "likert_5", domainKey: "WorkWithOthers", source: "EPOCH" },
  { category: "Social Connection", subcategory: "Friendships", prompt: "I feel like I belong with my friends", questionType: "likert_5", domainKey: "WorkWithOthers", source: "EPOCH" },
  { category: "Social Connection", subcategory: "Friendships", prompt: "I get along well with the other students in my class", questionType: "likert_5", domainKey: "WorkWithOthers" },
  { category: "Social Connection", subcategory: "Loneliness", prompt: "I have felt lonely this week", questionType: "likert_5", domainKey: "WorkWithOthers", source: "KIDSCREEN-27" },
  { category: "Social Connection", subcategory: "Conflict", prompt: "I know how to sort things out when I disagree with a friend", questionType: "likert_5", domainKey: "UnderstandOthers", source: "MeQ" },
  { category: "Social Connection", subcategory: "Empathy", prompt: "I notice when other people are feeling sad or upset", questionType: "likert_5", domainKey: "UnderstandOthers" },
  { category: "Social Connection", subcategory: "Helping", prompt: "I help other people when they need it", questionType: "likert_5", domainKey: "UnderstandOthers" },
  { category: "Social Connection", subcategory: "Friendships", prompt: "Do you have a friend you can play with at break time?", questionType: "yes_no", ageTags: ["junior"] },
  { category: "Social Connection", subcategory: "Friendships", prompt: "How easy is it to make friends at school?", questionType: "slider_10", domainKey: "WorkWithOthers" },
  { category: "Social Connection", subcategory: "Open", prompt: "Is there anything you'd like to share about your friendships?", questionType: "free_text" },

  // === Family & Home (8) ===
  { category: "Family & Home", subcategory: "Support", prompt: "I can ask my family for help when I need it", questionType: "likert_5", source: "KIDSCREEN-27" },
  { category: "Family & Home", subcategory: "Support", prompt: "Someone at home listens to me when I need to talk", questionType: "likert_5", source: "KIDSCREEN-27" },
  { category: "Family & Home", subcategory: "Belonging", prompt: "I feel loved at home", questionType: "likert_5" },
  { category: "Family & Home", subcategory: "Communication", prompt: "I talk to someone at home about my day", questionType: "likert_5" },
  { category: "Family & Home", subcategory: "Safety", prompt: "I feel safe at home", questionType: "likert_5" },
  { category: "Family & Home", subcategory: "Time together", prompt: "We do fun things together as a family", questionType: "likert_5" },
  { category: "Family & Home", subcategory: "Support", prompt: "Is there an adult at home you can talk to?", questionType: "yes_no", ageTags: ["junior"] },
  { category: "Family & Home", subcategory: "Open", prompt: "Is there anything happening at home you'd like an adult at school to know?", questionType: "free_text" },

  // === School Belonging (10) ===
  { category: "School Belonging", subcategory: "Belonging", prompt: "I feel I belong at this school", questionType: "likert_5", source: "EPOCH" },
  { category: "School Belonging", subcategory: "Belonging", prompt: "I feel proud to be part of this school", questionType: "likert_5" },
  { category: "School Belonging", subcategory: "Care", prompt: "Teachers at this school care about me", questionType: "likert_5", source: "MeQ" },
  { category: "School Belonging", subcategory: "Care", prompt: "There is at least one adult at school I could talk to if I had a problem", questionType: "likert_5" },
  { category: "School Belonging", subcategory: "Voice", prompt: "I feel my voice is heard at school", questionType: "likert_5" },
  { category: "School Belonging", subcategory: "Voice", prompt: "Adults at school listen to my ideas", questionType: "likert_5" },
  { category: "School Belonging", subcategory: "Respect", prompt: "Students at this school treat each other with respect", questionType: "likert_5" },
  { category: "School Belonging", subcategory: "Inclusion", prompt: "I feel included at school, no matter who I am", questionType: "likert_5" },
  { category: "School Belonging", subcategory: "Care", prompt: "Is there an adult at school you trust?", questionType: "yes_no", ageTags: ["junior"] },
  { category: "School Belonging", subcategory: "Open", prompt: "What one thing would make our school a better place for you?", questionType: "free_text" },

  // === Learning & Effort (11) ===
  { category: "Learning & Effort", subcategory: "Effort", prompt: "I try my best in class", questionType: "likert_5", domainKey: "ChooseWell", source: "EPOCH" },
  { category: "Learning & Effort", subcategory: "Engagement", prompt: "I enjoy participating in class discussions", questionType: "likert_5", domainKey: "WorkWithOthers" },
  { category: "Learning & Effort", subcategory: "Engagement", prompt: "I find my lessons interesting", questionType: "likert_5", source: "EPOCH" },
  { category: "Learning & Effort", subcategory: "Mistakes", prompt: "When I make a mistake, it helps me learn rather than making me feel bad", questionType: "likert_5", domainKey: "ManageMe", source: "MeQ" },
  { category: "Learning & Effort", subcategory: "Mistakes", prompt: "I am comfortable asking questions in class even if I might be wrong", questionType: "likert_5", domainKey: "ChooseWell" },
  { category: "Learning & Effort", subcategory: "Challenge", prompt: "I keep trying when something is hard", questionType: "likert_5", domainKey: "ChooseWell", source: "EPOCH" },
  { category: "Learning & Effort", subcategory: "Help", prompt: "I can ask a teacher for help when I need it", questionType: "likert_5" },
  { category: "Learning & Effort", subcategory: "Confidence", prompt: "I am doing well with my schoolwork", questionType: "likert_5", source: "KIDSCREEN-27" },
  { category: "Learning & Effort", subcategory: "Engagement", prompt: "Do you enjoy coming to school?", questionType: "emoji_5", ageTags: ["junior", "standard"] },
  { category: "Learning & Effort", subcategory: "Online", prompt: "I am coping with online or homework learning", questionType: "likert_5" },
  { category: "Learning & Effort", subcategory: "Open", prompt: "What helps you learn best?", questionType: "free_text" },

  // === Sleep & Energy (7) ===
  { category: "Sleep & Energy", subcategory: "Sleep amount", prompt: "On average, how long do you sleep each night?", questionType: "multiple_choice", defaultOptions: ["Less than 6 hours", "6-7 hours", "8-9 hours", "10-11 hours", "More than 11 hours"] },
  { category: "Sleep & Energy", subcategory: "Sleep quality", prompt: "How would you describe the quality of your sleep this week?", questionType: "emoji_5" },
  { category: "Sleep & Energy", subcategory: "Sleep quality", prompt: "I get enough sleep most nights", questionType: "likert_5" },
  { category: "Sleep & Energy", subcategory: "Energy", prompt: "I have enough energy during the day", questionType: "likert_5", source: "KIDSCREEN-27" },
  { category: "Sleep & Energy", subcategory: "Energy", prompt: "I felt tired in class this week", questionType: "likert_5" },
  { category: "Sleep & Energy", subcategory: "Routine", prompt: "I have a regular bedtime routine", questionType: "yes_no" },
  { category: "Sleep & Energy", subcategory: "Open", prompt: "Is there anything getting in the way of your sleep?", questionType: "free_text" },

  // === Physical Activity & Health (7) ===
  { category: "Physical Activity & Health", subcategory: "Activity", prompt: "I have been active or exercised this week", questionType: "likert_5", source: "KIDSCREEN-27" },
  { category: "Physical Activity & Health", subcategory: "Activity", prompt: "How often do you do physical activity outside school?", questionType: "multiple_choice", defaultOptions: ["Almost every day", "A few times a week", "Once a week", "Less than once a week", "Never"] },
  { category: "Physical Activity & Health", subcategory: "Eating", prompt: "I eat breakfast in the morning", questionType: "multiple_choice", defaultOptions: ["Every day", "Most days", "Sometimes", "Rarely", "Never"] },
  { category: "Physical Activity & Health", subcategory: "Eating", prompt: "I eat fruit and vegetables most days", questionType: "yes_no" },
  { category: "Physical Activity & Health", subcategory: "Body", prompt: "I feel good about my body", questionType: "likert_5" },
  { category: "Physical Activity & Health", subcategory: "Health", prompt: "I have felt healthy this week", questionType: "likert_5" },
  { category: "Physical Activity & Health", subcategory: "Open", prompt: "What helps you feel healthy?", questionType: "free_text" },

  // === Digital Wellbeing (9) ===
  { category: "Digital Wellbeing", subcategory: "Screen time", prompt: "How many hours do you spend on screens outside school each day?", questionType: "multiple_choice", defaultOptions: ["Less than 1 hour", "1-2 hours", "3-4 hours", "5-6 hours", "More than 6 hours"] },
  { category: "Digital Wellbeing", subcategory: "Online safety", prompt: "I know how to stay safe online", questionType: "likert_5", source: "MeQ" },
  { category: "Digital Wellbeing", subcategory: "Online safety", prompt: "I know what to do if something online upsets me", questionType: "likert_5" },
  { category: "Digital Wellbeing", subcategory: "Online safety", prompt: "I have an adult I can talk to about things online", questionType: "yes_no" },
  { category: "Digital Wellbeing", subcategory: "Worries", prompt: "I have seen something online that worried me in the last month", questionType: "yes_no" },
  { category: "Digital Wellbeing", subcategory: "Comparison", prompt: "Looking at other people online sometimes makes me feel bad about myself", questionType: "likert_5" },
  { category: "Digital Wellbeing", subcategory: "Sleep", prompt: "I use screens close to bedtime", questionType: "likert_5" },
  { category: "Digital Wellbeing", subcategory: "Balance", prompt: "I do things I enjoy that are not on a screen", questionType: "likert_5" },
  { category: "Digital Wellbeing", subcategory: "Open", prompt: "Is there anything online you'd like to talk about?", questionType: "free_text" },

  // === Safety (9) ===
  { category: "Safety", subcategory: "School safety", prompt: "I feel safe at school", questionType: "likert_5", source: "KIDSCREEN-27" },
  { category: "Safety", subcategory: "School safety", prompt: "I feel safe in the playground", questionType: "likert_5" },
  { category: "Safety", subcategory: "Bullying", prompt: "I know who to tell if I am being bullied", questionType: "yes_no" },
  { category: "Safety", subcategory: "Bullying", prompt: "Have you been bullied at this school in the last month?", questionType: "yes_no" },
  { category: "Safety", subcategory: "Bullying", prompt: "Have you seen someone else being bullied in the last month?", questionType: "yes_no" },
  { category: "Safety", subcategory: "Bullying", prompt: "If you have been bullied, where did it happen?", questionType: "multiple_choice", defaultOptions: ["In the classroom", "On the playground", "In corridors", "Online", "On the way to or from school", "I haven't been bullied"] },
  { category: "Safety", subcategory: "Travel", prompt: "I feel safe travelling to and from school", questionType: "likert_5" },
  { category: "Safety", subcategory: "Trust", prompt: "Is there an adult who would help you if something was wrong?", questionType: "yes_no", ageTags: ["junior"] },
  { category: "Safety", subcategory: "Open", prompt: "Is there anything you want to tell us in confidence?", questionType: "free_text" },

  // === Future & Aspirations (8) ===
  { category: "Future & Aspirations", subcategory: "Hope", prompt: "I am hopeful about my future", questionType: "likert_5", source: "EPOCH" },
  { category: "Future & Aspirations", subcategory: "Hope", prompt: "I think things will work out for me", questionType: "likert_5", source: "EPOCH" },
  { category: "Future & Aspirations", subcategory: "Goals", prompt: "I have things I want to achieve this year", questionType: "likert_5" },
  { category: "Future & Aspirations", subcategory: "Goals", prompt: "I know what I want to get better at", questionType: "likert_5", domainKey: "KnowMe" },
  { category: "Future & Aspirations", subcategory: "Optimism", prompt: "I expect tomorrow to be a good day", questionType: "likert_5" },
  { category: "Future & Aspirations", subcategory: "Transition", prompt: "I feel ready for what's coming next at school", questionType: "likert_5" },
  { category: "Future & Aspirations", subcategory: "Open", prompt: "What are you looking forward to?", questionType: "free_text" },
  { category: "Future & Aspirations", subcategory: "Open", prompt: "What is something you hope to be able to do one day?", questionType: "free_text" },
];
