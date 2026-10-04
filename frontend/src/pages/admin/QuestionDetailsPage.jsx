import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle2,
  Archive,
  AlertTriangle,
  Code2,
  BookOpen,
  Layers,
  FileText,
  Tag,
  Globe2,
  Building,
  Lock,
  Unlock,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  History,
  AlertCircle
} from "lucide-react";
import { practiceService } from "../../services/practiceService";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { useNotifications } from "../../context/NotificationContext";

export function QuestionDetailsPage() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/placement") ? "/placement" : "/admin";
  const { addToast } = useNotifications();

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Version Selection
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [activeLangTab, setActiveLangTab] = useState("python");

  // Lifecycle Modal
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Copy state
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchQuestionDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await practiceService.getAdminQuestionById(questionId);
      setQuestion(data);
      if (data && data.versions && data.versions.length > 0) {
        setSelectedVersionId(data.versions[0].id);
      }
    } catch (err) {
      console.error("Failed to load question details:", err);
      setError(err.message || "Failed to load question details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questionId) {
      fetchQuestionDetails();
    }
  }, [questionId]);

  const handleConfirmAction = async () => {
    if (!actionType) return;
    setActionLoading(true);
    try {
      if (actionType === "ACTIVATE") {
        await practiceService.activateQuestion(question.id);
        if (addToast) {
          addToast({
            type: "success",
            title: "Question Activated",
            message: "Question status set to ACTIVE."
          });
        }
      } else if (actionType === "ARCHIVE") {
        await practiceService.archiveQuestion(question.id);
        if (addToast) {
          addToast({
            type: "success",
            title: "Question Archived",
            message: "Question status set to ARCHIVED."
          });
        }
      }
      setActionModalOpen(false);
      fetchQuestionDetails();
    } catch (err) {
      console.error(`Failed to ${actionType.toLowerCase()} question:`, err);
      if (addToast) {
        addToast({
          type: "error",
          title: `Action Failed (${err.status || 500})`,
          message: err.message || `Could not complete ${actionType.toLowerCase()}.`
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-600">Loading question details & versions...</p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Question Not Found</h2>
        <p className="text-sm text-slate-500">{error || "The requested question does not exist."}</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/questions")}>
          Back to Question Bank
        </Button>
      </div>
    );
  }

  const selectedVersion =
    question.versions?.find((v) => v.id === selectedVersionId) || question.latestVersion;
  const isLatest = selectedVersion?.versionNumber === question.latestVersion?.versionNumber;
  const codingProblem = selectedVersion?.codingProblem;

  const starterCode = selectedVersion?.metadata?.starterCode || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(`${basePath}/questions`)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Question Bank</span>
        </button>

        <div className="flex items-center gap-2">
          {question.status === "DRAFT" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActionType("ACTIVATE");
                setActionModalOpen(true);
              }}
              className="flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Activate Question</span>
            </Button>
          )}

          {question.status === "ACTIVE" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActionType("ARCHIVE");
                setActionModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-rose-600 hover:bg-rose-50 border-rose-200"
            >
              <Archive className="w-4 h-4" />
              <span>Archive Question</span>
            </Button>
          )}
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                {question.externalId || question.id}
              </span>
              <Badge variant={question.type === "CODING" ? "primary" : "purple"} size="sm">
                {question.type}
              </Badge>
              <Badge variant={question.difficulty === "EASY" ? "success" : question.difficulty === "MEDIUM" ? "warning" : "danger"} size="sm">
                {question.difficulty}
              </Badge>
              <Badge variant={question.status === "ACTIVE" ? "success" : question.status === "DRAFT" ? "warning" : "neutral"} size="sm">
                {question.status}
              </Badge>
              {question.isGlobal ? (
                <Badge variant="blue" size="sm" className="flex items-center gap-1">
                  <Globe2 className="w-3 h-3" /> Global Scope
                </Badge>
              ) : (
                <Badge variant="primary" size="sm" className="flex items-center gap-1">
                  <Building className="w-3 h-3" /> College Scope ({question.collegeId})
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {selectedVersion?.title || "Untitled Question"}
            </h1>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
            <div>
              <div className="font-semibold text-slate-700">Namespace</div>
              <div className="font-mono text-slate-500">{question.sourceNamespace || "sips-core"}</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="font-semibold text-slate-700">Source Type</div>
              <div className="text-slate-500">{question.sourceType}</div>
            </div>
          </div>
        </div>

        {/* Tags and Category */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1">Classification:</span>
          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
            {question.category}
          </span>
          {question.subcategory && (
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
              {question.subcategory}
            </span>
          )}
          {question.tags?.map((t, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* Reference Safety & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Practice Attempts</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {question.referenceCounts?.practiceAttempts || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Delivered to students</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Contest Pinning</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {question.referenceCounts?.contests || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Contest assessments</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Code Submissions</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {question.referenceCounts?.codeSubmissions || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Judge0 executions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Immutability Status</div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mt-2 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Append-Only Versioned
          </div>
        </div>
      </div>

      {/* Version History Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Version History & Snapshot Inspector</h2>
          </div>
          <span className="text-xs text-slate-500">Total Versions: {question.versions?.length || 1}</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {question.versions?.map((v) => {
            const isSelected = v.id === selectedVersionId;
            const isCurr = v.versionNumber === question.latestVersion?.versionNumber;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVersionId(v.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-50/80 border-indigo-300 text-indigo-900 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>Version {v.versionNumber}</span>
                {isCurr ? (
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] uppercase font-bold">
                    Current
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] uppercase font-bold">
                    Historical
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400 pt-1">
          Each QuestionVersion is permanently immutable. Historical attempts pin the exact version at the time of delivery.
        </p>
      </div>

      {/* Content Preview Container */}
      {question.type === "CODING" && codingProblem ? (
        /* ================= CODING PREVIEW ================= */
        <div className="space-y-6">
          {/* Problem Statement & Limits */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Problem Statement</span>
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                <span>Time Limit: {codingProblem.timeLimitMs}ms</span>
                <span>•</span>
                <span>Memory: {Math.round(codingProblem.memoryLimitKb / 1024)}MB</span>
                <span>•</span>
                <span>Max Marks: {codingProblem.maxMarks}</span>
              </div>
            </div>

            <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {selectedVersion.statement}
            </div>

            {codingProblem.constraints && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Constraints</div>
                <pre className="font-mono text-slate-700 whitespace-pre-wrap">{codingProblem.constraints}</pre>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {codingProblem.inputFormat && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Input Format</div>
                  <pre className="font-mono text-slate-700 whitespace-pre-wrap">{codingProblem.inputFormat}</pre>
                </div>
              )}
              {codingProblem.outputFormat && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Output Format</div>
                  <pre className="font-mono text-slate-700 whitespace-pre-wrap">{codingProblem.outputFormat}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Starter Code Viewer */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-600" />
                <span>Multi-Language Starter Code</span>
              </h2>

              <div className="flex items-center gap-2">
                {["python", "cpp", "java", "javascript"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLangTab(lang)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeLangTab === lang
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-200 overflow-x-auto">
              <button
                onClick={() => handleCopy(starterCode[activeLangTab] || "")}
                className="absolute top-3 right-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                title="Copy code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <pre>{starterCode[activeLangTab] || `// No starter code defined for ${activeLangTab}`}</pre>
            </div>
          </div>

          {/* Test Cases Suite (Public & Hidden) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <span>Evaluation Test Cases Suite</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Admin view reveals both public samples and hidden test cases with expected outputs and weights.
                </p>
              </div>
              <Badge variant="primary" size="sm">Admin Authorized</Badge>
            </div>

            <div className="space-y-4">
              {codingProblem.testCases?.map((tc, idx) => (
                <div
                  key={tc.id || idx}
                  className={`p-4 rounded-xl border space-y-2 ${
                    tc.isHidden
                      ? "bg-amber-50/40 border-amber-200/80"
                      : "bg-slate-50/70 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-800">
                        Test Case #{tc.order || idx + 1}
                      </span>
                      {tc.isHidden ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[11px] font-semibold">
                          <Lock className="w-3 h-3" /> Hidden Test
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[11px] font-semibold">
                          <Unlock className="w-3 h-3" /> Public Sample
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Weight: {tc.weight} pts
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Input (stdin)</div>
                      <pre className="font-mono text-slate-800 whitespace-pre-wrap mt-0.5">{tc.input}</pre>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Expected Output (stdout)</div>
                      <pre className="font-mono text-slate-800 whitespace-pre-wrap mt-0.5">{tc.expectedOutput}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ================= MCQ PREVIEW ================= */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>Question Statement & Options</span>
              </h2>
            </div>

            <div className="prose prose-slate max-w-none text-sm text-slate-800 leading-relaxed font-medium">
              {selectedVersion.statement}
            </div>

            {/* Options List */}
            <div className="space-y-2.5 pt-2">
              {selectedVersion.options?.map((opt) => {
                const isCorrect =
                  selectedVersion.correctAnswer?.id === opt.id ||
                  selectedVersion.correctAnswer === opt.id;
                return (
                  <div
                    key={opt.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm transition-colors ${
                      isCorrect
                        ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCorrect
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {opt.id}
                    </span>
                    <div className="flex-1">{opt.text}</div>
                    {isCorrect && (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] uppercase font-bold tracking-wider shrink-0">
                        Correct Answer (Admin Only)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Admin Explanation */}
            {selectedVersion.explanation && (
              <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-100 text-sm space-y-1">
                <div className="font-bold text-indigo-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Answer Explanation (Admin Authorized)</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{selectedVersion.explanation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={actionType === "ACTIVATE" ? "Activate Question" : "Archive Question"}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {actionType === "ACTIVATE"
              ? "Activating will make this question available for upcoming practice sessions and contest evaluations."
              : "Archiving will hide this question from student practice lists while preserving all existing attempt records."}
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "ACTIVATE" ? "primary" : "danger"}
              size="sm"
              onClick={handleConfirmAction}
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : actionType === "ACTIVATE" ? "Confirm Activation" : "Confirm Archival"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
