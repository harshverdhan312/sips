import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Layers,
  Users,
  Briefcase,
  Plus,
  ArrowRight,
  ShieldCheck,
  Globe,
  Mail,
  Phone,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { institutionService } from "../../services/institutionService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";

export function InstitutionDashboard() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptRes, profRes] = await Promise.all([
        institutionService.getDepartments().catch(() => ({ departments: [] })),
        institutionService.getProfile().catch(() => ({ institution: null }))
      ]);
      setDepartments(deptRes.departments || []);
      setProfile(profRes.institution || null);
    } catch (err) {
      console.error("Failed to load institution data:", err);
      showError("Could not load institution overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalDepts = departments.length;
  const activeDepts = departments.filter((d) => d.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              University Central Administration
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {profile?.name || user?.institutionName || "University Administration"}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Manage academic departments, authorize departmental placement cells, and oversee campus-wide career intelligence.
            </p>
          </div>

          <div className="flex items-center gap-3">

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => navigate("/institution/departments?action=new")}
            >
              Add Department
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Departments</p>
            <p className="text-2xl font-black text-slate-900">{totalDepts}</p>
            <p className="text-[11px] text-slate-500">Configured academic units</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Units</p>
            <p className="text-2xl font-black text-emerald-600">{activeDepts}</p>
            <p className="text-[11px] text-slate-500">Autonomous placement cells</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Institution Code</p>
            <p className="text-2xl font-black text-slate-900">{profile?.code || "UNIV"}</p>
            <p className="text-[11px] text-slate-500 truncate">{profile?.city ? `${profile.city}, ${profile.state}` : "Campus Location"}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tenant Boundary</p>
            <p className="text-sm font-bold text-slate-900 truncate">Isolated Hierarchy</p>
            <p className="text-[11px] text-purple-600 font-semibold">Strict Data Separation</p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Departments Directory Preview & University Identity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Departments Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="Academic Departments"
              subtitle="Department credentials allow autonomous placement operation"
              action={
                <Link
                  to="/institution/departments"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  View All ({departments.length}) <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />

            {departments.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Layers className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No departments configured yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Create departments such as BCA, BBA, MBA, or CSE. Each department receives its own login credentials to manage students and recruitment drives.
                </p>
                <Button
                  size="sm"
                  icon={Plus}
                  onClick={() => navigate("/institution/departments?action=new")}
                >
                  Create First Department
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Programs</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {departments.slice(0, 5).map((dept) => (
                      <tr key={dept._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs">
                              {(dept.code || dept.name || "D").substring(0, 3).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{dept.name}</p>
                              {dept.code && <p className="text-[10px] text-slate-400">Code: {dept.code}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-600">
                          {dept.username}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {dept.programs && dept.programs.length > 0
                            ? dept.programs.map(p => typeof p === 'object' ? p.name : p).join(", ")
                            : "General"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={dept.status === "ACTIVE" ? "success" : "neutral"}
                            className="text-[10px]"
                          >
                            {dept.status || "ACTIVE"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to="/institution/departments"
                            className="font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Institution Details */}
        <div className="space-y-4">
          <Card padding="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">University Identity</h3>
              <Link
                to="/institution/profile"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Edit Profile
              </Link>
            </div>

            <div className="pt-4 space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Official Email</p>
                <p className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {profile?.officialEmail || user?.email || "—"}
                </p>
              </div>

              {profile?.website && (
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Website</p>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-indigo-600 hover:underline flex items-center gap-1.5 mt-0.5"
                  >
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    {profile.website}
                  </a>
                </div>
              )}

              {profile?.phone && (
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Telephone</p>
                  <p className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {profile.phone}
                  </p>
                </div>
              )}

              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Campus Address</p>
                <p className="font-medium text-slate-700 mt-0.5">
                  {[profile?.address, profile?.city, profile?.state, profile?.country]
                    .filter(Boolean)
                    .join(", ") || "Main Campus"}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="p-5" className="bg-gradient-to-br from-indigo-50/60 to-purple-50/40 border-indigo-100">
            <h4 className="font-bold text-slate-900 text-xs mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> Multi-Unit Architecture
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              University Admin can provision independent department accounts. Department admins log in using the <strong>University / Department Sign In</strong> tab to manage their candidates, campus drives, and candidate analytics.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
