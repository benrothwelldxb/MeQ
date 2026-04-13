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

// === PULSE QUESTIONS ===

const pulseQuestions = [
  { domain: "KnowMe", prompt: "I understand how I'm feeling today", tier: "standard", emoji: null, orderIndex: 1 },
  { domain: "ManageMe", prompt: "I feel in control of my emotions", tier: "standard", emoji: null, orderIndex: 2 },
  { domain: "UnderstandOthers", prompt: "I've been understanding of others this week", tier: "standard", emoji: null, orderIndex: 3 },
  { domain: "WorkWithOthers", prompt: "I've worked well with other people", tier: "standard", emoji: null, orderIndex: 4 },
  { domain: "ChooseWell", prompt: "I've been making good choices", tier: "standard", emoji: null, orderIndex: 5 },
  { domain: "KnowMe", prompt: "Do you know how you feel today?", tier: "junior", emoji: "\ud83e\uddd0", orderIndex: 1 },
  { domain: "ManageMe", prompt: "Are you feeling calm today?", tier: "junior", emoji: "\ud83d\ude0c", orderIndex: 2 },
  { domain: "UnderstandOthers", prompt: "Have you been kind to others?", tier: "junior", emoji: "\ud83e\udd17", orderIndex: 3 },
  { domain: "WorkWithOthers", prompt: "Did you play nicely with friends?", tier: "junior", emoji: "\ud83d\ude4b", orderIndex: 4 },
  { domain: "ChooseWell", prompt: "Did you make good choices today?", tier: "junior", emoji: "\u2b50", orderIndex: 5 },
];

