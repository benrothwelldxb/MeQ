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
  Legend,
} from "recharts";
import { getDomainHex } from "@/lib/domain-colors";

type Domain = { key: string; label: string; color: string };
type TermPoint = { label: string; total: number; domains: Record<string, number> };

export default function TermTrendChart({
  data,
  domains,
  maxTotal,
  showDomains = false,
}: {
  data: TermPoint[];
  domains: Domain[];
  maxTotal: number;
  showDomains?: boolean;
}) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-gray-400">
        No data yet.
      </div>
    );
  }

  // Level bands as fractions of maxTotal
  const advancedMin = maxTotal * 0.7;
  const secureMin = maxTotal * 0.55;
  const developingMin = maxTotal * 0.38;

  const chartData = data.map((d) => ({
    label: d.label,
    total: d.total,
    ...d.domains,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 16, right: 20, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 12 }} />
        <YAxis
          domain={[0, maxTotal]}
          tick={{ fill: "#6b7280", fontSize: 12 }}
        />
        <ReferenceArea y1={advancedMin} y2={maxTotal} fill="#10b981" fillOpacity={0.06} />
        <ReferenceArea y1={secureMin} y2={advancedMin} fill="#3b82f6" fillOpacity={0.06} />
        <ReferenceArea y1={developingMin} y2={secureMin} fill="#f59e0b" fillOpacity={0.06} />
        <ReferenceArea y1={0} y2={developingMin} fill="#9ca3af" fillOpacity={0.06} />
        <Tooltip />
        {showDomains ? (
          <>
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
              />
            ))}
          </>
        ) : (
          <Line
            type="monotone"
            dataKey="total"
            name="School average"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: "#3b82f6", r: 5 }}
            activeDot={{ r: 7 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
