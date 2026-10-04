import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Check,
  X,
  HelpCircle,
  Award,
  History,
  ShieldCheck,
  Cpu,
  Code2
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { practiceService } from "../../services/practiceService";
import { cn } from "../../utils/cn";

export function ContestResultPage() {
  const { contestId, attemptId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadResult() {
      setLoading(true);
      setError(null);
      try {
        const data = await practiceService.getContestResult(contestId, attemptId);
        setResult(data);
      } catch (err) {
        console.error("Failed to load contest result:", err);
        setError(err.message || "Failed to retrieve contest score and evaluation breakdown.");
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [contestId, attemptId]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
        <h3 className="text-base font-bold text-slate-800">Calculating Official Contest Score...</h3>
        <p className="text-xs text-slate-500">Retrieving server-evaluated sectional scores and performance metrics...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Scorecard Unavailable</h3>
        <p className="text-xs text-slate-600">{error || "Contest result could not be loaded."}</p>
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/student/contests")}>
            Back to Contests
          </Button>
        </div>
      </div>
    );
  }

  const {
    status,
    totalScore = 0,
    totalMarks = 0,
    aptitudeScore = 0,
    technicalScore = 0,
    codingScore = 0,
    submittedAt,
    questionBreakdown = []
  } = result;

  const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
  const isPassed = percentage >= 50;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Button
          variant="ghost"
          size="xs"
          icon={ArrowLeft}
          onClick={() => navigate("/student/contests")}
        >
          Back to Placement Contests
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant={status === "TIMED_OUT" ? "warning" : "success"} size="sm">
            {status === "TIMED_OUT" ? "Timed Out & Evaluated" : "Officially Submitted"}
          </Badge>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <Card className="p-8 text-center bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto text-amber-400">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
              Placement Assessment Scorecard
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-1">
              {totalScore} <span className="text-lg font-normal text-indigo-200">/ {totalMarks} Marks</span>
            </h2>
            <p className="text-xs text-indigo-200/80 mt-1">
              Overall Performance: <span className="font-bold text-white">{percentage}%</span>
            </p>
          </div>

          {/* Section Summary Chips */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">
                Aptitude
              </span>
              <span className="text-base font-bold text-white">{aptitudeScore}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">
                Technical
              </span>
              <span className="text-base font-bold text-white">{technicalScore}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">
                Coding
              </span>
              <span className="text-base font-bold text-white">{codingScore}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Question Performance Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" />
          Question Breakdown & Scores
        </h3>

        <div className="grid grid-cols-1 gap-2.5">
          {questionBreakdown.map((q, idx) => {
            const isCorrect = q.isCorrect;
            const marksAwarded = Number(q.marksAwarded || 0);
            const marksAvailable = Number(q.marksAvailable || 0);

            return (
              <Card key={q.questionVersionId || idx} className="p-4 border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      Q{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="indigo" size="xs">
                          {q.section}
                        </Badge>
                        <span className="text-xs font-medium text-slate-700">
                          {marksAvailable} Marks Available
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 block">
                        {marksAwarded > 0 ? `+${marksAwarded}` : marksAwarded} Marks
                      </span>
                    </div>
                    {isCorrect ? (
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    ) : marksAwarded > 0 ? (
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[2]" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                        <X className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-slate-200">
        <Button variant="outline" size="sm" onClick={() => navigate("/student/contests")}>
          View Other Contests
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Trophy}
            onClick={() => navigate(`/student/contests/${contestId}/leaderboard`)}
          >
            View Leaderboard
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate("/student/practice")}>
            Return to Practice Hub
          </Button>
        </div>
      </div>
    </div>
  );
}
