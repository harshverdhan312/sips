import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Code2,
  HelpCircle,
  FileCheck2
} from "lucide-react";
import { superAdminService } from "../../services/superAdminService";
import { useNotifications } from "../../context/NotificationContext";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";

export function SuperAdminDashboard() {
  const { showSuccess, showError } = useNotifications();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalInstitutions: 0,
    pendingApprovals: 0,
    activeInstitutions: 0,
    rejectedInstitutions: 0,
    totalDepartments: 0,
    totalStudents: 0
  });
  const [pendingColleges, setPendingColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, pendingRes] = await Promise.all([
        superAdminService.getStats().catch(() => ({ stats: {} })),
        superAdminService.getPendingColleges().catch(() => ({ colleges: [] }))
      ]);

      if (statsRes.stats) setStats(statsRes.stats);
      if (pendingRes.colleges) setPendingColleges(pendingRes.colleges.slice(0, 5));
    } catch (err) {
      console.error("Super admin dashboard load error:", err);
      showError("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-400/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              SIPS Root Super Administrator
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Platform Master Console
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Verify institution registrations, dispatch portal credentials, and govern universal global question banks across all campus tenants.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={loadDashboard}
              loading={loading}
              className="border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={BookOpen}
              onClick={() => navigate("/super-admin/questions")}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Global Questions
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Approvals */}
        <Card className="p-5 flex items-center gap-4 border-amber-200/60 bg-gradient-to-br from-amber-50/40 to-white">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Approvals</p>
            <p className="text-2xl font-black text-slate-900">{stats.pendingApprovals}</p>
            <p className="text-[11px] text-slate-500">Colleges requesting access</p>
          </div>
        </Card>

        {/* Active Colleges */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Colleges</p>
            <p className="text-2xl font-black text-slate-900">{stats.activeInstitutions}</p>
            <p className="text-[11px] text-slate-500">Operational campus tenants</p>
          </div>
        </Card>

        {/* Academic Departments */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Departments</p>
            <p className="text-2xl font-black text-slate-900">{stats.totalDepartments}</p>
            <p className="text-[11px] text-slate-500">Provisioned departmental units</p>
          </div>
        </Card>

        {/* Total Students */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Candidates</p>
            <p className="text-2xl font-black text-slate-900">{stats.totalStudents}</p>
            <p className="text-[11px] text-slate-500">Across all institutions</p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Pending Approvals & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Requests Table / Card */}
        <div className="lg:col-span-2 space-y-4">
          <Card padding="p-0" className="overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  College Onboarding Queue
                </h3>
                <p className="text-xs text-slate-500">
                  Colleges that completed registration and require administrator verification.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={ArrowRight}
                onClick={() => navigate("/super-admin/approvals")}
                className="text-xs"
              >
                View All ({stats.pendingApprovals})
              </Button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                Loading pending queue...
              </div>
            ) : pendingColleges.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">All caught up!</p>
                <p className="text-xs text-slate-400 mt-0.5">No pending college onboarding applications at this time.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingColleges.map((inst) => (
                  <div key={inst.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">{inst.name}</span>
                        {inst.code && (
                          <Badge variant="secondary" size="xs">
                            {inst.code}
                          </Badge>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          PENDING APPROVAL
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Admin: <strong className="text-slate-700">{inst.adminUsername}</strong></span>
                        <span>•</span>
                        <span>{inst.officialEmail}</span>
                        {inst.website && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 truncate max-w-[150px]">{inst.website}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => navigate(`/super-admin/approvals?collegeId=${inst.id}`)}
                      className="shrink-0 bg-indigo-600 hover:bg-indigo-700"
                    >
                      Review & Approve
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Action Side Panel */}
        <div className="space-y-4">
          <Card padding="p-5" className="bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border-purple-100">
            <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              Global Question Governance
            </h4>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Curate benchmark coding challenges and standardized MCQs visible to all colleges and assessments platform-wide.
            </p>
            <div className="space-y-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-between bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => navigate("/super-admin/questions?action=new")}
              >
                <span>Add Global Question</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                onClick={() => navigate("/super-admin/questions")}
              >
                <span>Browse Universal Question Bank</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          <Card padding="p-5">
            <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              Institutions Directory
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Inspect all registered colleges, view academic structures, and toggle tenant statuses.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              onClick={() => navigate("/super-admin/institutions")}
            >
              <span>View Directory</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
