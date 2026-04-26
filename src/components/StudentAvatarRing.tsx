// Visual at-a-glance status indicator. Maps the latest overall assessment
// level (Emerging/Developing/Secure/Advanced) to a coloured ring around the
// student initials, plus a small level-letter badge in the bottom-right
// corner so colour-blind readers can still see the status without relying on
// red-vs-green discrimination.

const LEVEL_RING: Record<string, { ring: string; badgeBg: string; badgeText: string; letter: string; label: string }> = {
  Advanced:   { ring: "ring-emerald-400", badgeBg: "bg-emerald-500", badgeText: "text-white", letter: "A", label: "Advanced" },
  Secure:     { ring: "ring-blue-400",    badgeBg: "bg-blue-500",    badgeText: "text-white", letter: "S", label: "Secure" },
  Developing: { ring: "ring-amber-400",   badgeBg: "bg-amber-500",   badgeText: "text-white", letter: "D", label: "Developing" },
  Emerging:   { ring: "ring-red-400",     badgeBg: "bg-red-500",     badgeText: "text-white", letter: "E", label: "Emerging" },
};

const SIZE_CLASSES: Record<"sm" | "md", { wrapper: string; ring: string; badge: string }> = {
  sm: { wrapper: "w-7 h-7 text-[10px] ring-2", ring: "ring-2", badge: "w-3.5 h-3.5 text-[8px] -bottom-0.5 -right-0.5" },
  md: { wrapper: "w-10 h-10 text-xs ring-[3px]", ring: "ring-[3px]", badge: "w-4 h-4 text-[9px] -bottom-0.5 -right-0.5" },
};

export default function StudentAvatarRing({
  firstName,
  lastName,
  level,
  size = "sm",
}: {
  firstName: string;
  lastName: string;
  level?: string | null;
  size?: "sm" | "md";
}) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const ringInfo = level ? LEVEL_RING[level] : undefined;
  const ringClass = ringInfo ? ringInfo.ring : "ring-gray-200";
  const sz = SIZE_CLASSES[size];
  const title = ringInfo ? ringInfo.label : "No assessment yet";

  return (
    <span
      title={title}
      aria-label={`${firstName} ${lastName}${ringInfo ? ` — ${ringInfo.label}` : ""}`}
      className={`relative inline-flex items-center justify-center rounded-full bg-gray-100 font-bold text-gray-600 ${sz.wrapper} ${ringClass} ring-offset-1 ring-offset-white`}
    >
      {initials}
      {ringInfo && (
        <span
          aria-hidden="true"
          className={`absolute ${sz.badge} ${ringInfo.badgeBg} ${ringInfo.badgeText} rounded-full inline-flex items-center justify-center font-bold ring-1 ring-white`}
        >
          {ringInfo.letter}
        </span>
      )}
    </span>
  );
}
