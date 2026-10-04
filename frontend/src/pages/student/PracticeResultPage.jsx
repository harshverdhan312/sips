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
  Flame,
  Award,
  History
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { practiceService } from "../../services/practiceService";
import { normalizeOptions } from "../../utils/questionUtils";

export function PracticeResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadResult() {
      setLoading(true);
      setError(null);
      try {
        const data = await practiceService.getPracticeResult(attemptId);
        setResult(data);
      } catch (err) {
        console.error("Failed to load practice result:", err);
        setError(err.message || "Failed to retrieve practice attempt results.");
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
        <h3 className="text-base font-bold text-slate-800">Calculating Final Score...</h3>
        <p className="text-xs text-slate-500">Retrieving server-evaluated breakdown and explanations...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Unable to Load Scorecard</h3>
        <p className="text-xs text-slate-600">{error || "Result could not be loaded."}</p>
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/student/practice")}>
            Back to Practice Hub
          </Button>
        </div>
      </div>
    );
  }

  const { score, totalMarks, category, submittedAt, breakdown = [] } = result;
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  const correctCount = breakdown.filter((b) => b.isCorrect).length;
  const answeredCount = breakdown.filter(
    (b) => b.candidateAnswer && Object.keys(b.candidateAnswer).length > 0
  ).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Button
          variant="ghost"
          size="xs"
          icon={ArrowLeft}
          onClick={() => navigate("/student/practice")}
        >
          Back to Practice Hub
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={History}
            onClick={() => navigate("/student/practice/history")}
          >
            Practice History
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={() => navigate("/student/practice")}
          >
            Practice Another Topic
          </Button>
        </div>
      </div>

      {/* Score Summary Banner */}
      <Card className="p-6 sm:p-8 border-slate-200 shadow-sm bg-linear-to-br from-white to-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                {category} Assessment
              </span>
              <Badge variant="success" size="sm">Evaluated</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Practice Scorecard
            </h1>
            <p className="text-xs text-slate-500">
              Completed on {submittedAt ? new Date(submittedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Just now"}
            </p>
          </div>

          <div className="flex items-center gap-4 sm:border-l sm:border-slate-200 sm:pl-8">
            <div className="text-center sm:text-right">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {score} <span className="text-lg text-slate-400 font-semibold">/ {totalMarks}</span>
              </div>
              <div className="text-xs font-extrabold text-indigo-600 mt-0.5">
                {percentage}% Accuracy
              </div>
            </div>

            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                percentage >= 70
                  ? "bg-emerald-50 text-emerald-600"
                  : percentage >= 40
                  ? "bg-amber-50 text-amber-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              <Trophy className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100 text-center">
          <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
            <div className="text-xs text-slate-500 font-medium">Total Questions</div>
            <div className="text-lg font-bold text-slate-800 mt-0.5">{breakdown.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
            <div className="text-xs text-slate-500 font-medium">Correct Answers</div>
            <div className="text-lg font-bold text-emerald-600 mt-0.5">{correctCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
            <div className="text-xs text-slate-500 font-medium">Attempted</div>
            <div className="text-lg font-bold text-indigo-600 mt-0.5">{answeredCount}</div>
          </div>
        </div>
      </Card>

      {/* Question by Question Review */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Question Breakdown & Detailed Explanations
        </h2>

        {breakdown.map((item, idx) => {
          const isAnswered = item.candidateAnswer && Object.keys(item.candidateAnswer).length > 0;
          const isCorrect = item.isCorrect;

          const correctOptionId =
            item.correctAnswer && typeof item.correctAnswer === "object"
              ? item.correctAnswer.optionId || item.correctAnswer.id
              : item.correctAnswer;

          const candidateOptionId =
            item.candidateAnswer && typeof item.candidateAnswer === "object"
              ? item.candidateAnswer.optionId || item.candidateAnswer.id
              : item.candidateAnswer;

          return (
            <Card
              key={item.responseId || idx}
              className={`p-6 border transition-all ${
                isCorrect
                  ? "border-emerald-200/80 bg-white"
                  : isAnswered
                  ? "border-rose-200/80 bg-white"
                  : "border-slate-200 bg-slate-50/40"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Q{idx + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{item.title}</span>
                </div>

                <Badge
                  variant={isCorrect ? "success" : isAnswered ? "danger" : "neutral"}
                  size="sm"
                >
                  {isCorrect ? "Correct (+1.0)" : isAnswered ? "Incorrect (0.0)" : "Unattempted"}
                </Badge>
              </div>

              {/* Question Statement */}
              <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed mb-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                {item.statement}
              </div>

              {/* Options Review */}
              {item.format !== "TRUE_FALSE" && (
                <div className="space-y-2 mb-4">
                  {normalizeOptions(item.options, item.format).map((opt) => {
                    const optId = opt.id;
                    const isCandidateChoice =
                      item.format === "MULTIPLE_CHOICE"
                        ? (item.candidateAnswer?.optionIds || []).includes(optId)
                        : candidateOptionId === optId;

                    const isOfficialCorrect =
                      item.format === "MULTIPLE_CHOICE"
                        ? (item.correctAnswer?.optionIds || item.correctAnswer || []).includes(optId)
                        : correctOptionId === optId;

                    return (
                      <div
                        key={optId}
                        className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition-colors ${
                          isOfficialCorrect
                            ? "border-emerald-300 bg-emerald-50/80 text-emerald-950 font-medium"
                            : isCandidateChoice && !isCorrect
                            ? "border-rose-300 bg-rose-50/80 text-rose-950 font-medium"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isOfficialCorrect
                              ? "bg-emerald-600 text-white"
                              : isCandidateChoice && !isCorrect
                              ? "bg-rose-600 text-white"
                              : "border border-slate-300"
                          }`}
                        >
                          {isOfficialCorrect ? (
                            <Check className="w-3 h-3 stroke-[3]" />
                          ) : isCandidateChoice && !isCorrect ? (
                            <X className="w-3 h-3 stroke-[3]" />
                          ) : null}
                        </div>

                        <div className="flex-1 select-none">
                          {opt.text}
                        </div>

                        {isOfficialCorrect && (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                            Correct Answer
                          </span>
                        )}
                        {isCandidateChoice && !isOfficialCorrect && (
                          <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                            Your Selection
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* True / False Review */}
              {item.format === "TRUE_FALSE" && (
                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  {["true", "false"].map((val) => {
                    const isCandidateChoice = String(item.candidateAnswer?.value) === val;
                    const isOfficialCorrect = String(item.correctAnswer?.value) === val;

                    return (
                      <div
                        key={val}
                        className={`p-2.5 rounded-xl border text-center font-bold ${
                          isOfficialCorrect
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                            : isCandidateChoice && !isCorrect
                            ? "border-rose-300 bg-rose-50 text-rose-900"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {val === "true" ? "True" : "False"}
                        {isOfficialCorrect && " (Correct)"}
                        {isCandidateChoice && !isOfficialCorrect && " (Your Choice)"}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Explanation Box */}
              {item.explanation && (
                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-slate-700 leading-relaxed space-y-1">
                  <div className="font-bold text-indigo-900 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> Explanation
                  </div>
                  <p>{item.explanation}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-wrap justify-center gap-3 pt-6 pb-12">
        <Button
          variant="outline"
          size="md"
          icon={History}
          onClick={() => navigate("/student/practice/history")}
        >
          View Practice History
        </Button>
        <Button
          variant="primary"
          size="md"
          icon={RotateCcw}
          onClick={() => navigate("/student/practice")}
        >
          Practice More Categories
        </Button>
      </div>
    </div>
  );
}
