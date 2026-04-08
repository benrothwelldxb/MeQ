import { DOMAINS, type Domain, type Level } from "./constants";

interface TeacherQuestionData {
  orderIndex: number;
  domain: string;
  weight: number;
  scoreMap: string;
}

// Teacher questions: 2 per domain, all weight 1.0
// Max per domain = 2 × 4 × 1.0 = 8
const TEACHER_MAX_DOMAIN = 8;

const TEACHER_LEVEL_THRESHOLDS: { level: Level; min: number }[] = [
  { level: "Advanced", min: 7 },
  { level: "Secure", min: 6 },
  { level: "Developing", min: 4 },
  { level: "Emerging", min: 0 },
];

export function getTeacherLevel(score: number): Level {
  for (const { level, min } of TEACHER_LEVEL_THRESHOLDS) {
    if (score >= min) return level;
  }
  return "Emerging";
}

export function calculateTeacherDomainScores(
  answers: Record<string, number>,
  questions: TeacherQuestionData[]
): Record<Domain, number> {
  const scores = {} as Record<Domain, number>;

  for (const domain of DOMAINS) {
    const domainQuestions = questions.filter((q) => q.domain === domain);
    let weightedSum = 0;

    for (const q of domainQuestions) {
      const answer = answers[String(q.orderIndex)];
      if (answer === undefined) continue;

      const scoreMap = JSON.parse(q.scoreMap) as Record<string, number>;
      const mappedScore = scoreMap[String(answer)] ?? answer;
      weightedSum += mappedScore * q.weight;
    }

    scores[domain] = Math.round(weightedSum * 10) / 10;
  }

  return scores;
}

export { TEACHER_MAX_DOMAIN };
