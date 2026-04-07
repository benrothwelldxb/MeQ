import {
  DOMAIN_LABELS,
  DOMAIN_DESCRIPTIONS,
  DOMAIN_COLORS,
  MAX_DOMAIN_SCORE,
  type Domain,
  type Level,
} from "@/lib/constants";
import LevelChip from "./LevelChip";

export default function DomainCard({
  domain,
  score,
  level,
}: {
  domain: Domain;
  score: number;
  level: Level;
}) {
  const colors = DOMAIN_COLORS[domain];
  const percent = Math.round((score / MAX_DOMAIN_SCORE) * 100);

  return (
    <div
      className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-5 transition-all`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className={`font-bold text-lg ${colors.text}`}>
          {DOMAIN_LABELS[domain]}
        </h3>
        <LevelChip level={level} size="sm" />
      </div>
      <p className="text-sm text-gray-600 mb-4">
        {DOMAIN_DESCRIPTIONS[domain]}
      </p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 bg-white/60 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${percent}%`,
              backgroundColor:
                domain === "KnowMe"
                  ? "#3B82F6"
                  : domain === "ManageMe"
                  ? "#10B981"
                  : domain === "UnderstandOthers"
                  ? "#8B5CF6"
                  : domain === "WorkWithOthers"
                  ? "#F59E0B"
                  : "#F43F5E",
            }}
          />
        </div>
        <span className={`text-sm font-bold ${colors.text}`}>
          {score} / {MAX_DOMAIN_SCORE}
        </span>
      </div>
    </div>
  );
}
