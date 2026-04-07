import {
  DOMAINS,
  LEVEL_THRESHOLDS,
  OVERALL_LEVEL_THRESHOLDS,
  type Domain,
  type Level,
} from "./constants";

interface QuestionData {
  orderIndex: number;
  domain: string;
  type: string;
  questionFormat: string;
  weight: number;
  isValidation: boolean;
  isTrap: boolean;
  validationPair: number | null;
  scoreMap: string;
}

export function getLevel(score: number): Level {
  for (const { level, min } of LEVEL_THRESHOLDS) {
    if (score >= min) return level;
  }
  return "Emerging";
}

export function getOverallLevel(totalScore: number): Level {
  for (const { level, min } of OVERALL_LEVEL_THRESHOLDS) {
    if (totalScore >= min) return level;
  }
  return "Emerging";
}

/**
 * Calculate raw weighted sum per domain (core questions only).
 * Each answer is 1-4, multiplied by question weight.
 */
export function calculateDomainScores(
  answers: Record<string, number>,
  questions: QuestionData[]
): Record<Domain, number> {
  const scores = {} as Record<Domain, number>;

  for (const domain of DOMAINS) {
    const domainQuestions = questions.filter(
      (q) => q.domain === domain && q.type === "core"
    );

    let weightedSum = 0;

    for (const q of domainQuestions) {
      const answer = answers[String(q.orderIndex)];
      if (answer === undefined) continue;

      const scoreMap = JSON.parse(q.scoreMap) as Record<string, number>;
      const mappedScore = scoreMap[String(answer)] ?? answer;

      weightedSum += mappedScore * q.weight;
    }

    // Round to 1 decimal place for clarity
    scores[domain] = Math.round(weightedSum * 10) / 10;
  }

  return scores;
}

/**
 * Total MeQ score = sum of all 5 domain scores (raw weighted sum).
 */
export function calculateTotalScore(
  domainScores: Record<Domain, number>
): number {
  const values = Object.values(domainScores);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) * 10) / 10;
}

export function calculateReliability(
  answers: Record<string, number>,
  questions: QuestionData[]
): "High" | "Medium" | "Low" {
  let consistentPairs = 0;
  let totalPairs = 0;
  let trapFlags = 0;
  let totalTraps = 0;

  // Check validation pairs — contradictions across similar questions
  const validationQuestions = questions.filter(
    (q) => q.isValidation && q.validationPair
  );
  for (const vq of validationQuestions) {
    const vAnswer = answers[String(vq.orderIndex)];
    const pAnswer = answers[String(vq.validationPair)];
    if (vAnswer === undefined || pAnswer === undefined) continue;

    totalPairs++;
    if (Math.abs(vAnswer - pAnswer) <= 1) {
      consistentPairs++;
    }
  }

  // Check trap questions — "perfect" answers on extreme statements
  const trapQuestions = questions.filter((q) => q.isTrap);
  for (const tq of trapQuestions) {
    const answer = answers[String(tq.orderIndex)];
    if (answer === undefined) continue;

    totalTraps++;
    // Agreeing strongly (4) with trap statements like
    // "I am always calm no matter what" → flag
    if (answer === 4) {
      trapFlags++;
    }
  }

  const pairRatio = totalPairs > 0 ? consistentPairs / totalPairs : 1;
  const trapRatio = totalTraps > 0 ? trapFlags / totalTraps : 0;

  // High = consistent + no trap flags
  if (pairRatio >= 0.8 && trapRatio <= 0.2) return "High";
  // Medium = minor inconsistency
  if (pairRatio >= 0.5 && trapRatio <= 0.4) return "Medium";
  // Low = significant inconsistency
  return "Low";
}

export function getStrengths(domainScores: Record<Domain, number>): Domain[] {
  return [...DOMAINS]
    .sort((a, b) => domainScores[b] - domainScores[a])
    .slice(0, 2);
}

export function getGrowthAreas(domainScores: Record<Domain, number>): Domain[] {
  return [...DOMAINS]
    .sort((a, b) => domainScores[a] - domainScores[b])
    .slice(0, 2);
}
