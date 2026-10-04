import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trophy,
  Medal,
  Award,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Code2,
  Layers
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { practiceService } from "../../services/practiceService";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";

export function ContestLeaderboardPage() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const fetchLeaderboard = useCallback(async (page = 1) => {
    if (!contestId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await practiceService.getContestLeaderboard(contestId, {
        page,
        limit: pageSize
      });
      setLeaderboardData(data);
      setCurrentPage(page);
    } catch (err) {
      console.error("Failed to load contest leaderboard:", err);
      setError(err.message || "Failed to load contest leaderboard.");
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    fetchLeaderboard(1);
  }, [fetchLeaderboard]);

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
          <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" /> #1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
          <Medal className="w-3.5 h-3.5 text-slate-500 fill-slate-400" /> #2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
          <Award className="w-3.5 h-3.5 text-amber-700" /> #3
        </span>
      );
    }
    return (
      <span className="text-xs font-bold text-slate-600 px-2 py-0.5">
        #{rank}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "LIVE":
        return <Badge variant="success" size="sm">LIVE CONTEST</Badge>;
      case "PUBLISHED":
        return <Badge variant="info" size="sm">PUBLISHED</Badge>;
      case "ENDED":
        return <Badge variant="neutral" size="sm">CONTEST ENDED</Badge>;
      case "EVALUATED":
        return <Badge variant="primary" size="sm">EVALUATED</Badge>;
      case "ARCHIVED":
        return <Badge variant="secondary" size="sm">ARCHIVED</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status || "CONTEST"}</Badge>;
    }
  };

  if (loading && !leaderboardData) {
    return (
      <div className="py-24 text-center space-y-3 max-w-md mx-auto">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
        <h3 className="text-base font-bold text-slate-800">Calculating Institutional Rankings...</h3>
        <p className="text-xs text-slate-500">Retrieving server-evaluated leaderboard and dynamic competition ranks...</p>
      </div>
    );
  }

  if (error && !leaderboardData) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Leaderboard Unavailable</h3>
        <p className="text-xs text-slate-600">{error}</p>
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/student/contests/${contestId}`)}>
            Back to Contest Details
          </Button>
          <Button variant="primary" size="sm" onClick={() => fetchLeaderboard(1)}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const {
    contestTitle = "Contest Leaderboard",
    contestStatus = "LIVE",
    totalEntries = 0,
    pagination = {},
    myRank = null,
    entries = []
  } = leaderboardData || {};

  const totalPages = pagination.totalPages || 1;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300 pb-16">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="xs"
            icon={ArrowLeft}
            onClick={() => navigate(`/student/contests/${contestId}`)}
            className="mb-1"
          >
            Back to Assessment
          </Button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {contestTitle}
            </h1>
            {getStatusBadge(contestStatus)}
          </div>
          <p className="text-xs text-slate-500">
            Official institutional leaderboard • Standard competition ranking (1224)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            icon={RefreshCw}
            loading={loading}
            onClick={() => fetchLeaderboard(currentPage)}
          >
            Refresh Ranks
          </Button>
        </div>
      </div>

      {/* Authenticated Student "My Standing" Card */}
      {myRank && (
        <Card className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 block">
                  Your Assessment Standing
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-white">
                    {user?.name || myRank.studentId || "Candidate"}
                  </span>
                  {myRank.isRankable ? (
                    <Badge variant="success" size="sm">
                      Rank #{myRank.rank}
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      {myRank.status === "IN_PROGRESS" ? "In Progress" : "Not Finalized"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-indigo-200/80">
                  {myRank.isRankable
                    ? `Final score evaluated across ${myRank.totalMarks || 0} total marks`
                    : "Complete and submit your attempt to receive an official competition rank."}
                </p>
              </div>
            </div>

            {myRank.isRankable && (
              <div className="grid grid-cols-4 gap-2.5 pt-2 md:pt-0">
                <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-200 block">
                    Aptitude
                  </span>
                  <span className="text-sm font-extrabold text-white">
                    {myRank.aptitudeScore}
                  </span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-200 block">
                    Technical
                  </span>
                  <span className="text-sm font-extrabold text-white">
                    {myRank.technicalScore}
                  </span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-200 block">
                    Coding
                  </span>
                  <span className="text-sm font-extrabold text-white">
                    {myRank.codingScore}
                  </span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-indigo-600/60 border border-indigo-400/30 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300 block">
                    Total
                  </span>
                  <span className="text-sm font-extrabold text-white">
                    {myRank.totalScore}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Leaderboard Entries Table */}
      <Card className="overflow-hidden border border-slate-200/90 shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Contest Standings ({totalEntries} Participants)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Page {currentPage} of {totalPages || 1}
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Trophy className="w-8 h-8 mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-slate-700">No Finalized Submissions Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Leaderboard rankings update automatically as candidates complete and submit their assessments.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4 w-20 text-center">Rank</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4 text-center">Aptitude</th>
                  <th className="py-3 px-4 text-center">Technical</th>
                  <th className="py-3 px-4 text-center">Coding</th>
                  <th className="py-3 px-4 text-right">Total Score</th>
                  <th className="py-3 px-4 text-right">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {entries.map((entry) => {
                  const isCurrentStudent = user?.id === entry.studentId || (myRank && myRank.studentId === entry.studentId);
                  const formattedDate = entry.submittedAt
                    ? new Date(entry.submittedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : "—";

                  return (
                    <tr
                      key={entry.attemptId}
                      className={cn(
                        "transition-colors hover:bg-slate-50/80",
                        isCurrentStudent && "bg-indigo-50/60 font-semibold text-indigo-950 border-l-4 border-l-indigo-600"
                      )}
                    >
                      <td className="py-3.5 px-4 text-center font-bold">
                        {getRankBadge(entry.rank)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-900">
                            {entry.studentId}
                          </span>
                          {isCurrentStudent && (
                            <Badge variant="primary" size="xs">
                              You
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        {entry.aptitudeScore}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        {entry.technicalScore}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        {entry.codingScore}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-black text-slate-900">
                          {entry.totalScore}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          / {entry.totalMarks}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px]">
                        {formattedDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/40">
            <Button
              variant="outline"
              size="xs"
              icon={ChevronLeft}
              disabled={currentPage <= 1 || loading}
              onClick={() => fetchLeaderboard(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="text-xs font-bold text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="xs"
              icon={ChevronRight}
              disabled={currentPage >= totalPages || loading}
              onClick={() => fetchLeaderboard(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
