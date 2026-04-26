import Link from "next/link";
import type { RecommendedCheckIn } from "@/lib/recommended-check-ins";

export default function RecommendedCheckInPanel({ items }: { items: RecommendedCheckIn[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">👀</span>
        <div>
          <h2 className="font-bold text-amber-900">
            {items.length} student{items.length === 1 ? "" : "s"} we&rsquo;d recommend checking in with
          </h2>
          <p className="text-xs text-amber-700">
            Suggestions based on this week&rsquo;s pulse and any open safeguarding alerts.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.studentId}
            className={`bg-white rounded-lg border p-3 flex items-start justify-between gap-3 flex-wrap ${
              item.severity === "high" ? "border-red-200 border-l-4 border-l-red-500" : "border-amber-200 border-l-4 border-l-amber-500"
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">
                {item.studentName}{" "}
                <span className="text-xs font-normal text-gray-500">
                  · {item.yearGroup}{item.className ? ` / ${item.className}` : ""}
                </span>
              </p>
              <p className="text-xs text-gray-600 mt-0.5">{item.reason}</p>
            </div>
            <Link
              href={`/teacher/students/${item.studentId}`}
              className="text-xs text-meq-sky hover:underline font-medium"
            >
              Open profile →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
