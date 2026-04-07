"use client";

export default function EmojiOptionCard({
  label,
  emoji,
  selected,
  onSelect,
}: {
  label: string;
  emoji: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`quiz-area w-full p-5 rounded-2xl border-3 transition-all duration-200 active:scale-[0.96] min-h-[72px] ${
        selected
          ? "border-meq-sky bg-meq-sky-light shadow-md scale-[1.02]"
          : "border-meq-mist bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="text-4xl" role="img">
          {emoji}
        </span>
        <span
          className={`text-lg font-bold ${
            selected ? "text-meq-sky" : "text-meq-slate"
          }`}
        >
          {label}
        </span>
        {selected && (
          <svg
            className="w-6 h-6 text-meq-sky ml-auto"
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
    </button>
  );
}
