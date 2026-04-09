import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { getSchoolFramework } from "@/lib/framework";
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

  const tier = assessment.tier || "standard";
  const isJunior = tier === "junior";
  const firstName = assessment.student.displayName || assessment.student.firstName;

  // Load framework — always available
  const framework = await getSchoolFramework(assessment.student.schoolId);
  const domains = framework.domains;

  // Get domain scores from JSON
  const domainScores: Record<string, number> = assessment.domainScoresJson
    ? JSON.parse(assessment.domainScoresJson)
    : {};

  // Get messages from framework
  const messageType = isJunior ? "strength_junior" : "strength";
  const nextStepType = isJunior ? "next_step_junior" : "next_step";

  // Sort domains by score for strengths/growth
  const sortedKeys = Object.keys(domainScores).sort((a, b) => domainScores[b] - domainScores[a]);
  const strengthCount = Math.min(2, Math.floor(domains.length / 2)) || 1;
  const strengths = sortedKeys.slice(0, strengthCount);
  const growthAreas = sortedKeys.slice(-strengthCount).reverse();

  // Build label map
  const labelMap: Record<string, string> = {};
  for (const d of domains) labelMap[d.key] = d.label;

  return (
    <main className="min-h-screen bg-meq-cloud py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className={`font-extrabold text-meq-slate mb-2 ${isJunior ? "text-4xl" : "text-3xl"}`}>
            {isJunior
              ? `Amazing job, ${firstName}! \u{1F31F}`
              : `Well done, ${firstName}!`}
          </h1>
          <p className={`text-gray-500 ${isJunior ? "text-xl" : "text-lg"}`}>
            {isJunior
              ? "Look at what you can do!"
              : `Here are your ${framework.name} results. You should feel proud!`}
          </p>
        </div>

        {/* Strengths */}
        <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-6 mb-4">
          <h3 className={`font-bold text-meq-slate mb-4 flex items-center gap-2 ${isJunior ? "text-xl" : ""}`}>
            <span className="text-xl">&#11088;</span>
            {isJunior ? " You're great at..." : " Your Strengths"}
          </h3>
          <ul className="space-y-3">
            {strengths.map((key) => {
              const msgs = framework.messages[key]?.[messageType] || framework.messages[key]?.["strength"] || [];
              const fallback = `You show strong skills in ${labelMap[key] || key}.`;
              return (
                <li key={key} className={`text-gray-600 ${isJunior ? "text-lg" : ""}`}>
                  {isJunior && msgs.length > 0 ? (
                    msgs[0]
                  ) : (
                    <>
                      <span className="font-semibold text-meq-slate">{labelMap[key] || key}:</span>{" "}
                      {msgs[0] || fallback}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-6 mb-6">
          <h3 className={`font-bold text-meq-slate mb-4 flex items-center gap-2 ${isJunior ? "text-xl" : ""}`}>
            <span className="text-xl">&#127793;</span>
            {isJunior ? " You can try..." : " Helpful Next Steps"}
          </h3>
          {growthAreas.map((key) => {
            const steps = framework.messages[key]?.[nextStepType] || framework.messages[key]?.["next_step"] || [];
            return (
              <div key={key} className="mb-4 last:mb-0">
                {!isJunior && (
                  <p className="font-semibold text-meq-slate mb-2">{labelMap[key] || key}</p>
                )}
                {steps.length > 0 ? (
                  <ul className="space-y-1.5">
                    {steps.map((step, i) => (
                      <li key={i} className={`text-gray-600 flex items-start gap-2 ${isJunior ? "text-lg" : ""}`}>
                        <span className="text-meq-sky mt-0.5 flex-shrink-0">&bull;</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Keep practising your {labelMap[key] || key} skills!</p>
                )}
              </div>
            );
          })}
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
