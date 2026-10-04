import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trophy,
  ArrowLeft,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  RefreshCw,
  Code2,
  BrainCircuit,
  Binary,
  FileText,
  HelpCircle,
  Sparkles,
  Info,
  Building,
  Layers
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { practiceService } from "../../services/practiceService";
import { useAuth } from "../../context/AuthContext";

export function ContestDetailsPage() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Attempt Initiation State
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);
  const [ineligibilityReasons, setIneligibilityReasons] = useState([]);

  const fetchContestDetails = async () => {
    setLoading(true);
    setError(null);
    setStartError(null);
    try {
      const data = await practiceService.getStudentContestDetails(contestId);
      setContest(data);
    } catch (err) {
      console.error("Failed to load contest details:", err);
      setError(err.message || "Failed to retrieve assessment details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contestId) {
      fetchContestDetails();
    }
  }, [contestId]);

  const handleStartOrResume = async () => {
    if (!contest) return;

    // If an in-progress attempt already exists, navigate directly to resume
    if (contest.myAttempt && contest.myAttempt.id) {
      navigate(`/student/contests/${contest.id}/attempt/${contest.myAttempt.id}`);
      return;
    }

    setStarting(true);
    setStartError(null);
    setIneligibilityReasons([]);

    try {
      const result = await practiceService.startContestAttempt(contestId);
      const attemptId = result?.attempt?.id || result?.attemptId;
      if (attemptId) {
        navigate(`/student/contests/${contest.id}/attempt/${attemptId}`);
      } else {
        throw new Error("Invalid attempt creation response from server");
      }
    } catch (err) {
      console.error("Failed to start contest attempt:", err);

      // Handle duplicate attempt gracefully by redirecting
      if (err.status === 409 || err.code === "ATTEMPT_ALREADY_EXISTS") {
        await fetchContestDetails();
        return;
      }

      // Handle ineligibility reasons
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        setIneligibilityReasons(err.errors);
      } else if (err.reasons && Array.isArray(err.reasons) && err.reasons.length > 0) {
        setIneligibilityReasons(err.reasons);
      }

      setStartError(
        err.message || "Unable to start contest. Please verify your placement eligibility."
      );
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3 max-w-md mx-auto">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
        <h3 className="text-base font-bold text-slate-800">Loading Assessment Details...</h3>
        <p className="text-xs text-slate-500">Checking schedule, section guidelines, and institutional eligibility...</p>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <Card className="max-w-md mx-auto my-16 p-6 border-rose-200 bg-white text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">Assessment Unavailable</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || "The requested contest was not found or is not available for your institution."}
          </p>
        </div>
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/student/contests")}>
            Browse Contests
          </Button>
          <Button variant="primary" size="sm" onClick={fetchContestDetails}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const now = Date.now();
  const startMs = new Date(contest.startAt).getTime();
  const endMs = new Date(contest.endAt).getTime();

  let timingState = "LIVE";
  if (contest.status === "CANCELLED") {
    timingState = "CANCELLED";
  } else if (now < startMs) {
    timingState = "UPCOMING";
  } else if (now >= endMs) {
    timingState = "ENDED";
  }

  const isLive = timingState === "LIVE";
  const isUpcoming = timingState === "UPCOMING";
  const isEnded = timingState === "ENDED";
  const isCancelled = timingState === "CANCELLED";

  const hasExistingAttempt = Boolean(contest.myAttempt && contest.myAttempt.id);
  const isAttemptSubmitted = contest.myAttempt?.status === "SUBMITTED";

  const startDate = new Date(contest.startAt);
  const endDate = new Date(contest.endAt);

  const formatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  };

  const startFormatted = startDate.toLocaleDateString(undefined, formatOptions);
  const endFormatted = endDate.toLocaleDateString(undefined, formatOptions);

  const secBreakdown = contest.sectionBreakdown || {};

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <Button
          variant="ghost"
          size="xs"
          icon={ArrowLeft}
          onClick={() => navigate("/student/contests")}
        >
          All Placement Assessments
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchContestDetails}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Assessment Header Card */}
      <Card className="p-6 sm:p-8 border-slate-200 shadow-sm bg-linear-to-br from-white to-slate-50/50 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-xs animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  LIVE NOW
                </span>
              ) : isUpcoming ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  SCHEDULED / UPCOMING
                </span>
              ) : (
                <Badge variant="neutral" size="sm">{timingState}</Badge>
              )}

              {contest.sipsDriveId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  SIPS Campus Recruitment Drive
                </span>
              )}

              <span className="text-xs text-slate-400 font-medium">
                {user?.collegeName}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {contest.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {contest.description || "Official institutional placement assessment and candidate evaluation."}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0 sm:border-l sm:border-slate-200 sm:pl-6">
            <div className="text-3xl font-black text-slate-900">
              {contest.totalMarks || 0}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Total Marks ({contest.totalQuestions || 0} Questions)
            </div>
          </div>
        </div>

        {/* Schedule & Timing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200/80">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" /> Duration
            </span>
            <div className="text-base font-extrabold text-slate-900">
              {contest.durationMinutes} Minutes
            </div>
            <p className="text-[11px] text-slate-500">Timed upon attempt start</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Window Opens
            </span>
            <div className="text-xs font-bold text-slate-900 leading-snug">
              {startFormatted}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-600" /> Window Closes
            </span>
            <div className="text-xs font-bold text-slate-900 leading-snug">
              {endFormatted}
            </div>
          </div>
        </div>

        {/* Existing Attempt Notification */}
        {hasExistingAttempt && (
          <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-start gap-3 text-xs text-indigo-950">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-indigo-900">
                {isAttemptSubmitted
                  ? "You have already completed this contest."
                  : "You have an active session for this assessment."}
              </p>
              <p className="text-indigo-800">
                {isAttemptSubmitted
                  ? "Your attempt has been submitted and server-evaluated."
                  : "You can resume your attempt before your session deadline expires."}
              </p>
            </div>
          </div>
        )}

        {/* Start Error / Ineligibility Alert */}
        {startError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-950">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Assessment Eligibility Notice</span>
            </div>
            <p className="text-rose-800">{startError}</p>

            {ineligibilityReasons.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-rose-700 pt-1 font-medium">
                {ineligibilityReasons.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Action Button Strip */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {isLive
              ? "The assessment window is currently open."
              : isUpcoming
              ? "The assessment will be available when the window opens."
              : "This assessment window has closed."}
          </div>

          <div className="flex items-center gap-3">
            {!isCancelled && contest.status !== 'DRAFT' && (
              <Button
                variant="outline"
                size="md"
                icon={Trophy}
                onClick={() => navigate(`/student/contests/${contest.id}/leaderboard`)}
                className="font-bold"
              >
                Leaderboard
              </Button>
            )}

            {hasExistingAttempt && isAttemptSubmitted ? (
              <Button
                variant="primary"
                size="md"
                icon={Trophy}
                onClick={() =>
                  navigate(`/student/contests/${contest.id}/attempt/${contest.myAttempt.id}/result`)
                }
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6"
              >
                View Scorecard
              </Button>
            ) : hasExistingAttempt && !isAttemptSubmitted ? (
              <Button
                variant="primary"
                size="md"
                icon={RotateCcw}
                loading={starting}
                onClick={handleStartOrResume}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6"
              >
                Resume Contest
              </Button>
            ) : isLive ? (
              <Button
                variant="primary"
                size="md"
                icon={Play}
                loading={starting}
                onClick={handleStartOrResume}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6"
              >
                Start Contest
              </Button>
            ) : (
              <Button
                variant="outline"
                size="md"
                disabled
                className="font-bold opacity-60"
              >
                {isUpcoming ? "Contest Not Started Yet" : isCancelled ? "Contest Cancelled" : "Contest Window Closed"}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Sections & Composition Breakdown */}
      <div className="space-y-3">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          Assessment Sections & Question Composition
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Coding Section Card */}
          <Card className="p-4 border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Code2 className="w-4 h-4" />
              </div>
              <Badge variant={secBreakdown.CODING?.count > 0 ? "success" : "neutral"} size="xs">
                {secBreakdown.CODING?.count > 0 ? `${secBreakdown.CODING.marks} Marks` : "Not Present"}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Algorithmic Coding</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {secBreakdown.CODING?.count || 0} Challenge(s) • Live Judge0 compiler evaluation with sample & hidden boundary test cases.
              </p>
            </div>
          </Card>

          {/* Aptitude Section Card */}
          <Card className="p-4 border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <Badge variant={secBreakdown.APTITUDE?.count > 0 ? "primary" : "neutral"} size="xs">
                {secBreakdown.APTITUDE?.count > 0 ? `${secBreakdown.APTITUDE.marks} Marks` : "Not Present"}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Aptitude & Reasoning</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {secBreakdown.APTITUDE?.count || 0} Question(s) • Quantitative math, logical reasoning, and data interpretation MCQs.
              </p>
            </div>
          </Card>

          {/* Technical Section Card */}
          <Card className="p-4 border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Binary className="w-4 h-4" />
              </div>
              <Badge variant={secBreakdown.TECHNICAL?.count > 0 ? "primary" : "neutral"} size="xs">
                {secBreakdown.TECHNICAL?.count > 0 ? `${secBreakdown.TECHNICAL.marks} Marks` : "Not Present"}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Computer Science Core</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {secBreakdown.TECHNICAL?.count || 0} Question(s) • Core fundamentals: DSA, OOP, DBMS, Operating Systems, Networks.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Contest Rules & Guidelines Card */}
      <Card className="p-6 border-slate-200 bg-white space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          Instructions & Assessment Rules
        </h3>

        {contest.instructions ? (
          <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            {contest.instructions}
          </div>
        ) : (
          <div className="text-xs sm:text-sm text-slate-600 space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            <p className="font-semibold text-slate-800">General Candidate Guidelines:</p>
            <p>1. <strong>Session Timer:</strong> Once started, your session timer will run continuously on the server for {contest.durationMinutes} minutes.</p>
            <p>2. <strong>Auto-Saving:</strong> MCQ selections and coding source code are saved automatically as you practice.</p>
            <p>3. <strong>Submission:</strong> You can submit responses section by section or finalize all answers before your deadline expires.</p>
            <p>4. <strong>Scoring:</strong> Server-authoritative scoring calculates final scores upon contest submission.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
