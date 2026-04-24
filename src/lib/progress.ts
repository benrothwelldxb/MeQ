import { prisma } from "./db";
import { DOMAINS, type Domain, type Level } from "./constants";
import { parseNumberRecord, parseStringRecord } from "./json";

export interface TermResult {
  term: string;
  totalScore: number | null;
  overallLevel: string | null;
  domainScores: Record<Domain, number>;
  domainLevels: Record<Domain, Level>;
  completedAt: Date | null;
}

export interface LevelChange {
  domain: Domain;
  previous: Level;
  current: Level;
  direction: "up" | "down" | "same";
}

export async function getStudentTermHistory(
  studentId: string,
  academicYear?: string
): Promise<TermResult[]> {
  const assessments = await prisma.assessment.findMany({
    where: {
      studentId,
      status: "completed",
      ...(academicYear ? { academicYear } : {}),
    },
    orderBy: { term: "asc" },
  });

  return assessments.map((a) => {
    const scores = parseNumberRecord(a.domainScoresJson);
    const levels = parseStringRecord(a.domainLevelsJson);
    return {
      term: a.term,
      totalScore: a.totalScore,
      overallLevel: a.overallLevel,
      domainScores: {
        KnowMe: scores.KnowMe ?? 0,
        ManageMe: scores.ManageMe ?? 0,
        UnderstandOthers: scores.UnderstandOthers ?? 0,
        WorkWithOthers: scores.WorkWithOthers ?? 0,
        ChooseWell: scores.ChooseWell ?? 0,
      },
      domainLevels: {
        KnowMe: (levels.KnowMe as Level) ?? "Emerging",
        ManageMe: (levels.ManageMe as Level) ?? "Emerging",
        UnderstandOthers: (levels.UnderstandOthers as Level) ?? "Emerging",
        WorkWithOthers: (levels.WorkWithOthers as Level) ?? "Emerging",
        ChooseWell: (levels.ChooseWell as Level) ?? "Emerging",
      },
      completedAt: a.completedAt,
    };
  });
}

export function calculateLevelChanges(
  previous: TermResult,
  current: TermResult
): LevelChange[] {
  const levelOrder: Record<Level, number> = {
    Emerging: 0,
    Developing: 1,
    Secure: 2,
    Advanced: 3,
  };

  return DOMAINS.map((domain) => {
    const prev = previous.domainLevels[domain];
    const curr = current.domainLevels[domain];
    const prevOrder = levelOrder[prev];
    const currOrder = levelOrder[curr];

    return {
      domain,
      previous: prev,
      current: curr,
      direction: currOrder > prevOrder ? "up" : currOrder < prevOrder ? "down" : "same",
    };
  });
}
