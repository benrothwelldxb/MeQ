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
  ReferenceLine,
} from "recharts";
import { getDomainHex } from "@/lib/domain-colors";

type Domain = { key: string; label: string; color: string };
type PulseCheck = {
  weekOf: Date;
  answers: Record<string, number>;
};

export default function PulseTrendChart({
  domains,
  pulseChecks,
}: {
  domains: Domain[];
  pulseChecks: PulseCheck[];
}) {
  if (pulseChecks.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-400">
        No pulse data yet.
      </div>
    );
  }

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
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="week" tick={{ fill: "#6b7280", fontSize: 12 }} />
        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: "#6b7280", fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <ReferenceLine y={2} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Flag", fontSize: 10, fill: "#ef4444" }} />
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
