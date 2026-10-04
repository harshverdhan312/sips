import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trophy,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  BrainCircuit,
  Binary,
  Code2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  FileCode,
  Layers,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { practiceService } from "../../services/practiceService";
import { cn } from "../../utils/cn";

import { normalizeOptions, isOptionSelected } from "../../utils/questionUtils";

export function StudentAssessmentResultPage() {
  const { assessmentId, attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await practiceService.getAssessmentResult(assessmentId, attemptId);
        setResult(data);
      } catch (err) {
        console.error("Failed to load result:", err);
        setError(err.message || "Failed to load assessment scorecard.");
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId && attemptId) {
      fetchResult();
    }
  }, [assessmentId, attemptId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-40 bg-white border border-slate-200 rounded-2xl p-6" />
        <div className="h-64 bg-white border border-slate-200 rounded-2xl p-6" />
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Result Not Available</h2>
        <p className="text-sm text-slate-600">{error}</p>
        <Button variant="outline" onClick={() => navigate("/student/assessments")} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assessments
        </Button>
      </div>
    );
  }

  const { assessment, attempt, scores, questions = [] } = result || {};
  const totalScore = scores?.totalScore || 0;
  const totalMarks = scores?.totalMarks || 1;
  const percentage = Math.round((totalScore / totalMarks) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top breadcrumb */}
      <div>
        <button
          onClick={() => navigate("/student/assessments")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessments
        </button>
      </div>

      {/* Main Scorecard Banner */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-0 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Official Assessment Scorecard
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {assessment?.title || "Assessment Result"}
            </h1>
            <p className="text-xs text-slate-300">
              Submitted at {attempt?.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "Recently"}
            </p>
          </div>

          {/* Aggregate Score Circle */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 self-start md:self-auto">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">Total Score</span>
              <span className="text-3xl md:text-4xl font-black text-white">
                {totalScore} <span className="text-sm font-medium text-slate-300">/ {totalMarks}</span>
              </span>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">Accuracy</span>
              <span className="text-2xl font-black text-emerald-400">{percentage}%</span>
            </div>
          </div>
        </div>

        {/* Section Score Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">Aptitude</span>
            </div>
            <span className="text-sm font-extrabold text-amber-300">
              {scores?.aptitudeScore ?? 0} Marks
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-200">Technical</span>
            </div>
            <span className="text-sm font-extrabold text-sky-300">
              {scores?.technicalScore ?? 0} Marks
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Coding</span>
            </div>
            <span className="text-sm font-extrabold text-emerald-300">
              {scores?.codingScore ?? 0} Marks
            </span>
          </div>
        </div>
      </Card>

      {/* Question by Question Review */}
      <Card className="p-6 bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Detailed Performance Review ({questions.length} Questions)
          </h2>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isExpanded = expandedQuestion === q.id;
            const resp = q.response;
            const sub = q.submission;
            const isCorrect = resp?.isCorrect;
            const isUnanswered = !resp || resp.answerData === null;
            const earnedMarks = resp?.marksAwarded ?? (sub?.earnedMarks ?? 0);

            return (
              <div
                key={q.id}
                className={cn(
                  "border rounded-xl transition-all overflow-hidden",
                  isCorrect
                    ? "border-emerald-200 bg-emerald-50/20"
                    : isUnanswered
                    ? "border-slate-200 bg-slate-50/50"
                    : "border-rose-200 bg-rose-50/20"
                )}
              >
                {/* Header */}
                <div
                  onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {q.questionVersion?.title || `Question ${idx + 1}`}
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Section: {q.section}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{earnedMarks})
                      </span>
                    ) : isUnanswered ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        <HelpCircle className="w-3.5 h-3.5" /> Unanswered (0)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect ({earnedMarks})
                      </span>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-100 bg-white space-y-3 text-xs">
                    <p className="text-slate-800 whitespace-pre-wrap font-medium">
                      {q.questionVersion?.statement}
                    </p>

                    {/* Options if MCQ */}
                    {normalizeOptions(q.questionVersion?.options, q.questionVersion?.format).length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        {normalizeOptions(q.questionVersion?.options, q.questionVersion?.format).map((opt) => {
                          const isSelected = isOptionSelected(opt.id, q.questionVersionId, q.questionVersion?.format, { [q.questionVersionId]: resp?.answerData });

                          return (
                            <div
                              key={opt.id}
                              className={cn(
                                "p-2.5 rounded-lg border text-xs flex items-center justify-between",
                                isSelected
                                  ? isCorrect
                                    ? "bg-emerald-50 border-emerald-300 font-semibold text-emerald-900"
                                    : "bg-rose-50 border-rose-300 font-semibold text-rose-900"
                                  : "bg-slate-50 border-slate-200 text-slate-700"
                              )}
                            >
                              <span>{opt.text}</span>
                              {isSelected && (
                                <span className="text-[10px] uppercase font-bold tracking-wider">
                                  Your Selection
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Coding Submission details */}
                    {sub && (
                      <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2 font-mono text-[11px]">
                        <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-1">
                          <span>Language: {sub.language}</span>
                          <span>Tests Passed: {sub.testsPassed} / {sub.testsTotal}</span>
                        </div>
                        <div className="text-slate-300">
                          Status: <span className={sub.status === "ACCEPTED" ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{sub.status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
