// Visual at-a-glance status indicator. Maps the latest overall assessment level
// (Emerging/Developing/Secure/Advanced) to a coloured ring around the student
// avatar/initials. Falls back to grey when no assessment data exists.

const LEVEL_RING: Record<string, { ring: string; text: string; label: string }> = {
  Advanced: { ring: "ring-emerald-400", text: "text-emerald-700", label: "Advanced" },
  Secure: { ring: "ring-blue-400", text: "text-blue-700", label: "Secure" },
  Developing: { ring: "ring-amber-400", text: "text-amber-700", label: "Developing" },
  Emerging: { ring: "ring-red-400", text: "text-red-700", label: "Emerging" },
};

const SIZE_CLASSES: Record<"sm" | "md", string> = {
  sm: "w-7 h-7 text-[10px] ring-2",
  md: "w-10 h-10 text-xs ring-[3px]",
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
  const title = ringInfo ? ringInfo.label : "No assessment yet";

  return (
    <span
      title={title}
      className={`inline-flex items-center justify-center rounded-full bg-gray-100 font-bold text-gray-600 ${SIZE_CLASSES[size]} ${ringClass} ring-offset-1 ring-offset-white`}
    >
      {initials}
    </span>
  );
}
