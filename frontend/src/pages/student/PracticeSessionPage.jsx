import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Code2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  Check,
  Clock,
  ArrowLeft
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { practiceService } from "../../services/practiceService";
import {
  normalizeOptions,
  isOptionSelected,
  extractQuestionDetails,
  isQuestionAnswered
} from "../../utils/questionUtils";

export function PracticeSessionPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attemptData, setAttemptData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionVersionId]: answerData }
  const [savingResponse, setSavingResponse] = useState(false);

  // Submit modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await practiceService.getDeliveredQuestions(attemptId);
      if (!data) {
        throw new Error("Invalid session response received from Practice service.");
      }

      // If attempt is already SUBMITTED, redirect to result page
      if (data.status === "SUBMITTED") {
        navigate(`/student/practice/attempt/${attemptId}/result`, { replace: true });
        return;
      }

      const rawQuestions = Array.isArray(data.questions)
        ? data.questions
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      const normalizedQuestions = rawQuestions.map(extractQuestionDetails).filter(Boolean);

      setAttemptData(data);
      setQuestions(normalizedQuestions);

      // Hydrate existing answers if candidate had answered previously (reconnect / refresh)
      const existingAnswers = {};
      rawQuestions.forEach((q) => {
        const qvId = q.questionVersionId || q.id;
        if (q.currentAnswer && Object.keys(q.currentAnswer).length > 0) {
          existingAnswers[qvId] = q.currentAnswer;
        } else if (q.response?.answerData && Object.keys(q.response.answerData).length > 0) {
          existingAnswers[qvId] = q.response.answerData;
        }
      });
      setAnswers(existingAnswers);
    } catch (err) {
      console.error("Failed to load practice session:", err);
      setError(err.message || "Failed to load practice session.");
    } finally {
      setLoading(false);
    }
  }, [attemptId, navigate]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const currentQuestion = questions[currentIndex];
  const qvId = currentQuestion ? currentQuestion.questionVersionId || currentQuestion.id : null;

  const handleSelectOption = async (optionId) => {
    if (!currentQuestion || submitting || !qvId) return;

    const format = currentQuestion.format;
    let newAnswerData;

    if (format === "MULTIPLE_CHOICE") {
      const existingIds = answers[qvId]?.optionIds || (Array.isArray(answers[qvId]) ? answers[qvId] : []);
      const exists = existingIds.includes(optionId);
      const updated = exists ? existingIds.filter((id) => id !== optionId) : [...existingIds, optionId];
      newAnswerData = { optionIds: updated };
    } else if (format === "TRUE_FALSE") {
      const boolVal = String(optionId).toLowerCase() === "true" || optionId === true;
      newAnswerData = { value: boolVal, optionId: String(optionId) };
    } else {
      // SINGLE_CHOICE default
      newAnswerData = { optionId: String(optionId) };
    }

    // Optimistic UI state update
    setAnswers((prev) => ({
      ...prev,
      [qvId]: newAnswerData
    }));

    // Server-side response persistence
    setSavingResponse(true);
    try {
      await practiceService.recordResponse(attemptId, {
        questionVersionId: qvId,
        answerData: newAnswerData
      });
    } catch (err) {
      console.error("Failed to save response:", err);
    } finally {
      setSavingResponse(false);
    }
  };

  const handleClearAnswer = async () => {
    if (!currentQuestion || submitting || !qvId) return;

    setAnswers((prev) => {
      const updated = { ...prev };
      delete updated[qvId];
      return updated;
    });

    setSavingResponse(true);
    try {
      await practiceService.recordResponse(attemptId, {
        questionVersionId: qvId,
        answerData: {}
      });
    } catch (err) {
      console.error("Failed to clear response:", err);
    } finally {
      setSavingResponse(false);
    }
  };

  const handleSubmitAttempt = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await practiceService.submitPracticeAttempt(attemptId);
      if (result) {
        navigate(`/student/practice/attempt/${attemptId}/result`, { replace: true });
      }
    } catch (err) {
      console.error("Failed to submit practice attempt:", err);
      setSubmitError(err.message || "Failed to submit attempt. Please try again.");
      setSubmitting(false);
    }
  };

  const totalQuestions = questions.length;
  const answeredCount = questions.filter((q) => isQuestionAnswered(q, answers)).length;

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
        <h3 className="text-base font-bold text-slate-800">Loading Practice Questions...</h3>
        <p className="text-xs text-slate-500">Preparing server-delivered question session...</p>
      </div>
    );
  }

  if (error || !currentQuestion) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Unable to Open Practice Session</h3>
        <p className="text-xs text-slate-600">{error || "No questions found for this attempt."}</p>
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/student/practice")}>
            Back to Practice Hub
          </Button>
          <Button variant="primary" size="sm" onClick={loadSession}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const currentAnswer = answers[qvId];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="xs"
            icon={ArrowLeft}
            onClick={() => navigate("/student/practice")}
          >
            Practice Hub
          </Button>
          <div className="h-4 w-px bg-slate-200" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {currentQuestion.category || "General"} Practice
          </span>
          {savingResponse && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" /> Saving...
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600">
            Answered: <span className="text-indigo-600">{answeredCount}</span> of {totalQuestions}
          </span>
          <Button
            variant="primary"
            size="sm"
            icon={Send}
            onClick={() => setShowSubmitModal(true)}
          >
            Finish & Submit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Interface */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-6 sm:p-8 border-slate-200 shadow-sm relative overflow-hidden">
            {/* Question Header */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-100">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                {currentQuestion.subcategory && (
                  <Badge variant="primary" size="xs">
                    {currentQuestion.subcategory.replace(/_/g, " ")}
                  </Badge>
                )}
                <Badge variant="neutral" size="xs">
                  {currentQuestion.format ? currentQuestion.format.replace(/_/g, " ") : "MCQ"}
                </Badge>
                {currentQuestion.difficulty && (
                  <Badge
                    variant={
                      currentQuestion.difficulty === "EASY"
                        ? "success"
                        : currentQuestion.difficulty === "HARD"
                        ? "danger"
                        : "warning"
                    }
                    size="xs"
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                )}
              </div>

              {currentAnswer && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Answer Saved
                </span>
              )}
            </div>

            {/* Question Title & Statement */}
            <div className="space-y-3 mb-8">
              {currentQuestion.title && (
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {currentQuestion.title}
                </h2>
              )}
              <div className="text-sm sm:text-base text-slate-800 whitespace-pre-line leading-relaxed font-normal bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                {currentQuestion.statement}
              </div>
            </div>

            {/* Options List */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {currentQuestion.format === "MULTIPLE_CHOICE"
                  ? "Select all that apply:"
                  : currentQuestion.format === "TRUE_FALSE"
                  ? "Select True or False:"
                  : currentQuestion.format === "NUMERICAL"
                  ? "Enter Numerical Value:"
                  : "Select one option:"}
              </p>

              {currentQuestion.format === "NUMERICAL" ? (
                <div className="max-w-xs space-y-2">
                  <label className="text-xs font-medium text-slate-700">Enter Numerical Value:</label>
                  <input
                    type="text"
                    value={currentAnswer?.value ?? currentAnswer?.answer ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAnswers((prev) => ({ ...prev, [qvId]: { value: val } }));
                      practiceService.recordResponse(attemptId, { questionVersionId: qvId, answerData: { value: val } }).catch(() => {});
                    }}
                    placeholder="e.g. 42"
                    className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {normalizeOptions(currentQuestion.options, currentQuestion.format).map((option) => {
                    const optId = option.id;
                    const isSelected = isOptionSelected(optId, qvId, currentQuestion.format, answers);

                    return (
                      <div
                        key={optId}
                        onClick={() => handleSelectOption(optId)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs ring-1 ring-indigo-600/30"
                            : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50/80 text-slate-800"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "border border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div className="text-sm font-medium leading-relaxed select-none flex-1">
                          {option.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-6 mt-8 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              >
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {currentAnswer && (
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={RotateCcw}
                    className="text-slate-400 hover:text-slate-600"
                    onClick={handleClearAnswer}
                  >
                    Clear Choice
                  </Button>
                )}

                {currentIndex < totalQuestions - 1 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  >
                    Next Question <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Send}
                    onClick={() => setShowSubmitModal(true)}
                  >
                    Submit Practice
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Question Palette */}
        <div className="space-y-4">
          <Card className="p-5 border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Question Palette
            </h3>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAns = isQuestionAnswered(q, answers);

                return (
                  <button
                    key={q.id || idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                      isCurrent
                        ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300"
                        : isAns
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-50 text-slate-600 border border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-md bg-indigo-600" />
                <span>Current Question</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-md bg-slate-50 border border-slate-200" />
                <span>Unanswered ({totalQuestions - answeredCount})</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-slate-200 bg-slate-50/50 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Server Authoritative
            </div>
            <p>Every response is persisted to your session. Explanations and solution breakdowns are unlocked immediately upon submission.</p>
          </Card>
        </div>
      </div>

      {/* Confirmation Submission Modal */}
      {showSubmitModal && (
        <Modal
          isOpen={showSubmitModal}
          onClose={() => {
            if (!submitting) setShowSubmitModal(false);
          }}
          title="Submit Practice Attempt"
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-600">
              You have answered <span className="font-bold text-indigo-600">{answeredCount}</span> out of <span className="font-bold text-slate-800">{totalQuestions}</span> questions.
            </p>

            {answeredCount < totalQuestions && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  You have {totalQuestions - answeredCount} unanswered questions. Unanswered questions receive 0 marks.
                </span>
              </div>
            )}

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{submitError}</span>
              </div>
            )}

            <p className="text-xs text-slate-500">
              Once submitted, your attempt will be finalized and evaluated on the server. You will be able to review detailed explanations for all questions.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
              >
                Keep Practicing
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Send}
                loading={submitting}
                onClick={handleSubmitAttempt}
              >
                Confirm Submission
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
