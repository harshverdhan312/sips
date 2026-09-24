import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter
} from "recharts";
import { placementService } from "../../services/placementService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { ReadinessTrendChart } from "../../components/charts/ReadinessTrendChart";
import { DepartmentBarChart } from "../../components/charts/DepartmentBarChart";
import { DashboardSkeleton } from "../../components/common/LoadingSkeleton";
import { useNotifications } from "../../context/NotificationContext";

export function PlacementAnalyticsPage() {
  const { addToast } = useNotifications();
  const [data, setData] = useState(null);
  const [selectedCohort, setSelectedCohort] = useState("2025");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await placementService.getAnalyticsData();
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedCohort]);

  if (loading || !data) return <DashboardSkeleton />;

  const handleExport = () => {
    addToast("Analytics report packet generated (PDF + Excel)!", "success");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            Institutional Placement & Skill Gap Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Macro-level trends across cohort readiness, industry skill deficits, and recruiter demand.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="2025">Cohort 2025 (Current)</option>
            <option value="2024">Cohort 2024 (Graduated)</option>
            <option value="2023">Cohort 2023 (Historical)</option>
          </select>

          <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>
            Export Intelligence Pack
          </Button>
        </div>
      </div>

      {/* 5-Year Historical Placement & CTC Trend */}
      <Card>
        <CardHeader
          title="Cohort Placement & Average Package Trends"
          subtitle="Tracking placement conversion and package progression across graduating batches"
        />
        <ReadinessTrendChart data={data.historyTrend} height={300} />
      </Card>

      {/* 2-Column Row: Demand vs Supply Skill Deficits & Department Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Demand vs Student Supply Gap Chart */}
        <Card>
          <CardHeader
            title="Industry Skill Demand vs Student Supply"
            subtitle="Identifies critical curriculum and training deficits across enrolled cohort candidates"
          />
          {data.skillDemandSupply && data.skillDemandSupply.length > 0 ? (
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.skillDemandSupply}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="skill"
                    tick={{ fill: "#475569", fontSize: 11, fontWeight: 500 }}
                    width={130}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      fontSize: "12px"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="industryDemand" name="Recruiter Demand %" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="studentSupply" name="Batch Proficiency %" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ width: "100%", height: 320 }} className="flex flex-col items-center justify-center text-slate-400 text-xs py-10">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold mb-2">
                🎯
              </div>
              <span>No skill demand vs supply data available yet</span>
            </div>
          )}
        </Card>

        {/* Department-Wise Readiness Comparison */}
        <Card>
          <CardHeader
            title="Department Placement Health Breakdown"
            subtitle="Ready vs Needs Improvement vs At Risk counts per engineering division"
          />
          <DepartmentBarChart data={data.deptPerformance} height={320} />
        </Card>
      </div>

      {/* Technical Score vs Soft Skill Quadrant Plot */}
      <Card>
        <CardHeader
          title="Technical vs Soft Skill Readiness Matrix"
          subtitle="Identifies candidates who excel technically but require communication / interview coaching"
        />
        {data.quadrant && data.quadrant.length > 0 ? (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="tech"
                  name="Technical Score"
                  domain={[0, 100]}
                  unit="/100"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  label={{ value: "Technical Score →", position: "bottom", offset: 0, fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="soft"
                  name="Soft Skill Score"
                  domain={[0, 100]}
                  unit="/100"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  label={{ value: "Soft Skill Score ↑", angle: -90, position: "left", offset: 10, fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "12px"
                  }}
                />
                <Scatter name="Students" data={data.quadrant} fill="#6366f1" shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ width: "100%", height: 300 }} className="flex flex-col items-center justify-center text-slate-400 text-xs py-10">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold mb-2">
              👥
            </div>
            <span>No student performance records available for matrix plotting</span>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
            <span>Top-Right Quadrant: Placement Ready (Both High)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
            <span>Bottom-Right: Tech Strong, Communication Bottleneck</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
            <span>Bottom-Left: High-Risk (Requires Dual Intervention)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
