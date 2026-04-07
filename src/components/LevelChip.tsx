import { LEVEL_COLORS, type Level } from "@/lib/constants";

export default function LevelChip({
  level,
  size = "md",
}: {
  level: Level;
  size?: "sm" | "md";
}) {
  const colors = LEVEL_COLORS[level];
  const sizeClasses =
    size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3.5 py-1.5 text-sm";

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${colors.bg} ${colors.text} ${sizeClasses}`}
    >
      {level}
    </span>
  );
}
