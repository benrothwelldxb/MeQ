"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

type Domain = { key: string; label: string; color: string };

export default function DomainRadarChart({
  domains,
  selfScores,
  teacherScores,
  maxDomainScore,
}: {
  domains: Domain[];
  selfScores: Record<string, number>;
  teacherScores?: Record<string, number>;
  maxDomainScore: number;
}) {
  const hasTeacher = teacherScores && Object.keys(teacherScores).length > 0;
  // Teacher assessments max at 8 but we want radar on 0-100% scale for comparison
  const teacherMax = 8;

  const data = domains.map((d) => ({
    domain: d.label,
    self: ((selfScores[d.key] ?? 0) / maxDomainScore) * 100,
    teacher: hasTeacher ? ((teacherScores![d.key] ?? 0) / teacherMax) * 100 : 0,
    selfRaw: selfScores[d.key] ?? 0,
    teacherRaw: hasTeacher ? teacherScores![d.key] ?? 0 : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="domain" tick={{ fill: "#6b7280", fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Student"
          dataKey="self"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.4}
        />
        {hasTeacher && (
          <Radar
            name="Teacher"
            dataKey="teacher"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.2}
          />
        )}
        <Legend />
        <Tooltip
          formatter={(value, name, props) => {
            const numeric = typeof value === "number" ? value : Number(value);
            const raw =
              name === "Student"
                ? (props as { payload: { selfRaw: number } }).payload.selfRaw
                : (props as { payload: { teacherRaw: number } }).payload.teacherRaw;
            return [`${Math.round(numeric)}% (${raw})`, name];
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
