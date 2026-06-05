"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { VolumeReport } from "@/lib/analytics/volume";

// A fixed, readable palette cycled across muscle groups.
const COLORS = [
  "#34d399",
  "#60a5fa",
  "#f59e0b",
  "#f472b6",
  "#a78bfa",
  "#22d3ee",
  "#fb7185",
  "#facc15",
  "#4ade80",
  "#818cf8",
];

export function VolumeChart({ report }: { report: VolumeReport }) {
  if (report.muscleGroups.length === 0) {
    return (
      <div className="grid h-72 place-items-center text-sm text-muted">
        No volume logged in this window yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={report.rows} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 16% 20%)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "hsl(215 14% 58%)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: "hsl(215 14% 58%)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(222 20% 11%)",
            border: "1px solid hsl(222 16% 20%)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: "hsl(210 20% 96%)" }}
          cursor={{ fill: "hsl(222 18% 15% / 0.5)" }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {report.muscleGroups.map((mg, i) => (
          <Bar
            key={mg}
            dataKey={mg}
            stackId="vol"
            fill={COLORS[i % COLORS.length]}
            radius={i === report.muscleGroups.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
