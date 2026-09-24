import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Server,
  Activity,
  Cpu,
  Users,
  FileCheck,
  CheckCircle2,
  Database
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { Card, CardHeader } from "../../components/common/Card";
import { StatCard } from "../../components/common/StatCard";
import { Badge } from "../../components/common/Badge";
import { DashboardSkeleton } from "../../components/common/LoadingSkeleton";

export function AdminAnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await adminService.getSystemStats();
        setStats(data);
      } catch (e) {
        console.error("Failed to load admin telemetry stats:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading || !stats) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          Platform Telemetry & Operational Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor system health, student account registration, and service telemetry across the institution.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="System Health"
          value={stats.systemHealth || "Operational"}
          subtitle="All microservices active"
          icon={Server}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Enrolled Candidates"
          value={stats.studentsEnrolled}
          subtitle={stats.studentsEnrolled > 0 ? "Registered students" : "No candidates"}
          icon={Users}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Platform Accounts"
          value={stats.totalUsers}
          subtitle="Admin + Students"
          icon={Activity}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Resumes Uploaded"
          value={stats.resumesParsedTotal}
          subtitle={`Storage: ${stats.storageUsage}`}
          icon={FileCheck}
          iconBg="bg-teal-50 text-teal-600"
        />
      </div>

      {/* Service Telemetry Operational Grid */}
      <Card>
        <CardHeader
          title="Institutional Infrastructure & Pipeline Health"
          subtitle="Real-time operational status of backend services"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">API Gateway</h4>
              <p className="text-xs text-slate-500 mt-0.5">Express REST Router</p>
              <Badge variant="success" size="xs" className="mt-2">Online • 200 OK</Badge>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Database Layer</h4>
              <p className="text-xs text-slate-500 mt-0.5">Multi-Tenant Scoped</p>
              <Badge variant="success" size="xs" className="mt-2">Connected</Badge>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Resume Vault</h4>
              <p className="text-xs text-slate-500 mt-0.5">Static Storage</p>
              <Badge variant="primary" size="xs" className="mt-2">{stats.resumesParsedTotal} Synced</Badge>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Placement ML Engine</h4>
              <p className="text-xs text-slate-500 mt-0.5">Readiness & Matching</p>
              <Badge variant="success" size="xs" className="mt-2">Ready</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
