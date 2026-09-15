import React from "react";
import {
  BarChart3,
  Server,
  Activity,
  Cpu,
  HardDrive,
  Users,
  Zap,
  Clock
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Card, CardHeader } from "../../components/common/Card";
import { StatCard } from "../../components/common/StatCard";
import { Badge } from "../../components/common/Badge";

export function AdminAnalyticsPage() {
  const throughputData = [
    { hour: "08:00", requests: 120, mockSessions: 14 },
    { hour: "10:00", requests: 480, mockSessions: 62 },
    { hour: "12:00", requests: 840, mockSessions: 110 },
    { hour: "14:00", requests: 920, mockSessions: 145 },
    { hour: "16:00", requests: 760, mockSessions: 95 },
    { hour: "18:00", requests: 520, mockSessions: 80 },
    { hour: "20:00", requests: 380, mockSessions: 42 }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          Platform Telemetry & User Engagement Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor system throughput, AI mock interview concurrency, and feature adoption across institutional colleges.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Concurrent Sessions"
          value="184 Active"
          subtitle="Peak 320 at 2:00 PM"
          icon={Activity}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Daily API Requests"
          value="48.2k"
          trend={{ value: "+12%", direction: "up" }}
          icon={Zap}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Avg Inference Latency"
          value="142ms"
          subtitle="BERT & ATS Parser"
          icon={Cpu}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Error Rate"
          value="0.02%"
          subtitle="Well within SLA"
          icon={Server}
          iconBg="bg-teal-50 text-teal-600"
        />
      </div>

      {/* Usage Graph */}
      <Card>
        <CardHeader
          title="Daily Platform Workload & Concurrency Curve"
          subtitle="Hourly request volume and simultaneous active mock sessions"
        />
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={throughputData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMock" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "12px",
                  fontSize: "12px"
                }}
              />
              <Area
                type="monotone"
                dataKey="requests"
                name="API Requests / hr"
                stroke="#4f46e5"
                strokeWidth={2}
                fill="url(#colorReq)"
              />
              <Area
                type="monotone"
                dataKey="mockSessions"
                name="Active Mock Sessions"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorMock)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
