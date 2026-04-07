"use client";

export default function QuizNav({
  onBack,
  onNext,
  canGoBack,
  isLast,
  hasAnswer,
  saving,
}: {
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
  isLast: boolean;
  hasAnswer: boolean;
  saving: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 mt-8">
      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack}
        className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-meq-slate bg-white border-2 border-meq-mist hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] min-h-touch"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back
      </button>

      {saving && (
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
          </svg>
          Saving...
        </span>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={!hasAnswer}
        className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white transition-all active:scale-[0.98] min-h-touch disabled:opacity-40 disabled:cursor-not-allowed ${
          isLast
            ? "bg-meq-leaf hover:bg-meq-leaf/90"
            : "bg-meq-sky hover:bg-meq-sky/90"
        }`}
      >
        {isLast ? "Finish" : "Next"}
        {!isLast && (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
