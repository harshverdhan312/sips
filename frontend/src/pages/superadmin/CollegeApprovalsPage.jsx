import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Globe,
  MapPin,
  ShieldCheck,
  Search,
  RefreshCw,
  Key,
  AlertCircle,
  Eye,
  Send,
  User,
  Layers
} from "lucide-react";
import { superAdminService } from "../../services/superAdminService";
import { useNotifications } from "../../context/NotificationContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";

export function CollegeApprovalsPage() {
  const { showSuccess, showError } = useNotifications();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("collegeId");

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING_APPROVAL");

  // Modals state
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadColleges = async () => {
    try {
      setLoading(true);
      const res = await superAdminService.getAllColleges({
        status: statusFilter,
        search
      });
      setColleges(res.colleges || []);
    } catch (err) {
      console.error("Error loading colleges for approval:", err);
      showError("Failed to fetch college applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColleges();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadColleges();
  };

  const openApproveModal = (college) => {
    setSelectedCollege(college);
    // Generate a default temporary password preview
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pass = "Sips@";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pass);
    setIsApproveModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedCollege) return;
    try {
      setActionLoading(true);
      const res = await superAdminService.approveCollege(selectedCollege.id, {
        tempPassword,
        loginUrl: `${window.location.origin}/login`
      });
      showSuccess(res.message || `College ${selectedCollege.name} approved successfully!`);
      setIsApproveModalOpen(false);
      setSelectedCollege(null);
      loadColleges();
    } catch (err) {
      showError(err.message || "Failed to approve college application");
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (college) => {
    setSelectedCollege(college);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!selectedCollege) return;
    try {
      setActionLoading(true);
      const res = await superAdminService.rejectCollege(selectedCollege.id, rejectReason);
      showSuccess(res.message || `College application rejected.`);
      setIsRejectModalOpen(false);
      setSelectedCollege(null);
      loadColleges();
    } catch (err) {
      showError(err.message || "Failed to reject application");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Super Administrator Verification Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            College Onboarding Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review incoming university and institute registration requests, verify domain credentials, and authorize institutional tenants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadColleges}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <Card padding="p-4" className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("PENDING_APPROVAL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "PENDING_APPROVAL"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pending Verification
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "ACTIVE"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Approved Colleges
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("REJECTED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "REJECTED"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Rejected Applications
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "ALL"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by college name, code, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
          />
        </form>
      </Card>

      {/* College List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-600" />
          Fetching college applications...
        </div>
      ) : colleges.length === 0 ? (
        <Card padding="p-16" className="text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No applications found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {statusFilter === "PENDING_APPROVAL"
              ? "There are currently no new institution registration requests waiting in the verification queue."
              : "No colleges match your filter criteria."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {colleges.map((college) => {
            const isPending = college.status === "PENDING_APPROVAL";
            const isApproved = college.status === "ACTIVE";
            const isRejected = college.status === "REJECTED";
            const isTarget = highlightId && college.id === highlightId;

            return (
              <Card
                key={college.id}
                padding="p-6"
                className={`transition-all ${
                  isTarget ? "ring-2 ring-purple-500 shadow-md" : "hover:border-slate-300"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Main Details */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">{college.name}</h3>
                      {college.code && (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-700">
                          {college.code}
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> PENDING APPROVAL
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> APPROVED & ACTIVE
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> REJECTED
                        </span>
                      )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{college.officialEmail}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Admin: <strong className="text-slate-800">{college.adminUsername || college.adminName}</strong></span>
                      </div>

                      {college.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{college.phone}</span>
                        </div>
                      )}

                      {college.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                          <a
                            href={college.website.startsWith("http") ? college.website : `https://${college.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple-600 hover:underline truncate"
                          >
                            {college.website}
                          </a>
                        </div>
                      )}

                      {college.address && (
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{college.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Accepted Domains */}
                    {college.acceptedDomains && college.acceptedDomains.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className="text-slate-400 font-semibold uppercase text-[10px]">Email Domains:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {college.acceptedDomains.map((dom) => (
                            <span key={dom} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                              @{dom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex sm:flex-col lg:flex-row items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {isPending ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={XCircle}
                          onClick={() => openRejectModal(college)}
                          className="text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={CheckCircle2}
                          onClick={() => openApproveModal(college)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Verify & Approve
                        </Button>
                      </>
                    ) : isApproved ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Key}
                          onClick={() => openApproveModal(college)}
                          className="text-xs"
                        >
                          Re-issue Password
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openApproveModal(college)}
                        className="text-xs text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        Re-evaluate & Approve
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve Modal */}
      {isApproveModalOpen && selectedCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-slate-900 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Approve College Registration</h3>
                  <p className="text-xs text-slate-300 mt-0.5">{selectedCollege.name}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">College Name:</span>
                  <strong className="text-slate-900">{selectedCollege.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Official Contact Email:</span>
                  <strong className="text-slate-900">{selectedCollege.officialEmail}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Admin ID:</span>
                  <strong className="text-slate-900 font-mono">{selectedCollege.adminUsername}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Generated Temporary Password
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
                      let pass = "Sips@";
                      for (let i = 0; i < 6; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                      setTempPassword(pass);
                    }}
                  >
                    Regenerate
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  This password will be securely dispatched to <strong>{selectedCollege.officialEmail}</strong>. On first login, the college admin will be prompted to change their password.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-start gap-2.5">
                <Send className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Approving activates the institution account and immediately sends an onboarding email with login URL and credentials.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button variant="ghost" size="sm" onClick={() => setIsApproveModalOpen(false)} disabled={actionLoading}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={handleApprove}
                  loading={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Approve & Dispatch Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && selectedCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-rose-800 to-slate-900 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Reject College Application</h3>
                  <p className="text-xs text-slate-300 mt-0.5">{selectedCollege.name}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Rejection / Remarks (Optional)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Domain mismatch with official accreditation, duplicate application..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  A rejection notice with these remarks will be emailed to <strong>{selectedCollege.officialEmail}</strong>.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button variant="ghost" size="sm" onClick={() => setIsRejectModalOpen(false)} disabled={actionLoading}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleReject}
                  loading={actionLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
