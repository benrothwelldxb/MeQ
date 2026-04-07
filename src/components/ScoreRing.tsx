"use client";

import { useEffect, useState } from "react";
import { MAX_TOTAL_SCORE } from "@/lib/constants";

export default function ScoreRing({
  score,
  maxScore = MAX_TOTAL_SCORE,
  size = 160,
  strokeWidth = 12,
}: {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
}) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const percent = Math.round((score / maxScore) * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercent / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(percent), 100);
    return () => clearTimeout(timer);
  }, [percent]);

  const getColor = (p: number) => {
    if (p >= 69) return "#4CAF7D"; // Advanced threshold ~69%
    if (p >= 58) return "#4A90D9"; // Secure
    if (p >= 38) return "#F5A623"; // Developing
    return "#9CA3AF"; // Emerging
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(percent)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-extrabold text-meq-slate">
          {score}
        </span>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          MeQ Score
        </span>
        <span className="text-[10px] text-gray-300">out of {maxScore}</span>
      </div>
    </div>
  );
}
