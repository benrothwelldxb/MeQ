import { prisma } from "./db";
import { DOMAINS, type Domain, type Level } from "./constants";

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

  return assessments.map((a) => ({
    term: a.term,
    totalScore: a.totalScore,
    overallLevel: a.overallLevel,
    domainScores: {
      KnowMe: a.knowMeScore ?? 0,
      ManageMe: a.manageMeScore ?? 0,
      UnderstandOthers: a.understandOthersScore ?? 0,
      WorkWithOthers: a.workWithOthersScore ?? 0,
      ChooseWell: a.chooseWellScore ?? 0,
    },
    domainLevels: {
      KnowMe: (a.knowMeLevel as Level) ?? "Emerging",
      ManageMe: (a.manageMeLevel as Level) ?? "Emerging",
      UnderstandOthers: (a.understandOthersLevel as Level) ?? "Emerging",
      WorkWithOthers: (a.workWithOthersLevel as Level) ?? "Emerging",
      ChooseWell: (a.chooseWellLevel as Level) ?? "Emerging",
    },
    completedAt: a.completedAt,
  }));
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
