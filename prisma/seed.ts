import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

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

const DEFAULT_SCORE_MAP = JSON.stringify({ "1": 1, "2": 2, "3": 3, "4": 4 });
const REVERSE_SCORE_MAP = JSON.stringify({ "1": 4, "2": 3, "3": 2, "4": 1 });

interface QuestionData {
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

const questions: QuestionData[] = [
  // === KNOW ME (5 core + 2 validation + 1 trap) ===
  { orderIndex: 1, prompt: "I know what makes me feel happy.", domain: "KnowMe", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 2, prompt: "I can tell when I am feeling sad or upset.", domain: "KnowMe", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 3, prompt: "I understand why I feel the way I do.", domain: "KnowMe", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 4, prompt: "When something bothers me, I can explain how I feel.", domain: "KnowMe", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 5, prompt: "Imagine you got a lower mark than expected on a test. How would you feel and what would you do?", domain: "KnowMe", type: "core", questionFormat: "scenario", answerOptions: JSON.stringify([
    { label: "I wouldn't care at all", value: 1 },
    { label: "I'd feel upset but not know why", value: 2 },
    { label: "I'd feel disappointed and think about what happened", value: 4 },
    { label: "I'd feel sad and talk to someone about it", value: 3 },
  ]), scoreMap: DEFAULT_SCORE_MAP, weight: 2.0, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 6, prompt: "I know what things I am good at.", domain: "KnowMe", type: "validation", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 1 },
  { orderIndex: 7, prompt: "I can name my feelings when I have them.", domain: "KnowMe", type: "validation", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 2 },
  { orderIndex: 8, prompt: "I never feel any emotions at all.", domain: "KnowMe", type: "trap", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: REVERSE_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: true, validationPair: null },

  // === MANAGE ME (5 core + 2 validation + 1 trap) ===
  { orderIndex: 9, prompt: "When I feel angry, I can calm myself down.", domain: "ManageMe", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 10, prompt: "I think before I act when I'm upset.", domain: "ManageMe", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 11, prompt: "I can wait for something I want without getting too frustrated.", domain: "ManageMe", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 12, prompt: "I keep trying even when things are difficult.", domain: "ManageMe", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 13, prompt: "Imagine someone accidentally knocks your lunch off the table. What would you do?", domain: "ManageMe", type: "core", questionFormat: "scenario", answerOptions: SCENARIO_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 2.0, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 14, prompt: "I can control my temper when things go wrong.", domain: "ManageMe", type: "validation", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 9 },
  { orderIndex: 15, prompt: "I stick with tasks even when they are boring.", domain: "ManageMe", type: "validation", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 12 },
  { orderIndex: 16, prompt: "I always do everything perfectly and never make mistakes.", domain: "ManageMe", type: "trap", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: REVERSE_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: true, validationPair: null },

  // === UNDERSTAND OTHERS (5 core + 2 validation + 1 trap) ===
  { orderIndex: 17, prompt: "I can tell how other people are feeling by looking at them.", domain: "UnderstandOthers", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 18, prompt: "I think about how other people feel before I say something.", domain: "UnderstandOthers", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 19, prompt: "I feel sorry for people when bad things happen to them.", domain: "UnderstandOthers", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 20, prompt: "I try to understand why someone might be upset.", domain: "UnderstandOthers", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 21, prompt: "Imagine a new student joins your class and looks nervous. What would you do?", domain: "UnderstandOthers", type: "core", questionFormat: "scenario", answerOptions: JSON.stringify([
    { label: "Ignore them, they'll be fine", value: 1 },
    { label: "Wait for the teacher to help them", value: 2 },
    { label: "Smile at them and say hello", value: 3 },
    { label: "Invite them to sit with you and show them around", value: 4 },
  ]), scoreMap: DEFAULT_SCORE_MAP, weight: 2.0, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 22, prompt: "I notice when a friend is having a bad day.", domain: "UnderstandOthers", type: "validation", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 17 },
  { orderIndex: 23, prompt: "I listen carefully when someone tells me about their problems.", domain: "UnderstandOthers", type: "validation", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 20 },
  { orderIndex: 24, prompt: "I never care about how other people feel.", domain: "UnderstandOthers", type: "trap", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: REVERSE_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: true, validationPair: null },

  // === WORK WITH OTHERS (5 core + 2 validation + 1 trap) ===
  { orderIndex: 25, prompt: "I work well with others in a group.", domain: "WorkWithOthers", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 26, prompt: "I listen to other people's ideas even if they are different from mine.", domain: "WorkWithOthers", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 27, prompt: "I can solve disagreements with my friends without fighting.", domain: "WorkWithOthers", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 28, prompt: "I help my classmates when they need it.", domain: "WorkWithOthers", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 29, prompt: "Imagine your group can't agree on how to do a project. What would you do?", domain: "WorkWithOthers", type: "core", questionFormat: "scenario", answerOptions: JSON.stringify([
    { label: "Just do it my way", value: 1 },
    { label: "Let someone else decide", value: 2 },
    { label: "Suggest we vote or take turns with ideas", value: 4 },
    { label: "Ask the teacher to decide for us", value: 2 },
  ]), scoreMap: DEFAULT_SCORE_MAP, weight: 2.0, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 30, prompt: "I share things with others.", domain: "WorkWithOthers", type: "validation", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 28 },
  { orderIndex: 31, prompt: "I take turns when playing or working with others.", domain: "WorkWithOthers", type: "validation", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 25 },
  { orderIndex: 32, prompt: "I am always right and everyone else is always wrong.", domain: "WorkWithOthers", type: "trap", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: REVERSE_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: true, validationPair: null },

  // === CHOOSE WELL (5 core + 2 validation + 1 trap) ===
  { orderIndex: 33, prompt: "I think about what might happen before I make a choice.", domain: "ChooseWell", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 34, prompt: "I can tell the difference between a good choice and a bad choice.", domain: "ChooseWell", type: "core", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 35, prompt: "I ask for help when I need to make a difficult decision.", domain: "ChooseWell", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 36, prompt: "I think about how my choices affect other people.", domain: "ChooseWell", type: "core", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.5, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 37, prompt: "Imagine a friend wants you to copy their homework. What would you do?", domain: "ChooseWell", type: "core", questionFormat: "scenario", answerOptions: JSON.stringify([
    { label: "Copy it quickly before anyone sees", value: 1 },
    { label: "Say no but not explain why", value: 2 },
    { label: "Say no and explain it's not fair", value: 4 },
    { label: "Tell the teacher on them", value: 2 },
  ]), scoreMap: DEFAULT_SCORE_MAP, weight: 2.0, isValidation: false, isTrap: false, validationPair: null },
  { orderIndex: 38, prompt: "I take responsibility when I make a mistake.", domain: "ChooseWell", type: "validation", questionFormat: "behaviour", answerOptions: FREQUENCY_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 34 },
  { orderIndex: 39, prompt: "I think about the right thing to do, not just the easy thing.", domain: "ChooseWell", type: "validation", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: DEFAULT_SCORE_MAP, weight: 1.0, isValidation: true, isTrap: false, validationPair: 33 },
  { orderIndex: 40, prompt: "I have never ever done anything wrong in my whole life.", domain: "ChooseWell", type: "trap", questionFormat: "self-report", answerOptions: LIKERT_OPTIONS, scoreMap: REVERSE_SCORE_MAP, weight: 1.0, isValidation: false, isTrap: true, validationPair: null },
];

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

  // Create questions
  for (const q of questions) {
    await prisma.question.upsert({
      where: { orderIndex: q.orderIndex },
      update: q,
      create: q,
    });
  }
  console.log(`Seeded ${questions.length} questions`);

  // Create test student
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
    },
  });
  console.log("Test student created (code: TESTAB23)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
