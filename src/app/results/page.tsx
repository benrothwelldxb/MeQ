import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { getSchoolFramework, type FrameworkConfig } from "@/lib/framework";
import {
  DOMAIN_LABELS,
  STRENGTH_MESSAGES,
  JUNIOR_STRENGTH_MESSAGES,
  NEXT_STEPS,
  JUNIOR_NEXT_STEPS,
  type Domain,
  type Tier,
} from "@/lib/constants";
import { getStrengths, getGrowthAreas } from "@/lib/scoring";
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
  const firstName = assessment.student.displayName || assessment.student.firstName;

  // Check if this assessment used a custom framework
  const framework = assessment.frameworkId
    ? await getSchoolFramework(assessment.student.schoolId)
    : null;

  // Get domain scores — prefer JSON fields, fall back to legacy columns
  let domainScores: Record<string, number>;
  let domainLabels: Record<string, string>;
  let strengthMsgs: Record<string, string>;
  let nextStepMsgs: Record<string, string[]>;

  if (assessment.domainScoresJson && framework) {
    // Framework-based results
    domainScores = JSON.parse(assessment.domainScoresJson) as Record<string, number>;
    domainLabels = Object.fromEntries(framework.domains.map((d) => [d.key, d.label]));
    strengthMsgs = framework.config.strengthMessages || {};
    nextStepMsgs = framework.config.nextSteps || {};
  } else {
    // Legacy MeQ Standard results
    domainScores = {
      KnowMe: assessment.knowMeScore ?? 0,
      ManageMe: assessment.manageMeScore ?? 0,
      UnderstandOthers: assessment.understandOthersScore ?? 0,
      WorkWithOthers: assessment.workWithOthersScore ?? 0,
      ChooseWell: assessment.chooseWellScore ?? 0,
    };
    domainLabels = DOMAIN_LABELS;
    strengthMsgs = isJunior ? JUNIOR_STRENGTH_MESSAGES : STRENGTH_MESSAGES;
    nextStepMsgs = isJunior ? JUNIOR_NEXT_STEPS : NEXT_STEPS;
  }

  // Sort domains by score to find strengths and growth areas
  const sortedDomains = Object.keys(domainScores).sort((a, b) => domainScores[b] - domainScores[a]);
  const strengths = sortedDomains.slice(0, 2);
  const growthAreas = sortedDomains.slice(-2).reverse();

  return (
    <main className="min-h-screen bg-meq-cloud py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`font-extrabold text-meq-slate mb-2 ${isJunior ? "text-4xl" : "text-3xl"}`}>
            {isJunior
              ? `Amazing job, ${firstName}! \u{1F31F}`
              : `Well done, ${firstName}!`}
          </h1>
          <p className={`text-gray-500 ${isJunior ? "text-xl" : "text-lg"}`}>
            {isJunior
              ? "Look at what you can do!"
              : `Here are your ${framework?.name || "MeQ"} results. You should feel proud!`}
          </p>
        </div>

        {/* Strengths */}
        <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-6 mb-4">
          <h3 className={`font-bold text-meq-slate mb-4 flex items-center gap-2 ${isJunior ? "text-xl" : ""}`}>
            <span className="text-xl">&#11088;</span>
            {isJunior ? " You&apos;re great at..." : " Your Strengths"}
          </h3>
          <ul className="space-y-3">
            {strengths.map((d) => (
              <li key={d} className={`text-gray-600 ${isJunior ? "text-lg" : ""}`}>
                {isJunior && strengthMsgs[d] ? (
                  strengthMsgs[d]
                ) : (
                  <>
                    <span className="font-semibold text-meq-slate">
                      {domainLabels[d] || d}:
                    </span>{" "}
                    {strengthMsgs[d] || `You show strong skills in ${domainLabels[d] || d}.`}
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
                  {domainLabels[d] || d}
                </p>
              )}
              {nextStepMsgs[d] && nextStepMsgs[d].length > 0 ? (
                <ul className="space-y-1.5">
                  {nextStepMsgs[d].map((step, i) => (
                    <li
                      key={i}
                      className={`text-gray-600 flex items-start gap-2 ${isJunior ? "text-lg" : ""}`}
                    >
                      <span className="text-meq-sky mt-0.5 flex-shrink-0">&bull;</span>
                      {step}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Keep practising your {domainLabels[d] || d} skills!</p>
              )}
            </div>
          ))}
        </div>

        {/* Thank you */}
        <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-6 text-center mb-6">
          {isJunior ? (
            <p className="text-meq-slate font-medium text-lg">
              Everyone is good at different things. You did a really great job! {"\ud83c\udf89"}
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
