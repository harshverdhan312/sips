import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  Binary,
  Code2,
  Sparkles,
  Info,
  HelpCircle,
  Play,
  Layers
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { practiceService } from "../../services/practiceService";
import { useAuth } from "../../context/AuthContext";

export function StudentAssessmentDetailsPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await practiceService.getStudentAssessmentDetails(assessmentId);
      setAssessment(data);
    } catch (err) {
      console.error("Failed to load assessment details:", err);
      setError(err.message || "Failed to retrieve assessment details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assessmentId) {
      fetchDetails();
    }
  }, [assessmentId]);

  const handleStartOrResume = async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await practiceService.startAssessmentAttempt(assessmentId);
      const attempt = res?.data || res;
      if (attempt?.id) {
        if (["SUBMITTED", "FINALIZED"].includes(attempt.status)) {
          navigate(`/student/assessments/${assessmentId}/result/${attempt.id}`);
        } else {
          navigate(`/student/assessments/${assessmentId}/attempt/${attempt.id}`);
        }
      } else {
        throw new Error("Invalid response from assessment server.");
      }
    } catch (err) {
      console.error("Failed to start assessment:", err);
      setError(err.message || "Unable to start assessment.");
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-md w-1/3" />
        <div className="h-48 bg-white border border-slate-200 rounded-2xl p-6" />
        <div className="h-64 bg-white border border-slate-200 rounded-2xl p-6" />
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Assessment Unavailable</h2>
        <p className="text-sm text-slate-600">{error}</p>
        <Button variant="outline" onClick={() => navigate("/student/assessments")} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assessments
        </Button>
      </div>
    );
  }

  const myAttempt = assessment?.myAttempt;
  const isCompleted = myAttempt && ["SUBMITTED", "FINALIZED", "TIMED_OUT"].includes(myAttempt.status);
  const isInProgress = myAttempt && myAttempt.status === "IN_PROGRESS";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Navigation breadcrumb */}
      <div>
        <button
          onClick={() => navigate("/student/assessments")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Assessments
        </button>
      </div>

      {/* Top Overview Banner */}
      <Card className="p-6 md:p-8 bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {assessment.type === "PLACEMENT_ASSESSMENT"
                  ? "Placement Drive Screening"
                  : assessment.type === "MOCK_ASSESSMENT"
                  ? "Mock Assessment"
                  : "Practice Set"}
              </span>
              {assessment.sipsDriveId && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  Drive Pinned
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Eligible
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {assessment.title}
            </h1>

            {assessment.description && (
              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                {assessment.description}
              </p>
            )}
          </div>

          {/* Action Button */}
          <div className="shrink-0 flex flex-col items-end justify-center">
            {isCompleted ? (
              <Button
                onClick={() => navigate(`/student/assessments/${assessment.id}/result/${myAttempt.id}`)}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 px-6 py-2.5"
              >
                View Assessment Result
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : isInProgress ? (
              <Button
                onClick={() => navigate(`/student/assessments/${assessment.id}/attempt/${myAttempt.id}`)}
                className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-2 px-6 py-2.5 shadow-md animate-pulse"
              >
                <Play className="w-4 h-4 fill-current" />
                Resume Assessment
              </Button>
            ) : (
              <Button
                onClick={handleStartOrResume}
                disabled={starting}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 px-8 py-3 text-base shadow-sm"
              >
                {starting ? "Starting..." : "Start Assessment"}
                <ArrowRight className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Duration</span>
            <span className="text-base font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-4 h-4 text-indigo-500" />
              {assessment.durationMinutes} Minutes
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Questions</span>
            <span className="text-base font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <Layers className="w-4 h-4 text-indigo-500" />
              {assessment.totalQuestions || 0} Questions
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Maximum Marks</span>
            <span className="text-base font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {Number(assessment.totalMarks || 0)} Marks
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Official Attempt</span>
            <span className="text-base font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              1 Attempt Only
            </span>
          </div>
        </div>
      </Card>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Sections Breakdown */}
      <Card className="p-6 bg-white border border-slate-200/90 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          Section Structure & Marks Distribution
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-amber-600" /> Aptitude Section
              </span>
              <span className="text-xs font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
                {assessment.sectionBreakdown?.APTITUDE?.marks || 0} Marks
              </span>
            </div>
            <p className="text-xs text-amber-800/80">
              Quantitative, logical, and verbal multiple choice questions with objective automated evaluation.
            </p>
            <div className="mt-3 text-xs font-semibold text-amber-900">
              Questions: {assessment.sectionBreakdown?.APTITUDE?.count || 0}
            </div>
          </div>

          <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sky-900 text-sm flex items-center gap-1.5">
                <Binary className="w-4 h-4 text-sky-600" /> Technical Section
              </span>
              <span className="text-xs font-bold px-2 py-0.5 bg-sky-200 text-sky-900 rounded-md">
                {assessment.sectionBreakdown?.TECHNICAL?.marks || 0} Marks
              </span>
            </div>
            <p className="text-xs text-sky-800/80">
              Core computer science concepts including DBMS, OS, Networks, and programming fundamentals.
            </p>
            <div className="mt-3 text-xs font-semibold text-sky-900">
              Questions: {assessment.sectionBreakdown?.TECHNICAL?.count || 0}
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-600" /> Coding Section
              </span>
              <span className="text-xs font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md">
                {assessment.sectionBreakdown?.CODING?.marks || 0} Marks
              </span>
            </div>
            <p className="text-xs text-emerald-800/80">
              Algorithmic challenges evaluated via Judge0 execution sandbox with public & hidden test cases.
            </p>
            <div className="mt-3 text-xs font-semibold text-emerald-900">
              Questions: {assessment.sectionBreakdown?.CODING?.count || 0}
            </div>
          </div>
        </div>
      </Card>

      {/* Rules & Instructions */}
      <Card className="p-6 bg-white border border-slate-200/90 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-slate-600" />
          Test Instructions & Guidelines
        </h3>

        <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed list-disc list-inside">
          <li>
            <strong className="text-slate-800">Server-Authoritative Clock:</strong> The countdown timer is managed on the server. Your timer will continue seamlessly even if you refresh your browser or lose internet connection.
          </li>
          <li>
            <strong className="text-slate-800">Autosaving:</strong> All MCQ selections and code submissions are saved in real time to the server.
          </li>
          <li>
            <strong className="text-slate-800">Coding Execution:</strong> Use the <span className="font-semibold text-indigo-600">RUN</span> button to test your code against public sample cases, and the <span className="font-semibold text-emerald-600">SUBMIT</span> button to record your official submission against all test cases.
          </li>
          <li>
            <strong className="text-slate-800">Final Submission:</strong> Once you click Submit or when the timer expires, your attempt will be automatically finalized and scored.
          </li>
        </ul>
      </Card>
    </div>
  );
}
