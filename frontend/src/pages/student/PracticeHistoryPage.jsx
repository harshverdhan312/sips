import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  History,
  ArrowLeft,
  Filter,
  CheckCircle2,
  Clock,
  Code2,
  BrainCircuit,
  Binary,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  Trophy,
  ExternalLink
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { practiceService } from "../../services/practiceService";

export function PracticeHistoryPage() {
  const navigate = useNavigate();

  const [historyData, setHistoryData] = useState({ attempts: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await practiceService.getPracticeHistory({
        category,
        status,
        page,
        limit
      });
      setHistoryData(data || { attempts: [], pagination: {} });
    } catch (err) {
      console.error("Failed to load practice history:", err);
      setError(err.message || "Failed to retrieve practice history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [category, status, page]);

  const attempts = historyData.attempts || [];
  const pagination = historyData.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const getCategoryIcon = (cat, type) => {
    if (type === "CODING" || cat === "CODING") return <Code2 className="w-4 h-4 text-emerald-600" />;
    if (["QUANTITATIVE", "LOGICAL", "VERBAL", "DATA_INTERPRETATION"].includes(cat)) {
      return <BrainCircuit className="w-4 h-4 text-indigo-600" />;
    }
    return <Binary className="w-4 h-4 text-sky-600" />;
  };

  const getCategoryLabel = (cat) => {
    const labels = {
      QUANTITATIVE: "Quantitative Aptitude",
      LOGICAL: "Logical Reasoning",
      VERBAL: "Verbal Ability",
      DATA_INTERPRETATION: "Data Interpretation",
      DSA: "Data Structures & Algorithms",
      OOP: "Object-Oriented Programming",
      DBMS: "Database Systems",
      OS: "Operating Systems",
      NETWORKS: "Computer Networks",
      SQL: "SQL Queries",
      CODING: "Coding Challenge"
    };
    return labels[cat] || cat;
  };

  const handleOpenAttempt = (attempt) => {
    if (attempt.status === "SUBMITTED") {
      navigate(`/student/practice/attempt/${attempt.attemptId}/result`);
    } else if (attempt.type === "CODING" || attempt.category === "CODING") {
      navigate(`/student/practice/coding/${attempt.attemptId}`);
    } else {
      navigate(`/student/practice/attempt/${attempt.attemptId}`);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="xs"
              icon={ArrowLeft}
              onClick={() => navigate("/student/practice")}
              className="text-slate-600 hover:text-slate-900"
            >
              Practice Hub
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-indigo-600" />
            Practice History & Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your past practice attempts, detailed score breakdowns, and time logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchHistory}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {[
              { id: "ALL", label: "All Types" },
              { id: "APTITUDE", label: "Aptitude" },
              { id: "TECHNICAL", label: "Technical" },
              { id: "CODING", label: "Coding" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setCategory(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  category === tab.id
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Card className="p-4 border-rose-200 bg-rose-50 text-rose-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-900">Failed to Load History</h4>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* History List Table / Cards */}
      <Card className="border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs text-slate-500">Loading your practice records...</p>
          </div>
        ) : attempts.length === 0 ? (
          <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Practice Attempts Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You haven't completed any practice sessions matching the selected filter.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={RotateCcw}
              onClick={() => navigate("/student/practice")}
            >
              Start Practice Now
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {attempts.map((attempt) => {
              const isSubmitted = attempt.status === "SUBMITTED";
              const isCoding = attempt.type === "CODING" || attempt.category === "CODING";
              const dateStr = attempt.submittedAt || attempt.startedAt || attempt.createdAt;
              const formattedDate = dateStr
                ? new Date(dateStr).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                : "Unknown";

              return (
                <div
                  key={attempt.attemptId}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                  onClick={() => handleOpenAttempt(attempt)}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getCategoryIcon(attempt.category, attempt.type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">
                          {getCategoryLabel(attempt.category)}
                        </span>
                        <Badge
                          variant={isSubmitted ? "success" : "warning"}
                          size="xs"
                        >
                          {isSubmitted ? "Completed" : "In Progress"}
                        </Badge>
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {attempt.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formattedDate}
                        </span>
                        {isCoding && attempt.codingSummary && (
                          <span className="text-indigo-600 font-medium">
                            {attempt.codingSummary.passedCount || 0} / {attempt.codingSummary.totalTestCount || 0} tests passed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    {isSubmitted ? (
                      <div className="text-left sm:text-right">
                        <div className="text-base font-extrabold text-slate-900">
                          {attempt.score} <span className="text-xs text-slate-400 font-medium">/ {attempt.totalMarks}</span>
                        </div>
                        <div className="text-xs font-bold text-emerald-600">
                          {attempt.percentage}%
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg">
                        Resume Session
                      </span>
                    )}

                    <Button
                      variant={isSubmitted ? "outline" : "primary"}
                      size="xs"
                      icon={ArrowRight}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAttempt(attempt);
                      }}
                    >
                      {isSubmitted ? "Review" : "Continue"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page <span className="font-bold text-slate-700">{pagination.page}</span> of{" "}
              <span className="font-bold text-slate-700">{pagination.totalPages}</span> (
              {pagination.total} total attempts)
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                icon={ChevronLeft}
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="xs"
                icon={ChevronRight}
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
