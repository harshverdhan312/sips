import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  AlertCircle,
  Download,
  Eye,
  Trophy,
  Users,
  CheckCircle2,
  Clock,
  Code2,
  BookOpen,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X,
  FileCode2,
  Check,
  Building,
  Briefcase
} from "lucide-react";
import { practiceService } from "../../services/practiceService";
import { adminService } from "../../services/adminService";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { useNotifications } from "../../context/NotificationContext";

export function AssessmentResultsPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/placement") ? "/placement" : "/admin";
  const { addToast } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [assessment, setAssessment] = useState(null);
  const [metrics, setMetrics] = useState({
    totalAttempts: 0,
    submittedCount: 0,
    inProgressCount: 0,
    timedOutCount: 0,
    averageScore: 0,
    highestScore: 0,
    passCount: 0,
    passRate: 0
  });
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [studentsMap, setStudentsMap] = useState({});

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Candidate Drill-down Modal State
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [candidateDetail, setCandidateDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Load student users map for resolving names, roll numbers, emails
  useEffect(() => {
    let isMounted = true;
    adminService.getUsers()
      .then((users) => {
        if (!isMounted || !Array.isArray(users)) return;
        const map = {};
        users.forEach((u) => {
          const id = u.id || u._id;
          if (id) map[id] = u;
        });
        setStudentsMap(map);
      })
      .catch((err) => {
        console.warn("Could not preload students map:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const getStudentInfo = useCallback((studentId) => {
    if (!studentId) {
      return {
        name: "Student Candidate",
        email: "",
        rollNo: "",
        branch: "",
        avatar: null,
        initials: "ST"
      };
    }

    const student = studentsMap[studentId];
    if (student) {
      const name = student.name || "Student Candidate";
      const initials = name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "ST";

      return {
        name,
        email: student.email || "",
        rollNo: student.rollNo || student.usn || "",
        branch: student.department || student.branch || "",
        avatar: student.avatar || student.profileImageUrl || null,
        initials
      };
    }

    return {
      name: `Student (${studentId.substring(0, 8)}...)`,
      email: "",
      rollNo: studentId.substring(0, 8),
      branch: "",
      avatar: null,
      initials: "ST"
    };
  }, [studentsMap]);

  const fetchResults = useCallback(async () => {
    if (!assessmentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await practiceService.getAssessmentResults(assessmentId, {
        page,
        limit: 20,
        search,
        status: statusFilter
      });

      const data = res?.data || res;
      if (data) {
        setAssessment(data.assessment || null);
        setMetrics(data.metrics || {});
        setCandidates(data.candidates || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (err) {
      console.error("Failed to load assessment results:", err);
      setError(err.message || "Failed to load assessment candidate results.");
      if (addToast) {
        addToast({
          type: "error",
          title: "Failed to load results",
          message: err.message || "Please check your network connection."
        });
      }
    } finally {
      setLoading(false);
    }
  }, [assessmentId, page, search, statusFilter, addToast]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResults();
  };

  const handleInspectCandidate = async (attemptId) => {
    setSelectedAttemptId(attemptId);
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await practiceService.getAssessmentCandidateDetail(assessmentId, attemptId);
      const data = res?.data || res;
      setCandidateDetail(data);
    } catch (err) {
      console.error("Failed to load candidate details:", err);
      if (addToast) {
        addToast({
          type: "error",
          title: "Failed to load scorecard",
          message: err.message || "Could not retrieve candidate attempt."
        });
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!candidates || candidates.length === 0) {
      alert("No candidate data available to export.");
      return;
    }

    const headers = [
      "Rank",
      "Student Name",
      "Roll Number",
      "Email",
      "Branch",
      "Student ID",
      "Status",
      "Aptitude Score",
      "Technical Score",
      "Coding Score",
      "Total Score",
      "Total Marks",
      "Percentage",
      "Started At",
      "Submitted At"
    ];

    const rows = candidates.map((c) => {
      const info = getStudentInfo(c.studentId);
      return [
        c.rank,
        `"${info.name.replace(/"/g, '""')}"`,
        `"${info.rollNo.replace(/"/g, '""')}"`,
        `"${info.email.replace(/"/g, '""')}"`,
        `"${info.branch.replace(/"/g, '""')}"`,
        `"${c.studentId}"`,
        c.status,
        c.aptitudeScore,
        c.technicalScore,
        c.codingScore,
        c.totalScore,
        c.totalMarks,
        `${c.percentage}%`,
        c.startedAt ? `"${new Date(c.startedAt).toLocaleString()}"` : "N/A",
        c.submittedAt ? `"${new Date(c.submittedAt).toLocaleString()}"` : "N/A"
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `assessment_${assessmentId}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !assessment) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-600">Loading Candidate Assessment Results...</p>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Unable to Load Results</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <Button variant="outline" size="sm" onClick={() => navigate(`${basePath}/assessments`)}>
          Back to Assessments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`${basePath}/assessments`)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Assessments</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
            {assessment?.title || "Assessment Results"}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`${basePath}/assessments/${assessmentId}`)}
            className="flex items-center gap-1.5"
          >
            <span>Edit Blueprint</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCsv}
            disabled={candidates.length === 0}
            className="flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </Button>
        </div>
      </div>

      {/* Header Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="primary" size="sm">{assessment?.type || "PLACEMENT_ASSESSMENT"}</Badge>
              <Badge variant={assessment?.status === "PUBLISHED" ? "success" : "neutral"} size="sm">
                {assessment?.status || "PUBLISHED"}
              </Badge>
              <span className="text-xs text-slate-500 font-mono">ID: {assessment?.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Candidate Results & Leaderboard
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Live scoring, candidate answer inspection, and performance distribution for {assessment?.title}.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Duration</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{assessment?.durationMinutes || 60}m</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Marks</div>
              <div className="text-base font-bold text-indigo-600 mt-0.5">{assessment?.totalMarks ?? 0} pts</div>
            </div>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Total Candidates */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold">Total Candidates</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{metrics.totalAttempts || 0}</div>
            <div className="text-[11px] text-slate-500">
              {metrics.submittedCount || 0} submitted • {metrics.inProgressCount || 0} in progress
            </div>
          </div>

          {/* Average Score */}
          <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between text-emerald-800 text-xs">
              <span className="font-semibold">Average Score</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-950">
              {metrics.averageScore || 0} <span className="text-xs font-normal text-emerald-700">/ {assessment?.totalMarks || 100}</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">
              Mean batch performance
            </div>
          </div>

          {/* Highest Score */}
          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1">
            <div className="flex items-center justify-between text-amber-800 text-xs">
              <span className="font-semibold">Highest Score</span>
              <Trophy className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-950">
              {metrics.highestScore || 0} <span className="text-xs font-normal text-amber-700">pts</span>
            </div>
            <div className="text-[11px] text-amber-700 font-medium">
              Top candidate achievement
            </div>
          </div>

          {/* Pass Rate */}
          <div className="p-4 bg-sky-50/70 rounded-xl border border-sky-200 space-y-1">
            <div className="flex items-center justify-between text-sky-800 text-xs">
              <span className="font-semibold">Pass Rate (≥50%)</span>
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-bold text-sky-950">{metrics.passRate || 0}%</div>
            <div className="text-[11px] text-sky-700 font-medium">
              {metrics.passCount || 0} qualified candidates
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidates by name, roll number, or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted / Finalized</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="TIMED_OUT">Timed Out</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
              setPage(1);
            }}
          >
            Reset
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchResults}
            disabled={loading}
            className="p-2"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Candidates Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-600">Loading candidate submissions...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-semibold text-slate-800">No candidate attempts found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No students have participated in this assessment matching your active filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Rank</th>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center">Aptitude</th>
                  <th className="px-4 py-3.5 text-center">Technical</th>
                  <th className="px-4 py-3.5 text-center">Coding</th>
                  <th className="px-5 py-3.5 text-right">Total Score</th>
                  <th className="px-5 py-3.5 text-right">Submitted At</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((c) => {
                  const isSubmitted = c.status === "SUBMITTED" || c.status === "FINALIZED";
                  const isPassed = c.percentage >= 50;

                  return (
                    <tr key={c.attemptId} className="hover:bg-slate-50/60 transition-colors">
                      {/* Rank */}
                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center gap-1.5 font-bold font-mono text-xs">
                          {c.rank === 1 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">1</span>
                          ) : c.rank === 2 ? (
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold">2</span>
                          ) : c.rank === 3 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-900 flex items-center justify-center font-bold">3</span>
                          ) : (
                            <span className="text-slate-400 pl-2">#{c.rank}</span>
                          )}
                        </div>
                      </td>

                      {/* Student Info */}
                      <td className="px-5 py-4 align-middle">
                        {(() => {
                          const info = getStudentInfo(c.studentId);
                          return (
                            <div className="flex items-center gap-3">
                              {info.avatar ? (
                                <img
                                  src={info.avatar}
                                  alt={info.name}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                  {info.initials}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                  {info.name}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 flex-wrap">
                                  {info.rollNo && (
                                    <span className="font-mono font-medium text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80">
                                      {info.rollNo}
                                    </span>
                                  )}
                                  {info.email && (
                                    <span className="text-slate-400 text-[11px] truncate max-w-[170px]">
                                      {info.email}
                                    </span>
                                  )}
                                  {info.branch && (
                                    <span className="text-slate-400 text-[11px] hidden md:inline">
                                      • {info.branch}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 align-middle">
                        <Badge
                          variant={isSubmitted ? "success" : c.status === "IN_PROGRESS" ? "warning" : "neutral"}
                          size="sm"
                        >
                          {c.status}
                        </Badge>
                      </td>

                      {/* Section Scores */}
                      <td className="px-4 py-4 align-middle text-center font-semibold text-xs text-emerald-800">
                        {c.aptitudeScore}
                      </td>

                      <td className="px-4 py-4 align-middle text-center font-semibold text-xs text-sky-800">
                        {c.technicalScore}
                      </td>

                      <td className="px-4 py-4 align-middle text-center font-semibold text-xs text-indigo-800">
                        {c.codingScore}
                      </td>

                      {/* Total Score */}
                      <td className="px-5 py-4 align-middle text-right">
                        <div className="font-bold text-sm text-slate-900">
                          {c.totalScore} <span className="text-xs font-normal text-slate-400">/ {c.totalMarks}</span>
                        </div>
                        <div className={`text-xs font-bold ${isPassed ? "text-emerald-700" : "text-slate-500"}`}>
                          {c.percentage}%
                        </div>
                      </td>

                      {/* Submitted At */}
                      <td className="px-5 py-4 align-middle text-right text-xs text-slate-500">
                        {c.submittedAt ? (
                          <div>
                            <div className="font-medium text-slate-700">{new Date(c.submittedAt).toLocaleDateString()}</div>
                            <div className="text-[11px] text-slate-400">{new Date(c.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        ) : (
                          <span className="italic text-slate-400">In Progress</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-4 align-middle text-right">
                        <button
                          onClick={() => handleInspectCandidate(c.attemptId)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Inspect Candidate Scorecard"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Scorecard</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && candidates.length > 0 && (
          <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{(page - 1) * 20 + 1}</span> to{" "}
              <span className="font-semibold text-slate-800">{Math.min(page * 20, pagination.total)}</span> of{" "}
              <span className="font-semibold text-slate-800">{pagination.total}</span> candidates
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold text-slate-700 px-2">
                Page {page} of {pagination.totalPages || 1}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
                disabled={page >= (pagination.totalPages || 1)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Candidate Scorecard Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setCandidateDetail(null);
        }}
        title="Candidate Scorecard & Answer Inspection"
        maxWidth="max-w-4xl"
      >
        {detailLoading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading Candidate Scorecard & Code Submissions...</p>
          </div>
        ) : !candidateDetail ? (
          <div className="py-12 text-center text-xs text-slate-400">Could not load candidate attempt.</div>
        ) : (
          <div className="space-y-6">
            {/* Candidate Header Stats */}
            {(() => {
              const modalInfo = getStudentInfo(candidateDetail.attempt?.studentId);
              return (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {modalInfo.avatar ? (
                      <img
                        src={modalInfo.avatar}
                        alt={modalInfo.name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {modalInfo.initials}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm text-slate-900">{modalInfo.name}</span>
                        <Badge variant={candidateDetail.attempt?.status === "SUBMITTED" || candidateDetail.attempt?.status === "FINALIZED" ? "success" : "neutral"} size="sm">
                          {candidateDetail.attempt?.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                        {modalInfo.rollNo && (
                          <span className="font-mono font-medium text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {modalInfo.rollNo}
                          </span>
                        )}
                        {modalInfo.email && <span>{modalInfo.email}</span>}
                        {modalInfo.branch && <span>• {modalInfo.branch}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0 bg-white px-3.5 py-2 rounded-xl border border-slate-200">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Score</div>
                      <div className="text-lg font-bold text-indigo-600">
                        {candidateDetail.attempt?.totalScore} <span className="text-xs font-normal text-slate-400">/ {candidateDetail.attempt?.totalMarks}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Questions Breakdown List */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-600" />
                <span>Question-by-Question Response Audit</span>
              </h3>

              <div className="space-y-3">
                {candidateDetail.questionBreakdown?.map((q, idx) => {
                  const isMcq = q.type === "APTITUDE" || q.type === "TECHNICAL";
                  const isCoding = q.type === "CODING";
                  const isCorrect = q.response?.isCorrect;

                  return (
                    <div
                      key={q.questionVersionId || idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs text-slate-400 font-mono">Q{q.order || idx + 1}</span>
                          <span className="font-semibold text-xs text-slate-900">{q.title}</span>
                          <Badge variant="neutral" size="sm">{q.section}</Badge>
                          <Badge variant={q.difficulty === "EASY" ? "success" : q.difficulty === "MEDIUM" ? "warning" : "danger"} size="sm">
                            {q.difficulty}
                          </Badge>
                        </div>

                        <div className="text-right shrink-0">
                          {isMcq && q.response && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}>
                              {isCorrect ? `+${q.response.marksAwarded} marks (Correct)` : `0 marks (Incorrect)`}
                            </span>
                          )}
                          {isCoding && q.submission && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                              {q.submission.score} pts ({q.submission.passedTestCases}/{q.submission.totalTestCases} Tests Passed)
                            </span>
                          )}
                          {!q.isAnswered && (
                            <span className="text-xs text-slate-400 italic">Unanswered / Skipped</span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{q.statement}</p>

                      {/* MCQ Response Breakdown */}
                      {isMcq && q.options && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <span className="font-semibold text-slate-500">Candidate Choice: </span>
                              <span className={`font-bold ${isCorrect ? "text-emerald-700" : "text-rose-600"}`}>
                                {q.response?.chosenOptionId || "None (Skipped)"}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-500">Correct Answer Key: </span>
                              <span className="font-bold text-emerald-700">
                                {q.correctAnswer?.optionId || "N/A"}
                              </span>
                            </div>
                          </div>

                          {q.explanation && (
                            <div className="pt-2 border-t border-slate-200 text-slate-500 text-[11px] leading-relaxed">
                              <strong>Explanation:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Coding Submission Breakdown */}
                      {isCoding && q.submission && (
                        <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs space-y-2">
                          <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-1.5">
                            <span>Language: {q.submission.language || "Python"}</span>
                            <span>Status: {q.submission.status}</span>
                          </div>
                          <pre className="overflow-x-auto p-2 bg-slate-950 rounded text-slate-100 text-[11px] leading-relaxed">
                            {q.submission.code || "// No code submitted"}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
