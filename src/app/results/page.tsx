import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import {
  DOMAINS,
  DOMAIN_LABELS,
  STRENGTH_MESSAGES,
  JUNIOR_STRENGTH_MESSAGES,
  NEXT_STEPS,
  JUNIOR_NEXT_STEPS,
  MAX_TOTAL_SCORE,
  type Domain,
  type Level,
  type Tier,
} from "@/lib/constants";
import { getStrengths, getGrowthAreas } from "@/lib/scoring";
import ScoreRing from "@/components/ScoreRing";
import LevelChip from "@/components/LevelChip";
import DomainCard from "@/components/DomainCard";
import LogoutButton from "./LogoutButton";

export default async function ResultsPage() {
  const session = await getStudentSession();
  if (!session.studentId || !session.assessmentId) {
    redirect("/");
  }

  const assessment = await prisma.assessment.findUnique({
    where: { id: session.assessmentId },
    include: { student: true },
  });

  if (!assessment || assessment.status !== "completed") {
    redirect("/quiz");
  }

  const tier = (assessment.tier || "standard") as Tier;
  const isJunior = tier === "junior";

  const domainScores: Record<Domain, number> = {
    KnowMe: assessment.knowMeScore ?? 0,
    ManageMe: assessment.manageMeScore ?? 0,
    UnderstandOthers: assessment.understandOthersScore ?? 0,
    WorkWithOthers: assessment.workWithOthersScore ?? 0,
    ChooseWell: assessment.chooseWellScore ?? 0,
  };

  const domainLevels: Record<Domain, Level> = {
    KnowMe: (assessment.knowMeLevel as Level) ?? "Emerging",
    ManageMe: (assessment.manageMeLevel as Level) ?? "Emerging",
    UnderstandOthers: (assessment.understandOthersLevel as Level) ?? "Emerging",
    WorkWithOthers: (assessment.workWithOthersLevel as Level) ?? "Emerging",
    ChooseWell: (assessment.chooseWellLevel as Level) ?? "Emerging",
  };

  const strengths = getStrengths(domainScores);
  const growthAreas = getGrowthAreas(domainScores);
  const strengthMessages = isJunior ? JUNIOR_STRENGTH_MESSAGES : STRENGTH_MESSAGES;
  const nextSteps = isJunior ? JUNIOR_NEXT_STEPS : NEXT_STEPS;
  const firstName = assessment.student.displayName || assessment.student.firstName;

  return (
    <main className="min-h-screen bg-meq-cloud py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`font-extrabold text-meq-slate mb-2 ${isJunior ? "text-4xl" : "text-3xl"}`}>
            {isJunior
              ? `Amazing job, ${firstName}! 🌟`
              : `Well done, ${firstName}!`}
          </h1>
          <p className={`text-gray-500 ${isJunior ? "text-xl" : "text-lg"}`}>
            {isJunior
              ? "Look at what you can do!"
              : "Here are your MeQ results. You should feel proud!"}
          </p>
        </div>

        {/* Overall Score */}
        <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-8 text-center mb-6">
          <ScoreRing
            score={assessment.totalScore ?? 0}
            maxScore={MAX_TOTAL_SCORE[tier]}
          />
          <div className="mt-4">
            <LevelChip
              level={(assessment.overallLevel as Level) ?? "Emerging"}
            />
          </div>
        </div>

        {/* Domain Scores */}
        <div className="grid gap-4 mb-6">
          {DOMAINS.map((domain) => (
            <DomainCard
              key={domain}
              domain={domain}
              score={domainScores[domain]}
              level={domainLevels[domain]}
              tier={tier}
            />
          ))}
        </div>

        {/* Strengths */}
        <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-6 mb-4">
          <h3 className={`font-bold text-meq-slate mb-4 flex items-center gap-2 ${isJunior ? "text-xl" : ""}`}>
            <span className="text-xl">&#11088;</span>
            {isJunior ? " You're great at..." : " Your Strengths"}
          </h3>
          <ul className="space-y-3">
            {strengths.map((d) => (
              <li key={d} className={`text-gray-600 ${isJunior ? "text-lg" : ""}`}>
                {isJunior ? (
                  strengthMessages[d]
                ) : (
                  <>
                    <span className="font-semibold text-meq-slate">
                      {DOMAIN_LABELS[d]}:
                    </span>{" "}
                    {strengthMessages[d]}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-6 mb-6">
          <h3 className={`font-bold text-meq-slate mb-4 flex items-center gap-2 ${isJunior ? "text-xl" : ""}`}>
            <span className="text-xl">&#127793;</span>
            {isJunior ? " You can try..." : " Helpful Next Steps"}
          </h3>
          {growthAreas.map((d) => (
            <div key={d} className="mb-4 last:mb-0">
              {!isJunior && (
                <p className="font-semibold text-meq-slate mb-2">
                  {DOMAIN_LABELS[d]}
                </p>
              )}
              <ul className="space-y-1.5">
                {nextSteps[d].map((step, i) => (
                  <li
                    key={i}
                    className={`text-gray-600 flex items-start gap-2 ${isJunior ? "text-lg" : ""}`}
                  >
                    <span className="text-meq-sky mt-0.5 flex-shrink-0">
                      &bull;
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Thank you */}
        <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-6 text-center mb-6">
          {isJunior ? (
            <p className="text-meq-slate font-medium text-lg">
              Everyone is good at different things. You did a really great job! 🎉
            </p>
          ) : (
            <>
              <p className="text-meq-slate font-medium mb-2">
                This is a snapshot of how you see your emotional skills right now.
              </p>
              <p className="text-gray-500 text-sm">
                Everyone has strengths and areas to grow. There are no wrong answers,
                and these skills can always be developed!
              </p>
            </>
          )}
        </div>

        <LogoutButton />
      </div>
    </main>
  );
}
