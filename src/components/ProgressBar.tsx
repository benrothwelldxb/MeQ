"use client";

export default function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const percent = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-meq-slate">
          Question {current} of {total}
        </span>
        <span className="text-sm font-semibold text-meq-sky">{percent}%</span>
      </div>
      <div className="w-full h-3 bg-meq-mist rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-meq-sky to-blue-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
