"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Domain = { key: string; label: string; color: string };

export default function SelfVsTeacherChart({
  domains,
  selfScores,
  teacherScores,
  maxDomainScore,
  maxTeacherScore = 8,
}: {
  domains: Domain[];
  selfScores: Record<string, number>;
  teacherScores: Record<string, number>;
  maxDomainScore: number;
  maxTeacherScore?: number;
}) {
  // Normalize both to percentage so they're comparable on one axis
  const data = domains.map((d) => ({
    domain: d.label,
    "Self %": Math.round(((selfScores[d.key] ?? 0) / maxDomainScore) * 100),
    "Teacher %": Math.round(((teacherScores[d.key] ?? 0) / maxTeacherScore) * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="domain" tick={{ fill: "#6b7280", fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 12 }} />
        <Tooltip formatter={(v) => `${v}%`} />
        <Legend />
        <Bar dataKey="Self %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Teacher %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
