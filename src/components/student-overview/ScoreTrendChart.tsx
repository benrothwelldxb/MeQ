"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

type Assessment = {
  term: string;
  academicYear: string;
  totalScore: number;
};

const TERM_LABELS: Record<string, string> = {
  term1: "Term 1",
  term2: "Term 2",
  term3: "Term 3",
};

export default function ScoreTrendChart({
  assessments,
  maxTotalScore,
}: {
  assessments: Assessment[];
  maxTotalScore: number;
}) {
  const data = assessments.map((a) => ({
    label: `${TERM_LABELS[a.term] ?? a.term} ${a.academicYear.slice(-2)}`,
    score: a.totalScore,
  }));

  // Level bands approximated as fractions of max score
  const advancedMin = maxTotalScore * 0.7;
  const secureMin = maxTotalScore * 0.55;
  const developingMin = maxTotalScore * 0.38;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 12 }} />
        <YAxis
          domain={[0, maxTotalScore]}
          tick={{ fill: "#6b7280", fontSize: 12 }}
        />
        <ReferenceArea y1={advancedMin} y2={maxTotalScore} fill="#10b981" fillOpacity={0.08} />
        <ReferenceArea y1={secureMin} y2={advancedMin} fill="#3b82f6" fillOpacity={0.08} />
        <ReferenceArea y1={developingMin} y2={secureMin} fill="#f59e0b" fillOpacity={0.08} />
        <ReferenceArea y1={0} y2={developingMin} fill="#9ca3af" fillOpacity={0.08} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#3b82f6"
          strokeWidth={3}
          dot={{ fill: "#3b82f6", r: 5 }}
          activeDot={{ r: 7 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
