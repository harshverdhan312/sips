import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Globe,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Power,
  ShieldCheck,
  GraduationCap
} from "lucide-react";
import { superAdminService } from "../../services/superAdminService";
import { useNotifications } from "../../context/NotificationContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";

export function InstitutionsDirectoryPage() {
  const { showSuccess, showError } = useNotifications();

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      const res = await superAdminService.getAllColleges({
        status: statusFilter,
        search
      });
      setColleges(res.colleges || []);
    } catch (err) {
      console.error("Error loading institutions directory:", err);
      showError("Failed to load institutions directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstitutions();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadInstitutions();
  };

  const handleToggleStatus = async (college) => {
    try {
      setActionLoadingId(college.id);
      const res = await superAdminService.toggleCollegeStatus(college.id);
      showSuccess(res.message || "College status updated successfully");
      loadInstitutions();
    } catch (err) {
      showError(err.message || "Failed to update college status");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            Campus Network Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Institutions Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Comprehensive registry of all university and college tenants operating on the SIPS Career Intelligence platform.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={loadInstitutions}
          loading={loading}
        >
          Refresh Directory
        </Button>
      </div>

      {/* Filters & Search */}
      <Card padding="p-4" className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {["ALL", "ACTIVE", "INACTIVE", "PENDING_APPROVAL", "REJECTED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {st === "ALL" ? "All Colleges" : st.replace("_", " ")}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search directory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
          />
        </form>
      </Card>

      {/* Directory Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-600" />
          Loading institutions...
        </div>
      ) : colleges.length === 0 ? (
        <Card padding="p-16" className="text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No institutions found</h3>
          <p className="text-xs text-slate-400 mt-1">No colleges match your current search and filter settings.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {colleges.map((college) => {
            const isActive = college.status === "ACTIVE";
            const isPending = college.status === "PENDING_APPROVAL";
            const isInactive = college.status === "INACTIVE";
            const isRejected = college.status === "REJECTED";

            return (
              <Card key={college.id} padding="p-5" className="flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 tracking-tight">{college.name}</h3>
                        {college.code && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700">
                            {college.code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Admin: <strong className="text-slate-800">{college.adminUsername}</strong>
                      </p>
                    </div>

                    <div>
                      {isActive && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          ACTIVE
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          PENDING
                        </span>
                      )}
                      {isInactive && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                          INACTIVE
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          REJECTED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{college.departmentCount || 0} Departments</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <GraduationCap className="w-4 h-4 text-purple-500 shrink-0" />
                      <span>{college.studentCount || 0} Students</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{college.officialEmail}</span>
                    </div>
                    {college.website && (
                      <div className="flex items-center gap-2 truncate">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-purple-600">{college.website}</span>
                      </div>
                    )}
                    {college.address && (
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{college.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Registered {new Date(college.createdAt).toLocaleDateString()}
                  </span>

                  {(isActive || isInactive) && (
                    <Button
                      variant={isActive ? "outline" : "primary"}
                      size="xs"
                      icon={Power}
                      onClick={() => handleToggleStatus(college)}
                      loading={actionLoadingId === college.id}
                      className={isActive ? "text-slate-600 hover:text-rose-600" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                    >
                      {isActive ? "Deactivate" : "Activate"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
