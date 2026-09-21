import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Briefcase,
  ArrowRight,
  ShieldAlert,
  Send,
  Building2
} from "lucide-react";
import { placementService } from "../../services/placementService";
import { Card, CardHeader } from "../../components/common/Card";
import { StatCard } from "../../components/common/StatCard";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { BatchDonutChart } from "../../components/charts/BatchDonutChart";
import { DepartmentBarChart } from "../../components/charts/DepartmentBarChart";
import { DashboardSkeleton } from "../../components/common/LoadingSkeleton";
import Avatar from "../../components/common/Avatar";
import { useNotifications } from "../../context/NotificationContext";

export function PlacementDashboard() {
  const navigate = useNavigate();
  const { addToast } = useNotifications();
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [m, a, students] = await Promise.all([
          placementService.getBatchMetrics(),
          placementService.getAnalyticsData(),
          placementService.getStudents({ status: "At Risk" })
        ]);
        setMetrics(m);
        setAnalytics(a);
        setAtRiskStudents(students);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !metrics) return <DashboardSkeleton />;

  const handleNotifyStudent = (studentName) => {
    addToast(`Placement counseling alert triggered for ${studentName}`, "info");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Placement Cell Intelligence Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Batch 2025 Placement Readiness Overview
          </h1>
          <p className="text-sm text-slate-500">
            Real-time tracking of 480 engineering candidates across 5 departments.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Briefcase}
            onClick={() => navigate("/placement/jobs")}
          >
            Manage JDs
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={BarChart3}
            onClick={() => navigate("/placement/analytics")}
          >
            Deep Analytics
          </Button>
        </div>
      </div>

      {/* Top 6 Batch KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Students"
          value={metrics.totalStudents}
          subtitle="Batch 2021-2025"
          icon={Users}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Placement Ready"
          value={metrics.placementReady}
          subtitle={`${metrics.placementReadyPct}% of cohort`}
          trend={{ value: "+8%", direction: "up", label: "vs last mo" }}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Needs Improvement"
          value={metrics.needsImprovement}
          subtitle={`${metrics.needsImprovementPct}% of cohort`}
          icon={AlertTriangle}
          iconBg="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Students At Risk"
          value={metrics.atRisk}
          subtitle={`${metrics.atRiskPct}% critical focus`}
          trend={{ value: "-4 students", direction: "down", label: "intervened" }}
          icon={ShieldAlert}
          iconBg="bg-rose-50 text-rose-600"
        />
        <StatCard
          title="Avg Employability"
          value={`${metrics.avgEmployabilityIndex}/100`}
          trend={{ value: "+2.4", direction: "up" }}
          icon={TrendingUp}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Avg Soft Skill"
          value={`${metrics.avgSoftSkillScore}/100`}
          subtitle="Target 75"
          icon={BarChart3}
          iconBg="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Batch Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batch Readiness Donut */}
        <Card className="flex flex-col justify-between">
          <CardHeader
            title="Batch Readiness Distribution"
            subtitle="Categorized by multi-factor placement probability"
          />
          <BatchDonutChart data={analytics.batchDonut} height={230} />
          <div className="mt-2 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Ready: <strong className="text-emerald-600">312</strong></span>
            <span>Needs Imp: <strong className="text-amber-600">124</strong></span>
            <span>At Risk: <strong className="text-rose-600">44</strong></span>
          </div>
        </Card>

        {/* Department-wise Readiness Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Department-Wise Readiness Benchmarks"
            subtitle="Comparing readiness counts across CSE, ISE, AI/ML, ECE, and EEE/Mech"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/placement/students")}
              >
                View Directory →
              </Button>
            }
          />
          <DepartmentBarChart data={analytics.deptPerformance} height={250} />
        </Card>
      </div>

      {/* Students Requiring Attention Triage Table */}
      <Card>
        <CardHeader
          title="Students Requiring Immediate Placement Intervention"
          subtitle="Identified through low interview readiness, severe skill gaps, or backlogs"
          action={
            <Badge variant="danger" size="md">
              {atRiskStudents.length} Priority Interventions
            </Badge>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">CGPA</th>
                <th className="px-4 py-3">Employability</th>
                <th className="px-4 py-3">Critical Skill Gap</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Intervention Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {atRiskStudents.map((std) => (
                <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2.5">
                    <Avatar
                      src={std.profileImageUrl || std.avatar}
                      name={std.name}
                      size="xs"
                      className="w-7 h-7 border border-slate-200 shrink-0"
                    />
                    <div>
                      <p className="font-bold">{std.name}</p>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {std.usn}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{std.branch}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{std.cgpa}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-rose-600">
                      {std.metrics.employabilityIndex}/100
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {std.weakSkills ? std.weakSkills.slice(0, 2).join(", ") : "DSA & Confidence"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="danger" size="sm">
                      {std.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="xs"
                      icon={Send}
                      onClick={() => handleNotifyStudent(std.name)}
                    >
                      Alert Counselor
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
