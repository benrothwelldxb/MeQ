import {
  DOMAINS,
  LEVEL_THRESHOLDS,
  JUNIOR_LEVEL_THRESHOLDS,
  OVERALL_LEVEL_THRESHOLDS,
  JUNIOR_OVERALL_LEVEL_THRESHOLDS,
  REDUCED_LEVEL_THRESHOLDS,
  REDUCED_JUNIOR_LEVEL_THRESHOLDS,
  REDUCED_OVERALL_LEVEL_THRESHOLDS,
  REDUCED_JUNIOR_OVERALL_LEVEL_THRESHOLDS,
  type Domain,
  type Level,
  type Tier,
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

export function getLevel(score: number, tier: Tier = "standard", reduced = false): Level {
  const thresholds = reduced
    ? (tier === "junior" ? REDUCED_JUNIOR_LEVEL_THRESHOLDS : REDUCED_LEVEL_THRESHOLDS)
    : (tier === "junior" ? JUNIOR_LEVEL_THRESHOLDS : LEVEL_THRESHOLDS);
  for (const { level, min } of thresholds) {
    if (score >= min) return level;
  }
  return "Emerging";
}

export function getOverallLevel(totalScore: number, tier: Tier = "standard", reduced = false): Level {
  const thresholds = reduced
    ? (tier === "junior" ? REDUCED_JUNIOR_OVERALL_LEVEL_THRESHOLDS : REDUCED_OVERALL_LEVEL_THRESHOLDS)
    : (tier === "junior" ? JUNIOR_OVERALL_LEVEL_THRESHOLDS : OVERALL_LEVEL_THRESHOLDS);
  for (const { level, min } of thresholds) {
    if (totalScore >= min) return level;
  }
  return "Emerging";
}

/**
 * Calculate raw weighted sum per domain (core questions only).
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

    scores[domain] = Math.round(weightedSum * 10) / 10;
  }

  return scores;
}

/**
 * Total MeQ score = sum of all 5 domain scores.
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

  const trapQuestions = questions.filter((q) => q.isTrap);
  for (const tq of trapQuestions) {
    const answer = answers[String(tq.orderIndex)];
    if (answer === undefined) continue;

    totalTraps++;
    if (answer === 4) {
      trapFlags++;
    }
  }

  // Junior tier has no validation/trap questions — always High
  if (totalPairs === 0 && totalTraps === 0) return "High";

  const pairRatio = totalPairs > 0 ? consistentPairs / totalPairs : 1;
  const trapRatio = totalTraps > 0 ? trapFlags / totalTraps : 0;

  if (pairRatio >= 0.8 && trapRatio <= 0.2) return "High";
  if (pairRatio >= 0.5 && trapRatio <= 0.4) return "Medium";
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
