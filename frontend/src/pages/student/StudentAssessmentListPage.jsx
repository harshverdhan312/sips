import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Search,
  Code2,
  BrainCircuit,
  Binary,
  Layers,
  Sparkles,
  CheckCircle2,
  Play
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { practiceService } from "../../services/practiceService";
import { useAuth } from "../../context/AuthContext";

export function StudentAssessmentListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assessments, setAssessments] = useState(() => practiceService.getCachedAvailableAssessments() || []);
  const [loading, setLoading] = useState(() => !(practiceService.getCachedAvailableAssessments()?.length > 0));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAssessments = async ({ forceRefresh = false } = {}) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else if (assessments.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await practiceService.getAvailableAssessments({ forceRefresh });
      setAssessments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load assessments:", err);
      if (assessments.length === 0) {
        setError(err.message || "Unable to retrieve assessments.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const filteredAssessments = assessments.filter((a) => {
    if (typeFilter !== "ALL" && a.type !== typeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (a.title || "").toLowerCase().includes(q);
      const matchDesc = (a.description || "").toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Assessments
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {user?.collegeName || "Practice & Screening Hub"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            Assessments & Screening Tests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Standardized aptitude, technical, and coding evaluations with automated scoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAssessments({ forceRefresh: true })}
            disabled={isRefreshing}
            className="flex items-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {["ALL", "PRACTICE_SET", "PLACEMENT_ASSESSMENT", "MOCK_ASSESSMENT"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === type
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type === "ALL"
                ? "All Types"
                : type === "PRACTICE_SET"
                ? "Practice Sets"
                : type === "PLACEMENT_ASSESSMENT"
                ? "Placement Drives"
                : "Mock Tests"}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assessments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 animate-pulse bg-white border border-slate-200">
              <div className="h-4 bg-slate-200 rounded-md w-1/3 mb-3" />
              <div className="h-6 bg-slate-200 rounded-md w-3/4 mb-4" />
              <div className="h-16 bg-slate-100 rounded-lg mb-4" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-8 bg-slate-200 rounded-md w-24" />
                <div className="h-8 bg-slate-200 rounded-md w-28" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredAssessments.length === 0 ? (
        <Card className="p-12 text-center bg-white border-dashed border-2 border-slate-200 rounded-2xl">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Assessments Available</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            There are currently no published assessments matching your search filters. Check back soon for upcoming campus drives and tests.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAssessments.map((assessment) => {
            const myAttempt = assessment.myAttempt;
            const hasStarted = Boolean(myAttempt);
            const isCompleted = myAttempt && ["SUBMITTED", "FINALIZED", "TIMED_OUT"].includes(myAttempt.status);
            const isInProgress = myAttempt && myAttempt.status === "IN_PROGRESS";

            return (
              <Card
                key={assessment.id}
                className="p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200 border border-slate-200/90 hover:border-indigo-300 relative group overflow-hidden bg-white"
              >
                {/* Top status bar */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {assessment.type === "PLACEMENT_ASSESSMENT"
                          ? "Campus Drive"
                          : assessment.type === "MOCK_ASSESSMENT"
                          ? "Mock Test"
                          : "Practice Set"}
                      </span>
                      {assessment.sipsDriveId && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          Drive Verified
                        </span>
                      )}
                      {!assessment.collegeId && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                          Global
                        </span>
                      )}
                    </div>

                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    ) : isInProgress ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        In Progress
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 leading-snug">
                    {assessment.title}
                  </h3>

                  {assessment.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                      {assessment.description}
                    </p>
                  )}

                  {/* Metrics grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                      <span className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {assessment.durationMinutes} mins
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Questions</span>
                      <span className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1 mt-0.5">
                        <Layers className="w-3 h-3 text-slate-400" />
                        {assessment.totalQuestions || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Marks</span>
                      <span className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1 mt-0.5">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        {Number(assessment.totalMarks || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Section badges */}
                  <div className="flex items-center gap-2 mb-4 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-400">Sections:</span>
                    {assessment.sectionBreakdown?.APTITUDE?.count > 0 && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                        <BrainCircuit className="w-3 h-3" /> Aptitude ({assessment.sectionBreakdown.APTITUDE.count})
                      </span>
                    )}
                    {assessment.sectionBreakdown?.TECHNICAL?.count > 0 && (
                      <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 px-2 py-0.5 rounded-md border border-sky-200">
                        <Binary className="w-3 h-3" /> Technical ({assessment.sectionBreakdown.TECHNICAL.count})
                      </span>
                    )}
                    {assessment.sectionBreakdown?.CODING?.count > 0 && (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Code2 className="w-3 h-3" /> Coding ({assessment.sectionBreakdown.CODING.count})
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  {isCompleted ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/student/assessments/${assessment.id}/result/${myAttempt.id}`)}
                      className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-semibold"
                    >
                      View Detailed Result
                    </Button>
                  ) : isInProgress ? (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/student/assessments/${assessment.id}/attempt/${myAttempt.id}`)}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Resume Test
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/student/assessments/${assessment.id}`)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2"
                    >
                      View & Start Test
                      <ArrowRight className="w-4 h-4" />
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