async function main() {
  // Create super admin (platform owner)
  await prisma.superAdmin.upsert({
    where: { email: "principal@vhprimarycoa.ae" },
    update: {},
    create: {
      email: "principal@vhprimarycoa.ae",
      passwordHash: hashSync("meq-super-2026", 10),
    },
  });
  console.log("Super admin created (principal@vhprimarycoa.ae)");

  // Create default MeQ Standard framework
  const framework = await prisma.framework.upsert({
    where: { slug: "meq-standard" },
    update: {},
    create: {
      name: "MeQ Standard",
      slug: "meq-standard",
      description: "The default MeQ emotional intelligence framework with 5 domains aligned to CASEL competencies.",
      isDefault: true,
      config: JSON.stringify({
        levels: ["Emerging", "Developing", "Secure", "Advanced"],
        tiers: {
          standard: {
            levelThresholds: [{ level: "Advanced", min: 18 }, { level: "Secure", min: 15 }, { level: "Developing", min: 10 }, { level: "Emerging", min: 0 }],
            overallThresholds: [{ level: "Advanced", min: 90 }, { level: "Secure", min: 75 }, { level: "Developing", min: 50 }, { level: "Emerging", min: 0 }],
            maxDomainScore: 26,
            maxTotalScore: 130,
          },
          junior: {
            levelThresholds: [{ level: "Advanced", min: 14 }, { level: "Secure", min: 11 }, { level: "Developing", min: 8 }, { level: "Emerging", min: 0 }],
            overallThresholds: [{ level: "Advanced", min: 70 }, { level: "Secure", min: 55 }, { level: "Developing", min: 40 }, { level: "Emerging", min: 0 }],
            maxDomainScore: 16,
            maxTotalScore: 80,
          },
        },
      }),
    },
  });

  const domainDefs = [
    { key: "KnowMe", label: "Know Me", color: "blue", sortOrder: 0 },
    { key: "ManageMe", label: "Manage Me", color: "emerald", sortOrder: 1 },
    { key: "UnderstandOthers", label: "Understand Others", color: "purple", sortOrder: 2 },
    { key: "WorkWithOthers", label: "Work With Others", color: "amber", sortOrder: 3 },
    { key: "ChooseWell", label: "Choose Well", color: "rose", sortOrder: 4 },
  ];

  for (const d of domainDefs) {
    await prisma.frameworkDomain.upsert({
      where: { frameworkId_key: { frameworkId: framework.id, key: d.key } },
      update: { label: d.label, color: d.color, sortOrder: d.sortOrder },
      create: { frameworkId: framework.id, ...d },
    });
  }
  console.log(`MeQ Standard framework seeded with ${domainDefs.length} domains`);

  // Create default school
  const school = await prisma.school.upsert({
    where: { slug: "demo-school" },
    update: {},
    create: {
      name: "Demo School",
      slug: "demo-school",
      currentTerm: "term1",
      academicYear: "2025-2026",
    },
  });
  console.log(`School created: ${school.name} (${school.slug})`);

  // Create school admin
  await prisma.admin.upsert({
    where: { email_schoolId: { email: "admin@demo-school.local", schoolId: school.id } },
    update: {},
    create: {
      email: "admin@demo-school.local",
      passwordHash: hashSync("meq-admin-2026", 10),
      schoolId: school.id,
    },
  });
  console.log("School admin created (admin@demo-school.local / meq-admin-2026)");

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

  // Also seed FrameworkQuestion records for MeQ Standard framework
  for (const q of allQuestions) {
    await prisma.frameworkQuestion.upsert({
      where: {
        frameworkId_tier_orderIndex: { frameworkId: framework.id, tier: q.tier, orderIndex: q.orderIndex },
      },
      update: {
        domainKey: q.domain,
        prompt: q.prompt,
        type: q.type || "core",
        questionFormat: q.questionFormat || "self-report",
        answerOptions: q.answerOptions,
        scoreMap: q.scoreMap,
        weight: q.weight ?? 1.0,
        isValidation: q.isValidation ?? false,
        isTrap: q.isTrap ?? false,
        validationPair: q.validationPair ?? null,
      },
      create: {
        frameworkId: framework.id,
        domainKey: q.domain,
        tier: q.tier,
        orderIndex: q.orderIndex,
        prompt: q.prompt,
        type: q.type || "core",
        questionFormat: q.questionFormat || "self-report",
        answerOptions: q.answerOptions,
        scoreMap: q.scoreMap,
        weight: q.weight ?? 1.0,
        isValidation: q.isValidation ?? false,
        isTrap: q.isTrap ?? false,
        validationPair: q.validationPair ?? null,
      },
    });
  }
  console.log(`Seeded ${allQuestions.length} framework questions for MeQ Standard`);

  // === SEED STANDALONE STAFF WELLBEING ===
  // Staff wellbeing is system-wide, not tied to student frameworks.

  const staffDomains = [
    { key: "SelfAwareness", label: "Self-Awareness", color: "blue", sortOrder: 0, description: "Recognising your own emotions, strengths, and impact on others" },
    { key: "SelfManagement", label: "Self-Management", color: "emerald", sortOrder: 1, description: "Managing stress, workload, and personal wellbeing" },
    { key: "RelationalEmpathy", label: "Relational Empathy", color: "purple", sortOrder: 2, description: "Understanding and responding to pupils and colleagues" },
    { key: "TeamCollaboration", label: "Team Collaboration", color: "amber", sortOrder: 3, description: "Working well with and supporting colleagues" },
    { key: "ProfessionalPurpose", label: "Professional Purpose", color: "rose", sortOrder: 4, description: "Connection to values, meaning, and decision-making at work" },
  ];

  for (const d of staffDomains) {
    await prisma.staffDomain.upsert({
      where: { key: d.key },
      update: { label: d.label, color: d.color, sortOrder: d.sortOrder, description: d.description },
      create: d,
    });
  }
  console.log(`Seeded ${staffDomains.length} staff domains`);

  // Staff questions: 4 per domain
  const staffQuestionsByDomain: Record<string, string[]> = {
    SelfAwareness: [
      "I am aware of how my emotions affect my teaching",
      "I recognise when I am feeling stressed or overwhelmed at work",
      "I understand what motivates me professionally",
      "I can identify my strengths and development areas as an educator",
    ],
    SelfManagement: [
      "I have effective strategies to manage work-related stress",
      "I maintain a healthy work-life balance",
      "I stay calm in challenging classroom situations",
      "I take regular breaks and look after my physical health",
    ],
    RelationalEmpathy: [
      "I understand the emotions and perspectives of my pupils",
      "I listen actively when colleagues share concerns",
      "I am aware of how my words and actions affect others",
      "I pick up on non-verbal cues from pupils and colleagues",
    ],
    TeamCollaboration: [
      "I feel supported by my colleagues and school leadership",
      "I contribute positively to my team",
      "I can ask for help when I need it",
      "I build strong professional relationships at school",
    ],
    ProfessionalPurpose: [
      "I make thoughtful decisions even when under pressure",
      "My daily work aligns with my values as an educator",
      "I feel my work has meaning and purpose",
      "I make time for professional growth and reflection",
    ],
  };

  const STAFF_ANSWER_OPTIONS = JSON.stringify([
    { label: "Strongly disagree", value: 1 },
    { label: "Disagree", value: 2 },
    { label: "Agree", value: 3 },
    { label: "Strongly agree", value: 4 },
  ]);
  const STAFF_SCORE_MAP = JSON.stringify({ "1": 0, "2": 1, "3": 2, "4": 3 });

  let staffOrderIndex = 1;
  for (const d of staffDomains) {
    const domainRecord = await prisma.staffDomain.findUnique({ where: { key: d.key } });
    if (!domainRecord) continue;

    const prompts = staffQuestionsByDomain[d.key] || [];
    for (const prompt of prompts) {
      const existing = await prisma.staffQuestion.findFirst({
        where: { domainId: domainRecord.id, prompt },
      });
      if (!existing) {
        await prisma.staffQuestion.create({
          data: {
            domainId: domainRecord.id,
            orderIndex: staffOrderIndex,
            prompt,
            type: "core",
            questionFormat: "self-report",
            answerOptions: STAFF_ANSWER_OPTIONS,
            scoreMap: STAFF_SCORE_MAP,
            weight: 1.0,
          },
        });
      }
      staffOrderIndex++;
    }
  }
  console.log(`Seeded staff wellbeing questions`);

  // Staff scoring config — single row
  await prisma.staffScoringConfig.upsert({
    where: { key: "default" },
    update: {},
    create: {
      key: "default",
      thresholds: JSON.stringify([
        { level: "Advanced", min: 9 },
        { level: "Secure", min: 7 },
        { level: "Developing", min: 4 },
        { level: "Emerging", min: 0 },
      ]),
      overallThresholds: JSON.stringify([
        { level: "Advanced", min: 45 },
        { level: "Secure", min: 35 },
        { level: "Developing", min: 20 },
        { level: "Emerging", min: 0 },
      ]),
      maxDomainScore: 12, // 4 questions x 3 max score each
      maxTotalScore: 60,  // 5 domains x 12
    },
  });
  console.log(`Seeded staff scoring config`);

  // Staff pulse questions — one per domain
  const staffPulseQuestions: Record<string, { prompt: string; emoji: string }> = {
    SelfAwareness: { prompt: "I understand how I'm feeling this week", emoji: "🧐" },
    SelfManagement: { prompt: "I feel in control of my workload this week", emoji: "🧘" },
    RelationalEmpathy: { prompt: "I've connected well with pupils and colleagues", emoji: "🤝" },
    TeamCollaboration: { prompt: "I feel supported by my team this week", emoji: "👥" },
    ProfessionalPurpose: { prompt: "My work has felt meaningful this week", emoji: "⭐" },
  };

  for (const d of staffDomains) {
    const domainRecord = await prisma.staffDomain.findUnique({ where: { key: d.key } });
    if (!domainRecord) continue;
    const pq = staffPulseQuestions[d.key];
    if (!pq) continue;
    await prisma.staffPulseQuestion.upsert({
      where: { domainId: domainRecord.id },
      update: { prompt: pq.prompt, emoji: pq.emoji },
      create: {
        domainId: domainRecord.id,
        prompt: pq.prompt,
        emoji: pq.emoji,
        orderIndex: d.sortOrder,
      },
    });
  }
  console.log(`Seeded staff pulse questions`);

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
      schoolId: school.id,
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
      schoolId: school.id,
    },
  });
  console.log("Test student created (code: JNRAB234, junior tier)");

  // ============ PHASE 2: SCHOOL STRUCTURE ============

  // Year groups for demo school
  const yearGroups = [
    { name: "FS2", sortOrder: 0, tier: "junior" },
    { name: "Year 1", sortOrder: 1, tier: "junior" },
    { name: "Year 2", sortOrder: 2, tier: "junior" },
    { name: "Year 3", sortOrder: 3, tier: "standard" },
    { name: "Year 4", sortOrder: 4, tier: "standard" },
    { name: "Year 5", sortOrder: 5, tier: "standard" },
    { name: "Year 6", sortOrder: 6, tier: "standard" },
  ];
  for (const yg of yearGroups) {
    await prisma.yearGroup.upsert({
      where: { schoolId_name: { schoolId: school.id, name: yg.name } },
      update: yg,
      create: { ...yg, schoolId: school.id },
    });
  }
  console.log(`Seeded ${yearGroups.length} year groups`);

  // ============ PHASE 2: TEACHER QUESTIONS ============

  const TEACHER_OPTIONS = JSON.stringify([
    { label: "Rarely or not yet", value: 1 },
    { label: "Sometimes", value: 2 },
    { label: "Often", value: 3 },
    { label: "Consistently", value: 4 },
  ]);
  const TEACHER_SCORE_MAP = JSON.stringify({ "1": 1, "2": 2, "3": 3, "4": 4 });

  const teacherQuestions = [
    { orderIndex: 1, prompt: "This student can identify and name their emotions.", domain: "KnowMe", answerOptions: TEACHER_OPTIONS, scoreMap: TEACHER_SCORE_MAP, weight: 1.0 },
    { orderIndex: 2, prompt: "This student shows awareness of their strengths and areas for development.", domain: "KnowMe", answerOptions: TEACHER_OPTIONS, scoreMap: TEACHER_SCORE_MAP, weight: 1.0 },
    { orderIndex: 3, prompt: "This student manages frustration and anger appropriately.", domain: "ManageMe", answerOptions: TEACHER_OPTIONS, scoreMap: TEACHER_SCORE_MAP, weight: 1.0 },
    { orderIndex: 4, prompt: "This student perseveres when tasks are challenging.", domain: "ManageMe", answerOptions: TEACHER_OPTIONS, scoreMap: TEACHER_SCORE_MAP, weight: 1.0 },
    { orderIndex: 5, prompt: "This student shows empathy towards peers.", domain: "UnderstandOthers", answerOptions: TEACHER_OPTIONS, scoreMap: TEACHER_SCORE_MAP, weight: 1.0 },
    { orderIndex: 6, prompt: "This student recognises when others are upset or need support.", domain: "UnderstandOthers", answerOptions: TEACHER_OPTIONS, scoreMap: TEACHER_SCORE_MAP, weight: 1.0 },
    { orderIndex: 7, prompt: "This student collaborates effectively in group work.", domain: "WorkWithOthers", answerOptions: TEACHER_OPTIONS, scoreMap: TEACHER_SCORE_MAP, weight: 1.0 },
    { orderIndex: 8, prompt: "This student resolves conflicts with peers constructively.", domain: "WorkWithOthers", answerOptions: TEACHER_OPTIONS, scoreMap: TEACHER_SCORE_MAP, weight: 1.0 },
    { orderIndex: 9, prompt: "This student considers consequences before acting.", domain: "ChooseWell", answerOptions: TEACHER_OPTIONS, scoreMap: TEACHER_SCORE_MAP, weight: 1.0 },
    { orderIndex: 10, prompt: "This student takes responsibility for their actions.", domain: "ChooseWell", answerOptions: TEACHER_OPTIONS, scoreMap: TEACHER_SCORE_MAP, weight: 1.0 },
  ];
  for (const tq of teacherQuestions) {
    await prisma.teacherQuestion.upsert({
      where: { orderIndex: tq.orderIndex },
      update: tq,
      create: tq,
    });
  }
  console.log(`Seeded ${teacherQuestions.length} teacher questions`);

  // ============ PHASE 2: DEFAULT INTERVENTIONS ============

  // Clear existing defaults before reseeding
  await prisma.intervention.deleteMany({ where: { isDefault: true } });

  const domains = ["KnowMe", "ManageMe", "UnderstandOthers", "WorkWithOthers", "ChooseWell"];
  const levels = ["Emerging", "Developing", "Secure", "Advanced"];

  // Student-facing interventions (standard tier)
  const studentInterventions: Record<string, Record<string, { title: string; desc: string }[]>> = {
    KnowMe: {
      Emerging: [
        { title: "Feelings check-in", desc: "Try naming one feeling each morning — happy, sad, worried, or excited." },
        { title: "Feelings faces", desc: "Use a feelings chart to point to how you feel each day." },
      ],
      Developing: [
        { title: "Feelings diary", desc: "Write or draw one thing that made you feel a strong emotion today." },
        { title: "Body clues", desc: "Notice where in your body you feel emotions — does your tummy feel tight when you're nervous?" },
      ],
      Secure: [
        { title: "Emotion explorer", desc: "Try to spot the difference between similar feelings, like frustrated vs angry." },
        { title: "Triggers tracker", desc: "Think about what situations make you feel certain ways and why." },
      ],
      Advanced: [
        { title: "Emotion mentor", desc: "Help a friend name how they're feeling when they're not sure." },
        { title: "Reflection journal", desc: "Write about a time your emotions surprised you and what you learned." },
      ],
    },
    ManageMe: {
      Emerging: [
        { title: "Breathing buddy", desc: "Put a toy on your tummy and watch it rise and fall as you breathe slowly." },
        { title: "Counting calm", desc: "Count slowly to 10 before reacting when you feel upset." },
      ],
      Developing: [
        { title: "Calm corner", desc: "Find a quiet spot and use a calm-down strategy when emotions feel big." },
        { title: "Stop-Think-Act", desc: "Before you react, stop, think about what could happen, then choose what to do." },
      ],
      Secure: [
        { title: "Bounce back plan", desc: "When things go wrong, make a plan: what happened, what can I do next time?" },
        { title: "Goal setting", desc: "Set a small goal for the week and track how you keep going when it gets hard." },
      ],
      Advanced: [
        { title: "Stress toolkit", desc: "Build your own toolkit of 3-4 strategies that work best for you." },
        { title: "Coaching others", desc: "Share your calming strategies with a friend who is struggling." },
      ],
    },
    UnderstandOthers: {
      Emerging: [
        { title: "Face reading", desc: "Look at people's faces and try to guess if they are happy, sad, or worried." },
        { title: "Kindness moment", desc: "Do one kind thing for someone each day, even something small like smiling." },
      ],
      Developing: [
        { title: "Perspective swap", desc: "When someone is upset, try thinking: how would I feel if that happened to me?" },
        { title: "Active listening", desc: "When a friend talks, look at them, nod, and ask a question about what they said." },
      ],
      Secure: [
        { title: "Empathy detective", desc: "Notice when someone might be hiding their feelings and gently check in." },
        { title: "Difference spotter", desc: "Think about how different people might feel differently about the same thing." },
      ],
      Advanced: [
        { title: "Peer supporter", desc: "Be someone others come to when they need to talk — listen without judging." },
        { title: "Community helper", desc: "Think about how you can help people beyond your friend group." },
      ],
    },
    WorkWithOthers: {
      Emerging: [
        { title: "Turn-taking practice", desc: "Play a game where you must wait for your turn before acting." },
        { title: "Sharing challenge", desc: "Choose one thing to share with someone each day." },
      ],
      Developing: [
        { title: "Idea collector", desc: "In group work, ask everyone to share their idea before deciding." },
        { title: "Compromise finder", desc: "When you disagree, find something you can both agree on." },
      ],
      Secure: [
        { title: "Team builder", desc: "Notice who hasn't spoken in a group and invite them to share." },
        { title: "Conflict resolver", desc: "When friends argue, help them talk about it calmly." },
      ],
      Advanced: [
        { title: "Leadership practice", desc: "Take turns being the group leader and letting others lead." },
        { title: "Feedback giver", desc: "Practise giving kind, honest feedback to help your team improve." },
      ],
    },
    ChooseWell: {
      Emerging: [
        { title: "Good choice / tricky choice", desc: "Before you act, ask yourself: is this a good choice or a tricky choice?" },
        { title: "Ask for help", desc: "When you're not sure what to do, ask a grown-up or friend for advice." },
      ],
      Developing: [
        { title: "Consequence thinking", desc: "Before you choose, think: what could happen next if I do this?" },
        { title: "Saying sorry", desc: "Practise saying sorry and meaning it when you make a mistake." },
      ],
      Secure: [
        { title: "Values check", desc: "Think about what matters to you — fairness, kindness, honesty — and let that guide your choices." },
        { title: "Role model spotting", desc: "Notice people who make good choices and think about what you can learn from them." },
      ],
      Advanced: [
        { title: "Ethical dilemmas", desc: "Discuss tricky situations where there's no easy answer and practise thinking them through." },
        { title: "Decision mentor", desc: "Help younger students think through their choices." },
      ],
    },
  };

  // Teacher-facing interventions (standard tier)
  const teacherInterventions: Record<string, Record<string, { title: string; desc: string }[]>> = {
    KnowMe: {
      Emerging: [
        { title: "Daily feelings check-in", desc: "Use a visual feelings chart at registration. Ask students to identify their emotion and share one reason why." },
        { title: "Emotion vocabulary building", desc: "Introduce 2-3 new emotion words per week through stories, role-play, and discussion." },
      ],
      Developing: [
        { title: "Feelings journal", desc: "Provide structured journal prompts: 'Today I felt... because...' Twice weekly, 5 minutes." },
        { title: "Body mapping", desc: "Draw body outlines and colour where different emotions are felt. Builds somatic awareness." },
      ],
      Secure: [
        { title: "Emotion spectrum discussions", desc: "Explore nuanced emotions (e.g., difference between frustrated, annoyed, furious) in PSHE lessons." },
        { title: "Trigger analysis", desc: "Help students map their emotional triggers using a simple cause-effect template." },
      ],
      Advanced: [
        { title: "Peer mentoring", desc: "Pair with younger students to help them identify and discuss their feelings." },
        { title: "Self-reflection projects", desc: "Extended writing or art projects exploring personal emotional growth over time." },
      ],
    },
    ManageMe: {
      Emerging: [
        { title: "Calm corner setup", desc: "Establish a calm corner with sensory tools (fidgets, breathing cards, timer). Explicitly teach when and how to use it." },
        { title: "Breathing exercises", desc: "Teach 3 breathing techniques (square breathing, balloon breath, 5-finger breathing). Practise daily." },
      ],
      Developing: [
        { title: "Zones of Regulation", desc: "Implement Zones framework to help students identify their regulation state and choose appropriate strategies." },
        { title: "Growth mindset activities", desc: "Use 'yet' language and celebrate effort over outcome. Display learning pit visuals." },
      ],
      Secure: [
        { title: "Self-regulation toolkit", desc: "Students create personal toolkits of strategies that work for them. Review termly." },
        { title: "Goal setting and review", desc: "Teach SMART goal setting. Weekly check-ins on progress with reflection on setbacks." },
      ],
      Advanced: [
        { title: "Metacognition training", desc: "Teach students to plan, monitor, and evaluate their own emotional regulation strategies." },
        { title: "Resilience challenges", desc: "Set structured challenges that build perseverance with guided reflection after." },
      ],
    },
    UnderstandOthers: {
      Emerging: [
        { title: "Emotion photo cards", desc: "Use photo cards showing different facial expressions. Practise identifying and discussing what the person might feel." },
        { title: "Kindness jar", desc: "Class kindness jar — when acts of empathy are noticed, add a token. Celebrate milestones together." },
      ],
      Developing: [
        { title: "Perspective-taking stories", desc: "Read stories and pause to ask: 'How do you think [character] feels? Why?' before revealing outcomes." },
        { title: "Active listening skills", desc: "Explicitly teach and practise: eye contact, nodding, reflecting back, asking follow-up questions." },
      ],
      Secure: [
        { title: "Empathy role-play", desc: "Use drama and role-play to explore different perspectives in conflict situations." },
        { title: "Community circle", desc: "Regular circle time where students share experiences and practise responding empathetically." },
      ],
      Advanced: [
        { title: "Social action projects", desc: "Lead projects that benefit others — connecting empathy understanding to real-world action." },
        { title: "Cross-age buddying", desc: "Pair with younger classes for reading buddies or play leaders, developing responsive empathy." },
      ],
    },
    WorkWithOthers: {
      Emerging: [
        { title: "Structured pair work", desc: "Start with paired tasks with clear roles (talker/listener) before progressing to group work." },
        { title: "Turn-taking games", desc: "Use structured games that require explicit turn-taking. Reflect on how it felt to wait." },
      ],
      Developing: [
        { title: "Group role cards", desc: "Assign roles in group work (timekeeper, scribe, encourager, presenter). Rotate each session." },
        { title: "Conflict resolution scripts", desc: "Teach and display steps: 1) I feel... 2) When you... 3) I would like... 4) Let's agree..." },
      ],
      Secure: [
        { title: "Collaborative challenges", desc: "Set group tasks that require genuine interdependence — no one can complete it alone." },
        { title: "Peer mediation", desc: "Train students as peer mediators to help resolve playground or classroom disputes." },
      ],
      Advanced: [
        { title: "Team leadership rotation", desc: "Structured leadership opportunities where students plan, delegate, and reflect on team dynamics." },
        { title: "Feedback culture", desc: "Teach giving and receiving constructive feedback using 'Two stars and a wish' or similar frameworks." },
      ],
    },
    ChooseWell: {
      Emerging: [
        { title: "Choice consequence cards", desc: "Visual cards showing choices and their consequences. Sort into 'good choice' and 'tricky choice' piles." },
        { title: "Rule reminders", desc: "Co-create class rules with students. Refer back to them when making choices. 'Which rule helps us here?'" },
      ],
      Developing: [
        { title: "Decision tree", desc: "Teach a simple decision-making framework: What are my options? What might happen? Which feels right?" },
        { title: "Restorative conversations", desc: "When things go wrong, use restorative questions: What happened? Who was affected? How can we fix it?" },
      ],
      Secure: [
        { title: "Ethical dilemma discussions", desc: "Present age-appropriate dilemmas in PSHE. No right answer — focus on reasoning and values." },
        { title: "Responsibility roles", desc: "Give meaningful class responsibilities. Reflect on what it means to be relied upon." },
      ],
      Advanced: [
        { title: "Values-based leadership", desc: "Students identify personal values and connect them to real choices they face. Build a values action plan." },
        { title: "Peer coaching", desc: "Train students to coach younger peers through decision-making using guided questioning." },
      ],
    },
  };

  let interventionCount = 0;
  for (const domain of domains) {
    for (const level of levels) {
      const studentItems = studentInterventions[domain]?.[level] || [];
      for (let i = 0; i < studentItems.length; i++) {
        await prisma.intervention.create({
          data: {
            domain,
            level,
            tier: "standard",
            audience: "student",
            title: studentItems[i].title,
            description: studentItems[i].desc,
            sortOrder: i,
            isDefault: true,
            frameworkId: framework.id,
          },
        });
        interventionCount++;
      }
      const teacherItems = teacherInterventions[domain]?.[level] || [];
      for (let i = 0; i < teacherItems.length; i++) {
        await prisma.intervention.create({
          data: {
            domain,
            level,
            tier: "standard",
            audience: "teacher",
            title: teacherItems[i].title,
            description: teacherItems[i].desc,
            sortOrder: i,
            isDefault: true,
            frameworkId: framework.id,
          },
        });
        interventionCount++;
      }
    }
  }
  console.log(`Seeded ${interventionCount} default interventions`);

  // Seed pulse questions (linked to MeQ Standard framework)
  for (const pq of pulseQuestions) {
    await prisma.pulseQuestion.upsert({
      where: { frameworkId_tier_domain: { frameworkId: framework.id, tier: pq.tier, domain: pq.domain } },
      update: { prompt: pq.prompt, emoji: pq.emoji, orderIndex: pq.orderIndex },
      create: { ...pq, frameworkId: framework.id },
    });
  }
  console.log(`Seeded ${pulseQuestions.length} pulse questions for MeQ Standard`);

  // === SEED EXAMPLE FRAMEWORKS ===

  const exampleFrameworks = [
    {
      name: "HEART",
      slug: "heart",
      description: "Head, Emotions, Actions, Relationships, Thinking — a holistic wellbeing framework.",
      domains: [
        { key: "Head", label: "Head", color: "blue" },
        { key: "Emotions", label: "Emotions", color: "rose" },
        { key: "Actions", label: "Actions", color: "emerald" },
        { key: "Relationships", label: "Relationships", color: "purple" },
        { key: "Thinking", label: "Thinking", color: "amber" },
      ],
    },
    {
      name: "PERMA",
      slug: "perma",
      description: "Positive Emotion, Engagement, Relationships, Meaning, Accomplishment — Seligman's wellbeing model.",
      domains: [
        { key: "PositiveEmotion", label: "Positive Emotion", color: "amber" },
        { key: "Engagement", label: "Engagement", color: "blue" },
        { key: "Relationships", label: "Relationships", color: "purple" },
        { key: "Meaning", label: "Meaning", color: "emerald" },
        { key: "Accomplishment", label: "Accomplishment", color: "rose" },
      ],
    },
    {
      name: "Character Education",
      slug: "character-education",
      description: "A values-based framework focusing on core character virtues.",
      domains: [
        { key: "Respect", label: "Respect", color: "blue" },
        { key: "Responsibility", label: "Responsibility", color: "emerald" },
        { key: "Resilience", label: "Resilience", color: "amber" },
        { key: "Integrity", label: "Integrity", color: "purple" },
        { key: "Compassion", label: "Compassion", color: "rose" },
        { key: "Courage", label: "Courage", color: "red" },
      ],
    },
  ];

  for (const ef of exampleFrameworks) {
    const existing = await prisma.framework.findUnique({ where: { slug: ef.slug } });
    if (existing) continue;

    const domainCount = ef.domains.length;
    const fw = await prisma.framework.create({
      data: {
        name: ef.name,
        slug: ef.slug,
        description: ef.description,
        config: JSON.stringify({
          levels: ["Emerging", "Developing", "Secure", "Advanced"],
          tiers: {
            standard: {
              levelThresholds: [{ level: "Advanced", min: 18 }, { level: "Secure", min: 15 }, { level: "Developing", min: 10 }, { level: "Emerging", min: 0 }],
              overallThresholds: [{ level: "Advanced", min: 18 * domainCount }, { level: "Secure", min: 15 * domainCount }, { level: "Developing", min: 10 * domainCount }, { level: "Emerging", min: 0 }],
              maxDomainScore: 26,
              maxTotalScore: 26 * domainCount,
            },
            junior: {
              levelThresholds: [{ level: "Advanced", min: 14 }, { level: "Secure", min: 11 }, { level: "Developing", min: 8 }, { level: "Emerging", min: 0 }],
              overallThresholds: [{ level: "Advanced", min: 14 * domainCount }, { level: "Secure", min: 11 * domainCount }, { level: "Developing", min: 8 * domainCount }, { level: "Emerging", min: 0 }],
              maxDomainScore: 16,
              maxTotalScore: 16 * domainCount,
            },
          },
        }),
      },
    });

    for (let i = 0; i < ef.domains.length; i++) {
      await prisma.frameworkDomain.create({
        data: {
          frameworkId: fw.id,
          key: ef.domains[i].key,
          label: ef.domains[i].label,
          color: ef.domains[i].color,
          sortOrder: i,
        },
      });
    }

    console.log(`Seeded ${ef.name} framework with ${ef.domains.length} domains`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
