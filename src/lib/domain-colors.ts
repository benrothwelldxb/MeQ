// Mapping of framework domain color names to hex values for charts
// and Tailwind class utilities for cards/badges.

export const DOMAIN_HEX: Record<string, string> = {
  blue: "#3b82f6",
  emerald: "#10b981",
  purple: "#a855f7",
  amber: "#f59e0b",
  rose: "#f43f5e",
  red: "#ef4444",
  green: "#22c55e",
  indigo: "#6366f1",
  pink: "#ec4899",
  teal: "#14b8a6",
};

export function getDomainHex(color: string): string {
  return DOMAIN_HEX[color] ?? DOMAIN_HEX.blue;
}

export const DOMAIN_TAILWIND: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  red: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  pink: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
};

export function getDomainTailwind(color: string) {
  return DOMAIN_TAILWIND[color] ?? DOMAIN_TAILWIND.blue;
}
