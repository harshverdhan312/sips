import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Search,
  Code2,
  BrainCircuit,
  Binary,
  Layers,
  Building
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { practiceService } from "../../services/practiceService";
import { useAuth } from "../../context/AuthContext";

export function ContestListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "LIVE" | "UPCOMING"
  const [searchQuery, setSearchQuery] = useState("");

  const fetchContests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await practiceService.getAvailableContests();
      setContests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load available contests:", err);
      setError(err.message || "Unable to retrieve institutional placement assessments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const getContestTimingState = (contest) => {
    const now = Date.now();
    const startMs = new Date(contest.startAt).getTime();
    const endMs = new Date(contest.endAt).getTime();

    if (contest.status === "CANCELLED") return "CANCELLED";
    if (now < startMs) return "UPCOMING";
    if (now >= startMs && now < endMs) return "LIVE";
    return "ENDED";
  };

  const filteredContests = contests.filter((contest) => {
    const timingState = getContestTimingState(contest);

    if (statusFilter === "LIVE" && timingState !== "LIVE") return false;
    if (statusFilter === "UPCOMING" && timingState !== "UPCOMING") return false;
    if (statusFilter === "ENDED" && timingState !== "ENDED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (contest.title || "").toLowerCase().includes(q);
      const matchDesc = (contest.description || "").toLowerCase().includes(q);
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              SIPS Placement Verified
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {user?.collegeName || "Institutional Assessment Hub"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Trophy className="w-8 h-8 text-amber-500" />
            Institutional Placement Assessments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official campus recruitment drives, competitive coding assessments, and synchronized aptitude evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchContests}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/student/practice")}
          >
            Practice Hub
          </Button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Assessments" },
            { id: "LIVE", label: "Live Active" },
            { id: "UPCOMING", label: "Scheduled / Upcoming" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search placement drives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="p-4 border-rose-200 bg-rose-50/80 text-rose-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-900">Placement Assessment Service Notice</h4>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Contests Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-800">Loading Scheduled Contests...</h3>
          <p className="text-xs text-slate-400">Fetching live and scheduled placement assessments from SIPS server...</p>
        </div>
      ) : filteredContests.length === 0 ? (
        <Card className="p-12 border-slate-200/90 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Assessments Matching Filter</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            There are currently no placement drives scheduled for this filter. Check back closer to active campus drive schedules or practice self-paced modules.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter("ALL");
              setSearchQuery("");
            }}
          >
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContests.map((contest) => {
            const timingState = getContestTimingState(contest);
            const isLive = timingState === "LIVE";
            const isUpcoming = timingState === "UPCOMING";

            const startDate = new Date(contest.startAt);
            const endDate = new Date(contest.endAt);

            const formatOptions = {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            };

            const startStr = startDate.toLocaleDateString(undefined, formatOptions);
            const endStr = endDate.toLocaleDateString(undefined, formatOptions);

            const secBreakdown = contest.sectionBreakdown || {};

            return (
              <Card
                key={contest.id}
                className={`p-5 border transition-all flex flex-col justify-between hover:shadow-md cursor-pointer ${
                  isLive
                    ? "border-emerald-300/80 bg-linear-to-b from-white to-emerald-50/20"
                    : "border-slate-200 bg-white"
                }`}
                onClick={() => navigate(`/student/contests/${contest.id}`)}
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500 text-white shadow-2xs animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          LIVE NOW
                        </span>
                      ) : isUpcoming ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Calendar className="w-3 h-3 text-indigo-500" />
                          UPCOMING
                        </span>
                      ) : (
                        <Badge variant="neutral" size="xs">ENDED</Badge>
                      )}

                      {contest.sipsDriveId && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                          Drive Synchronized
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900">{contest.totalMarks || 0}</span>
                      <span className="text-[10px] text-slate-400 font-semibold ml-0.5">Marks</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-2 hover:text-indigo-600 transition-colors">
                      {contest.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {contest.description || "Official placement drive evaluation session."}
                    </p>
                  </div>

                  {/* Schedule Details */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration:
                      </span>
                      <span className="font-bold text-slate-800">{contest.durationMinutes} Minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Window:
                      </span>
                      <span className="font-semibold text-slate-700">{startStr}</span>
                    </div>
                  </div>

                  {/* Section Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {secBreakdown.CODING?.count > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                        <Code2 className="w-3 h-3" />
                        Coding ({secBreakdown.CODING.marks}M)
                      </span>
                    )}
                    {secBreakdown.APTITUDE?.count > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                        <BrainCircuit className="w-3 h-3" />
                        Aptitude ({secBreakdown.APTITUDE.marks}M)
                      </span>
                    )}
                    {secBreakdown.TECHNICAL?.count > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold border border-sky-100">
                        <Binary className="w-3 h-3" />
                        Technical ({secBreakdown.TECHNICAL.marks}M)
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                    View Details & Guidelines
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
