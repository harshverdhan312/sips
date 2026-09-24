import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export function ReadinessTrendChart({ data, height = 280 }) {
  const chartData = Array.isArray(data) ? data : [];

  if (chartData.length === 0) {
    return (
      <div style={{ width: "100%", height }} className="flex flex-col items-center justify-center text-slate-400 text-xs py-10">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold mb-2">
          📈
        </div>
        <span>No historical placement trends recorded yet</span>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPlacement" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorLpa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              borderColor: "#e2e8f0",
              borderRadius: "12px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              fontSize: "12px"
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
          <Area
            type="monotone"
            dataKey="placementPct"
            name="Placement %"
            stroke="#4f46e5"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorPlacement)"
          />
          <Area
            type="monotone"
            dataKey="avgLpa"
            name="Average LPA (₹)"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorLpa)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
