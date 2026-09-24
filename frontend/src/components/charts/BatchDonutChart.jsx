import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";

export function BatchDonutChart({ data, height = 240 }) {
  const chartData = Array.isArray(data) ? data : [];
  const total = chartData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  if (total === 0) {
    return (
      <div style={{ width: "100%", height }} className="flex flex-col items-center justify-center text-slate-400 text-xs py-6">
        <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-semibold mb-2">
          0
        </div>
        <span>No student readiness data recorded</span>
      </div>
    );
  }

  const activeSlices = chartData.filter((d) => (d.value || 0) > 0);
  const paddingAngle = activeSlices.length > 1 ? 4 : 0;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={paddingAngle}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || "#6366f1"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              borderColor: "#e2e8f0",
              borderRadius: "12px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              fontSize: "12px"
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
