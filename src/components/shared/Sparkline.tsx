"use client";

export default function Sparkline({
  values,
  maxValue,
  width = 120,
  height = 32,
  color = "#4A90D9",
  labels,
}: {
  values: number[];
  maxValue: number;
  width?: number;
  height?: number;
  color?: string;
  labels?: string[];
}) {
  if (values.length < 2) return null;

  const padding = 4;
  const w = width - padding * 2;
  const h = height - padding * 2;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * w;
    const y = padding + h - (v / maxValue) * h;
    return `${x},${y}`;
  });

  return (
    <div className="inline-flex flex-col items-center">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {values.map((v, i) => {
          const x = padding + (i / (values.length - 1)) * w;
          const y = padding + h - (v / maxValue) * h;
          return (
            <circle key={i} cx={x} cy={y} r={3} fill={color} />
          );
        })}
      </svg>
      {labels && (
        <div className="flex justify-between w-full text-[10px] text-gray-400 mt-0.5">
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
