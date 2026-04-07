"use client";

export default function OptionCard({
  label,
  selected,
  onSelect,
  index,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const colors = [
    "border-l-blue-400",
    "border-l-emerald-400",
    "border-l-amber-400",
    "border-l-purple-400",
  ];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`quiz-area w-full text-left p-5 rounded-xl border-2 border-l-4 transition-all duration-200 active:scale-[0.98] min-h-touch ${
        colors[index % colors.length]
      } ${
        selected
          ? "border-meq-sky bg-meq-sky-light shadow-md"
          : "border-meq-mist bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
            selected
              ? "border-meq-sky bg-meq-sky"
              : "border-gray-300 bg-white"
          }`}
        >
          {selected && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        <span
          className={`text-base font-medium ${
            selected ? "text-meq-sky" : "text-meq-slate"
          }`}
        >
          {label}
        </span>
      </div>
    </button>
  );
}
