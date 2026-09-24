import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Users,
  GraduationCap,
  Building2,
  Activity,
  Server,
  Database,
  FileCheck,
  Clock,
  ArrowRight,
  HardDrive
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { Card, CardHeader } from "../../components/common/Card";
import { StatCard } from "../../components/common/StatCard";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { DashboardSkeleton } from "../../components/common/LoadingSkeleton";
import { useNotifications } from "../../context/NotificationContext";

export function AdminDashboard() {
  const navigate = useNavigate();
  const { addToast } = useNotifications();
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [st, logs] = await Promise.all([
          adminService.getSystemStats(),
          adminService.getAuditLogs()
        ]);
        setStats(st);
        setAuditLogs(logs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !stats) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-slate-900 text-white">
              Institutional Admin Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            System & Infrastructure Health
          </h1>
          <p className="text-sm text-slate-500">
            Monitor platform security, user directories, mock interview simulations, and audit records.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/settings")}
          >
            System Settings
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Users}
            onClick={() => navigate("/admin/users")}
          >
            Manage Users
          </Button>
        </div>
      </div>

      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Platform Users"
          value={stats.totalUsers}
          subtitle={stats.activeToday > 0 ? `${stats.activeToday} active` : "Platform active"}
          icon={Users}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Students Enrolled"
          value={stats.studentsEnrolled}
          subtitle={stats.studentsEnrolled > 0 ? "Registered students" : "No students"}
          icon={GraduationCap}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Placement Officers"
          value={stats.placementOfficers}
          subtitle="Placement admin"
          icon={Building2}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Resumes Parsed"
          value={stats.resumesParsedTotal}
          subtitle={stats.resumesParsedTotal > 0 ? `${stats.resumesParsedTotal} uploaded` : "No resumes"}
          icon={FileCheck}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="AI Mock Drills"
          value={stats.mockInterviewsCompleted}
          subtitle="Simulations"
          icon={Activity}
          iconBg="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="System Health"
          value={stats.systemHealth || "Operational"}
          subtitle={`Status: ${stats.apiLatency}`}
          icon={Server}
          iconBg="bg-teal-50 text-teal-600"
        />
      </div>

      {/* 2-Column Row: Infrastructure Status & Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Services Status */}
        <Card className="flex flex-col justify-between">
          <CardHeader
            title="Service & Microservice Telemetry"
            subtitle="Real-time operational status"
          />

          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-800">ATS Resume Semantic Engine</span>
              </div>
              <Badge variant="success" size="sm">Healthy</Badge>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-800">Mock Speech-to-Text Pipeline</span>
              </div>
              <Badge variant="success" size="sm">Healthy</Badge>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-800">Peer Matching Graph Engine</span>
              </div>
              <Badge variant="success" size="sm">Healthy</Badge>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-800">Vector Knowledge Database</span>
              </div>
              <Badge variant="success" size="sm">Healthy</Badge>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5" /> Storage: {stats.storageUsage}
            </span>
            <span className="text-emerald-600 font-semibold">Zero Incidents</span>
          </div>
        </Card>

        {/* Audit Trail Log Stream */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Institutional Security & Audit Trail"
            subtitle="Immutable logs recording critical platform administrative actions"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addToast("Full audit log exported for compliance review.", "info")}
              >
                Download Audit Archive
              </Button>
            }
          />

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-slate-400">• Target: {log.target}</span>
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      Initiated by <strong className="text-slate-700">{log.actor}</strong>
                    </p>
                  </div>
                </div>

                <span className="text-slate-400 font-mono text-[11px] shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
