import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

// === STANDARD TIER ANSWER OPTIONS ===

const LIKERT_OPTIONS = JSON.stringify([
  { label: "Not like me at all", value: 1 },
  { label: "A little like me", value: 2 },
  { label: "Quite like me", value: 3 },
  { label: "Very much like me", value: 4 },
]);

const FREQUENCY_OPTIONS = JSON.stringify([
  { label: "Almost never", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Often", value: 3 },
  { label: "Almost always", value: 4 },
]);

const SCENARIO_OPTIONS = JSON.stringify([
  { label: "Walk away and feel upset", value: 1 },
  { label: "Get angry and shout", value: 1 },
  { label: "Take a deep breath and talk about it", value: 4 },
  { label: "Ask a friend or teacher for help", value: 3 },
]);

// === JUNIOR TIER ANSWER OPTIONS (emoji-based) ===

const JUNIOR_EMOJI_OPTIONS = JSON.stringify([
  { label: "No, never", value: 1, emoji: "😢" },
  { label: "Sometimes", value: 2, emoji: "😐" },
  { label: "A lot", value: 3, emoji: "🙂" },
  { label: "Yes, always!", value: 4, emoji: "😊" },
]);

const DEFAULT_SCORE_MAP = JSON.stringify({ "1": 1, "2": 2, "3": 3, "4": 4 });
const REVERSE_SCORE_MAP = JSON.stringify({ "1": 4, "2": 3, "3": 2, "4": 1 });

interface QuestionData {
  tier: string;
  orderIndex: number;
  prompt: string;
  domain: string;
  type: "core" | "validation" | "trap";
  questionFormat: "self-report" | "behaviour" | "scenario";
  answerOptions: string;
  scoreMap: string;
  weight: number;
  isValidation: boolean;
  isTrap: boolean;
  validationPair: number | null;
}

// =============================================
// STANDARD TIER — 40 questions (ages 8-11)
// =============================================

const standardQuestions: QuestionData[] = [
  // === KNOW ME (5 core + 2 validation + 1 trap) ===
  { tier: "standard", orderIndex: 1, prompt: "I know what makes me feel happy.", domain: "KnowMe", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 2, prompt: "I can tell when I am feeling sad or upset.", domain: "KnowMe", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 3, prompt: "I understand why I feel the way I do.", domain: "KnowMe", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 4, prompt: "When something bothers me, I can explain how I feel.", domain: "KnowMe", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 5, prompt: "Imagine you got a lower mark than expected on a test. How would you feel and what would you do?", domain: "KnowMe", type: "core", questionFormat: "scenario", answerOptions: JSON.stringify([
    { label: "I wouldn't care at all", value: 1 },
    { label: "I'd feel upset but not know why", value: 2 },
    { label: "I'd feel disappointed and think about what happened", value: 4 },
    { label: "I'd feel sad and talk to someone about it", value: 3 },
  ]), scoreMap: DEFAULT_SCORE_MAP, weight: 2.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 6, prompt: "I know what things I am good at.", domain: "KnowMe", type: "validation", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 1 },
  { tier: "standard", orderIndex: 7, prompt: "I can name my feelings when I have them.", domain: "KnowMe", type: "validation", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 2 },
  { tier: "standard", orderIndex: 8, prompt: "I never feel any emotions at all.", domain: "KnowMe", type: "trap", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: REVERSE_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: true, validationPair: null },

  // === MANAGE ME (5 core + 2 validation + 1 trap) ===
  { tier: "standard", orderIndex: 9, prompt: "When I feel angry, I can calm myself down.", domain: "ManageMe", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 10, prompt: "I think before I act when I'm upset.", domain: "ManageMe", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 11, prompt: "I can wait for something I want without getting too frustrated.", domain: "ManageMe", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 12, prompt: "I keep trying even when things are difficult.", domain: "ManageMe", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 13, prompt: "Imagine someone accidentally knocks your lunch off the table. What would you do?", domain: "ManageMe", type: "core", questionFormat: "scenario", answerOptions: SCENARIO_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 2.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 14, prompt: "I can control my temper when things go wrong.", domain: "ManageMe", type: "validation", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 9 },
  { tier: "standard", orderIndex: 15, prompt: "I stick with tasks even when they are boring.", domain: "ManageMe", type: "validation", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 12 },
  { tier: "standard", orderIndex: 16, prompt: "I always do everything perfectly and never make mistakes.", domain: "ManageMe", type: "trap", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: REVERSE_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: true, validationPair: null },

  // === UNDERSTAND OTHERS (5 core + 2 validation + 1 trap) ===
  { tier: "standard", orderIndex: 17, prompt: "I can tell how other people are feeling by looking at them.", domain: "UnderstandOthers", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 18, prompt: "I think about how other people feel before I say something.", domain: "UnderstandOthers", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 19, prompt: "I feel sorry for people when bad things happen to them.", domain: "UnderstandOthers", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 20, prompt: "I try to understand why someone might be upset.", domain: "UnderstandOthers", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 21, prompt: "Imagine a new student joins your class and looks nervous. What would you do?", domain: "UnderstandOthers", type: "core", questionFormat: "scenario", answerOptions: JSON.stringify([
    { label: "Ignore them, they'll be fine", value: 1 },
    { label: "Wait for the teacher to help them", value: 2 },
    { label: "Smile at them and say hello", value: 3 },
    { label: "Invite them to sit with you and show them around", value: 4 },
  ]), scoreMap: DEFAULT_SCORE_MAP, weight: 2.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 22, prompt: "I notice when a friend is having a bad day.", domain: "UnderstandOthers", type: "validation", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 17 },
  { tier: "standard", orderIndex: 23, prompt: "I listen carefully when someone tells me about their problems.", domain: "UnderstandOthers", type: "validation", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 20 },
  { tier: "standard", orderIndex: 24, prompt: "I never care about how other people feel.", domain: "UnderstandOthers", type: "trap", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: REVERSE_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: true, validationPair: null },

  // === WORK WITH OTHERS (5 core + 2 validation + 1 trap) ===
  { tier: "standard", orderIndex: 25, prompt: "I work well with others in a group.", domain: "WorkWithOthers", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 26, prompt: "I listen to other people's ideas even if they are different from mine.", domain: "WorkWithOthers", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 27, prompt: "I can solve disagreements with my friends without fighting.", domain: "WorkWithOthers", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 28, prompt: "I help my classmates when they need it.", domain: "WorkWithOthers", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 29, prompt: "Imagine your group can't agree on how to do a project. What would you do?", domain: "WorkWithOthers", type: "core", questionFormat: "scenario", answerOptions: JSON.stringify([
    { label: "Just do it my way", value: 1 },
    { label: "Let someone else decide", value: 2 },
    { label: "Suggest we vote or take turns with ideas", value: 4 },
    { label: "Ask the teacher to decide for us", value: 2 },
  ]), scoreMap: DEFAULT_SCORE_MAP, weight: 2.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 30, prompt: "I share things with others.", domain: "WorkWithOthers", type: "validation", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 28 },
  { tier: "standard", orderIndex: 31, prompt: "I take turns when playing or working with others.", domain: "WorkWithOthers", type: "validation", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 25 },
  { tier: "standard", orderIndex: 32, prompt: "I am always right and everyone else is always wrong.", domain: "WorkWithOthers", type: "trap", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: REVERSE_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: true, validationPair: null },

  // === CHOOSE WELL (5 core + 2 validation + 1 trap) ===
  { tier: "standard", orderIndex: 33, prompt: "I think about what might happen before I make a choice.", domain: "ChooseWell", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 34, prompt: "I can tell the difference between a good choice and a bad choice.", domain: "ChooseWell", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 35, prompt: "I ask for help when I need to make a difficult decision.", domain: "ChooseWell", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 36, prompt: "I think about how my choices affect other people.", domain: "ChooseWell", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 37, prompt: "Imagine a friend wants you to copy their homework. What would you do?", domain: "ChooseWell", type: "core", questionFormat: "scenario", answerOptions: JSON.stringify([
    { label: "Copy it quickly before anyone sees", value: 1 },
    { label: "Say no but not explain why", value: 2 },
    { label: "Say no and explain it's not fair", value: 4 },
    { label: "Tell the teacher on them", value: 2 },
  ]), scoreMap: DEFAULT_SCORE_MAP, weight: 2.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "standard", orderIndex: 38, prompt: "I take responsibility when I make a mistake.", domain: "ChooseWell", type: "validation", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 34 },
  { tier: "standard", orderIndex: 39, prompt: "I think about the right thing to do, not just the easy thing.", domain: "ChooseWell", type: "validation", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 33 },
  { tier: "standard", orderIndex: 40, prompt: "I have never ever done anything wrong in my whole life.", domain: "ChooseWell", type: "trap", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: REVERSE_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: true, validationPair: null },
];

// =============================================
// JUNIOR TIER — 20 questions (ages 5-7)
// 4 per domain: 3 core + 1 scenario
// Simple language, emoji answer scale, all weight 1.0
// No validation or trap questions
// =============================================

const juniorQuestions: QuestionData[] = [
  // === KNOW ME ===
  { tier: "junior", orderIndex: 1, prompt: "I know when I feel happy.", domain: "KnowMe", type: "core", questionFormat: "self-report", answerOptions: JUNIOR_EMOJI_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "junior", orderIndex: 2, prompt: "I know when I feel sad.", domain: "KnowMe", type: "core", questionFormat: "self-report", answerOptions: JUNIOR_EMOJI_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "junior", orderIndex: 3, prompt: "I can tell a grown-up how I feel.", domain: "KnowMe", type: "core", questionFormat: "self-report", answerOptions: JUNIOR_EMOJI_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "junior", orderIndex: 4, prompt: "You can't find your favourite toy. How do you feel?", domain: "KnowMe", type: "core", questionFormat: "scenario", answerOptions: JSON.stringify([
    { label: "I don't know", value: 1, emoji: "😶" },
    { label: "A bit upset", value: 2, emoji: "😟" },
    { label: "Sad but I can ask for help", value: 3, emoji: "🙂" },
    { label: "I know I'm sad and I tell someone", value: 4, emoji: "😊" },
  ]), scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },

  // === MANAGE ME ===
  { tier: "junior", orderIndex: 5, prompt: "I can calm down when I feel angry.", domain: "ManageMe", type: "core", questionFormat: "self-report", answerOptions: JUNIOR_EMOJI_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "junior", orderIndex: 6, prompt: "I can wait for my turn.", domain: "ManageMe", type: "core", questionFormat: "self-report", answerOptions: JUNIOR_EMOJI_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "junior", orderIndex: 7, prompt: "I keep trying even when something is hard.", domain: "ManageMe", type: "core", questionFormat: "self-report", answerOptions: JUNIOR_EMOJI_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "junior", orderIndex: 8, prompt: "Someone takes your crayon. What do you do?", domain: "ManageMe", type: "core", questionFormat: "scenario", answerOptions: JSON.stringify([
    { label: "Grab it back", value: 1, emoji: "😠" },
    { label: "Cry", value: 2, emoji: "😢" },
    { label: "Take a deep breath first", value: 3, emoji: "😌" },
    { label: "Ask them nicely to give it back", value: 4, emoji: "😊" },
  ]), scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },

  // === UNDERSTAND OTHERS ===
  { tier: "junior", orderIndex: 9, prompt: "I can tell when my friend is sad.", domain: "UnderstandOthers", type: "core", questionFormat: "self-report", answerOptions: JUNIOR_EMOJI_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "junior", orderIndex: 10, prompt: "I try to be kind to others.", domain: "UnderstandOthers", type: "core", questionFormat: "self-report", answerOptions: JUNIOR_EMOJI_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "junior", orderIndex: 11, prompt: "I notice when someone is left out.", domain: "UnderstandOthers", type: "core", questionFormat: "self-report", answerOptions: JUNIOR_EMOJI_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "junior", orderIndex: 12, prompt: "A new child joins your class and looks scared. What do you do?", domain: "UnderstandOthers", type: "core", questionFormat: "scenario", answerOptions: JSON.stringify([
    { label: "I don't do anything", value: 1, emoji: "😶" },
    { label: "I watch and wait", value: 2, emoji: "👀" },
    { label: "I smile at them", value: 3, emoji: "😊" },
    { label: "I go and say hello", value: 4, emoji: "🤗" },
  ]), scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },

  // === WORK WITH OTHERS ===
  { tier: "junior", orderIndex: 13, prompt: "I share my things with friends.", domain: "WorkWithOthers", type: "core", questionFormat: "self-report", answerOptions: JUNIOR_EMOJI_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "junior", orderIndex: 14, prompt: "I take turns when I play.", domain: "WorkWithOthers", type: "core", questionFormat: "self-report", answerOptions: JUNIOR_EMOJI_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "junior", orderIndex: 15, prompt: "I listen when my friends talk.", domain: "WorkWithOthers", type: "core", questionFormat: "self-report", answerOptions: JUNIOR_EMOJI_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "junior", orderIndex: 16, prompt: "You and your friend both want the same toy. What do you do?", domain: "WorkWithOthers", type: "core", questionFormat: "scenario", answerOptions: JSON.stringify([
    { label: "Take it and keep it", value: 1, emoji: "😠" },
    { label: "Walk away", value: 2, emoji: "😞" },
    { label: "Take turns with it", value: 4, emoji: "😊" },
    { label: "Ask a grown-up to help", value: 3, emoji: "🙋" },
  ]), scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },

  // === CHOOSE WELL ===
  { tier: "junior", orderIndex: 17, prompt: "I think before I do something.", domain: "ChooseWell", type: "core", questionFormat: "self-report", answerOptions: JUNIOR_EMOJI_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "junior", orderIndex: 18, prompt: "I say sorry when I do something wrong.", domain: "ChooseWell", type: "core", questionFormat: "self-report", answerOptions: JUNIOR_EMOJI_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "junior", orderIndex: 19, prompt: "I follow the class rules.", domain: "ChooseWell", type: "core", questionFormat: "self-report", answerOptions: JUNIOR_EMOJI_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { tier: "junior", orderIndex: 20, prompt: "Your friend asks you to be mean to someone. What do you do?", domain: "ChooseWell", type: "core", questionFormat: "scenario", answerOptions: JSON.stringify([
    { label: "Do it so they like me", value: 1, emoji: "😬" },
    { label: "I don't know", value: 2, emoji: "😶" },
    { label: "Say no, that's not kind", value: 4, emoji: "😊" },
    { label: "Tell a grown-up", value: 3, emoji: "🙋" },
  ]), scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
];

const allQuestions = [...standardQuestions, ...juniorQuestions];

async function main() {
  // Create default admin
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: hashSync("meq-admin-2026", 10),
    },
  });
  console.log("Admin user created (admin / meq-admin-2026)");

  // Create questions (upsert by tier+orderIndex compound key)
  for (const q of allQuestions) {
    await prisma.question.upsert({
      where: {
        tier_orderIndex: { tier: q.tier, orderIndex: q.orderIndex },
      },
      update: q,
      create: q,
    });
  }
  console.log(`Seeded ${standardQuestions.length} standard questions`);
  console.log(`Seeded ${juniorQuestions.length} junior questions`);

  // Create test students
  await prisma.student.upsert({
    where: { loginCode: "TESTAB23" },
    update: {},
    create: {
      loginCode: "TESTAB23",
      firstName: "Test",
      lastName: "Student",
      displayName: "Test",
      yearGroup: "Year 5",
      className: "5A",
      tier: "standard",
    },
  });
  console.log("Test student created (code: TESTAB23, standard tier)");

  await prisma.student.upsert({
    where: { loginCode: "JNRAB234" },
    update: {},
    create: {
      loginCode: "JNRAB234",
      firstName: "Junior",
      lastName: "Tester",
      displayName: "Junior",
      yearGroup: "Year 1",
      className: "1B",
      tier: "junior",
    },
  });
  console.log("Test student created (code: JNRAB234, junior tier)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
