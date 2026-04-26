import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import Link from "next/link";
import DeleteBankQuestionButton from "./DeleteBankQuestionButton";

export default async function SchoolQuestionBankPage() {
  const session = await getAdminSession();

  const customQuestions = await prisma.surveyBankQuestion.findMany({
    where: { schoolId: session.schoolId },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
  });

  const grouped: Record<string, typeof customQuestions> = {};
  for (const q of customQuestions) {
    const cat = q.category || "Custom";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(q);
  }

  const platformCount = await prisma.surveyBankQuestion.count({
    where: { isDefault: true, schoolId: null },
  });

  return (
    <div className="max-w-4xl">
      <Link href="/admin/settings" className="text-sm text-meq-sky hover:underline">&larr; Back to Settings</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-2">Your school&rsquo;s question bank</h1>
      <p className="text-gray-500 mb-6">
        Questions you save here are reusable across all surveys for your school.
        You also have access to <strong>{platformCount}</strong> platform-default questions in the survey builder.
      </p>

      {customQuestions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-1">You haven&rsquo;t saved any custom questions yet.</p>
          <p className="text-sm text-gray-400">
            When building a survey, click the ★ next to a question to save it here for reuse.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, qs]) => (
            <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-gray-900">{category}</h2>
                <p className="text-xs text-gray-500">{qs.length} question{qs.length === 1 ? "" : "s"}</p>
              </div>
              <ul className="divide-y divide-gray-100">
                {qs.map((q) => (
                  <li key={q.id} className="px-5 py-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{q.prompt}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {q.subcategory && <>Sub: {q.subcategory} &middot; </>}
                        Type: {q.questionType}
                        {" · "}
                        Added {new Date(q.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <DeleteBankQuestionButton id={q.id} prompt={q.prompt} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
