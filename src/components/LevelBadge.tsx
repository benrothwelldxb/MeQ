// Shared status badge for assessment levels. Pairs colour with a shape glyph
// so the meaning carries to colour-blind readers (~8% of boys have red-green
// deficiency) and prints legibly in greyscale on parent reports.

const LEVEL_STYLE: Record<string, { bg: string; text: string; glyph: string; label: string }> = {
  Advanced:   { bg: "bg-emerald-100", text: "text-emerald-700", glyph: "▲", label: "Advanced" },
  Secure:     { bg: "bg-blue-100",    text: "text-blue-700",    glyph: "▶", label: "Secure" },
  Developing: { bg: "bg-amber-100",   text: "text-amber-700",   glyph: "◆", label: "Developing" },
  Emerging:   { bg: "bg-red-100",     text: "text-red-700",     glyph: "▼", label: "Emerging" },
};

export default function LevelBadge({
  level,
  size = "sm",
}: {
  level: string;
  size?: "sm" | "md";
}) {
  const style = LEVEL_STYLE[level] ?? { bg: "bg-gray-100", text: "text-gray-700", glyph: "○", label: level };
  const sizeClasses = size === "md" ? "text-sm px-2.5 py-1" : "text-xs px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full ${style.bg} ${style.text} ${sizeClasses}`}
      aria-label={style.label}
      title={style.label}
    >
      <span aria-hidden="true">{style.glyph}</span>
      {level}
    </span>
  );
}
