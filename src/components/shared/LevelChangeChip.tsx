import { LEVEL_COLORS, type Level } from "@/lib/constants";

export default function LevelChangeChip({
  level,
  direction,
}: {
  level: Level;
  direction?: "up" | "down" | "same";
}) {
  const colors = LEVEL_COLORS[level];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold px-3 py-1 text-sm ${colors.bg} ${colors.text}`}>
      {level}
      {direction === "up" && <span className="text-emerald-600">&#8593;</span>}
      {direction === "down" && <span className="text-red-500">&#8595;</span>}
      {direction === "same" && <span className="text-gray-400">&#8594;</span>}
    </span>
  );
}
