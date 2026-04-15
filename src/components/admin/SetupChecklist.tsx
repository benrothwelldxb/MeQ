import Link from "next/link";

type Step = {
  key: string;
  title: string;
  done: boolean;
  href: string;
  cta: string;
};

export default function SetupChecklist({ steps }: { steps: Step[] }) {
  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const allDone = completed === total;
  if (allDone) return null;

  const pct = Math.round((completed / total) * 100);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h2 className="font-bold text-gray-900">Get your school set up</h2>
          <p className="text-sm text-gray-500 mt-1">
            A few steps to unlock the full MeQ experience.
          </p>
        </div>
        <span className="text-sm font-medium text-gray-500">
          {completed} of {total} complete
        </span>
      </div>

      <div className="w-full h-1.5 bg-gray-100 rounded-full mb-5">
        <div
          className="h-full bg-meq-sky rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.key}
            className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 border ${
              step.done ? "bg-emerald-50 border-emerald-100" : "bg-gray-50 border-gray-100"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {step.done ? (
                <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
              )}
              <span className={`text-sm ${step.done ? "text-emerald-900" : "text-gray-900 font-medium"}`}>
                {step.title}
              </span>
            </div>
            {!step.done && (
              <Link
                href={step.href}
                className="text-sm font-medium text-meq-sky hover:underline flex-shrink-0"
              >
                {step.cta} &rarr;
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
