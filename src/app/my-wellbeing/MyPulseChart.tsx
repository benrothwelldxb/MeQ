"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getDomainHex } from "@/lib/domain-colors";

type Domain = { key: string; label: string; color: string };

export default function MyPulseChart({
  domains,
  pulseChecks,
}: {
  domains: Domain[];
  pulseChecks: { weekOf: Date; answers: Record<string, number> }[];
}) {
  const data = pulseChecks.map((p) => {
    const row: Record<string, string | number> = {
      week: new Date(p.weekOf).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    };
    for (const d of domains) {
      row[d.key] = p.answers[d.key] ?? 0;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="week" tick={{ fill: "#6b7280", fontSize: 12 }} />
        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: "#6b7280", fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {domains.map((d) => (
          <Line
            key={d.key}
            type="monotone"
            dataKey={d.key}
            name={d.label}
            stroke={getDomainHex(d.color)}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
