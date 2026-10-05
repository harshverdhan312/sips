import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle2,
  Archive,
  Plus,
  Trash2,
  Search,
  Code2,
  BookOpen,
  Layers,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  FileCode2,
  Check,
  ChevronRight,
  Sparkles,
  Briefcase,
  BarChart3
} from "lucide-react";
import { practiceService } from "../../services/practiceService";
import { placementService } from "../../services/placementService";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { useNotifications } from "../../context/NotificationContext";

export function AssessmentBuilderPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/placement") ? "/placement" : location.pathname.startsWith("/institution") ? "/institution" : "/admin";
  const { addToast } = useNotifications();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drive Association State
  const [drivesList, setDrivesList] = useState([]);
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [selectedDriveId, setSelectedDriveId] = useState("");
  const [driveLoading, setDriveLoading] = useState(false);

  // Add Question Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [bankTypeFilter, setBankTypeFilter] = useState("ALL");
  const [bankCategoryFilter, setBankCategoryFilter] = useState("ALL");
  const [bankDifficultyFilter, setBankDifficultyFilter] = useState("ALL");
  const [bankPage, setBankPage] = useState(1);
  const [bankLimit] = useState(15);
  const [bankPagination, setBankPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });

  // Selected Question to Add
  const [selectedBankQuestion, setSelectedBankQuestion] = useState(null);
  const [addPayload, setAddPayload] = useState({
    section: "APTITUDE",
    marks: 2.0,
    negativeMarks: 0.0
  });
  const [addingLoading, setAddingLoading] = useState(false);

  // Publish Modal State
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  useEffect(() => {
    placementService.getJobs()
      .then((jobs) => setDrivesList(Array.isArray(jobs) ? jobs : []))
      .catch(() => setDrivesList([]));
  }, []);

  const fetchAssessment = useCallback(async () => {
    if (!assessmentId || assessmentId === "undefined") {
      setError("No valid assessment ID provided.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await practiceService.getAssessmentById(assessmentId);
      const data = res?.data && res.data.id ? res.data : res;
      setAssessment(data);
    } catch (err) {
      console.error("Failed to load assessment:", err);
      setError(err.message || "Failed to load assessment details.");
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    if (assessmentId && assessmentId !== "undefined") {
      fetchAssessment();
    }
  }, [assessmentId, fetchAssessment]);

  // Load Active Questions from Question Bank for selection
  const fetchBankQuestions = useCallback(async () => {
    setBankLoading(true);
    try {
      const res = await practiceService.getAdminQuestions({
        status: "ACTIVE",
        search: bankSearch,
        type: bankTypeFilter,
        category: bankCategoryFilter,
        difficulty: bankDifficultyFilter,
        page: bankPage,
        limit: bankLimit
      });
      if (res && res.data) {
        // Filter out already pinned questions
        const pinnedVersionIds = new Set(assessment?.questions?.map((q) => q.questionVersionId) || []);
        const filtered = res.data.filter((q) => !pinnedVersionIds.has(q.id));
        setBankQuestions(filtered);
        if (res.pagination) {
          setBankPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error("Failed to load question bank:", err);
    } finally {
      setBankLoading(false);
    }
  }, [bankSearch, bankTypeFilter, bankCategoryFilter, bankDifficultyFilter, bankPage, bankLimit, assessment]);

  useEffect(() => {
    if (addModalOpen) {
      fetchBankQuestions();
    }
  }, [addModalOpen, fetchBankQuestions]);

  const handleSelectBankQuestion = (q) => {
    setSelectedBankQuestion(q);
    const defaultSection = q.type === "CODING" ? "CODING" : q.type === "TECHNICAL" ? "TECHNICAL" : "APTITUDE";
    const defaultMarks = q.type === "CODING" ? 50.0 : 2.0;
    setAddPayload({
      section: defaultSection,
      marks: defaultMarks,
      negativeMarks: 0.0
    });
  };

  const handleAddQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBankQuestion) return;

    // We need the latest version ID from the selected question
    // If the list item has id as questionId, let's fetch question details to get latest versionId
    setAddingLoading(true);
    try {
      const qDetail = await practiceService.getAdminQuestionById(selectedBankQuestion.id);
      const versionId = qDetail.latestVersion?.id || qDetail.versions?.[0]?.id;

      if (!versionId) {
        throw new Error("Could not resolve QuestionVersion ID.");
      }

      await practiceService.addQuestionToAssessment(assessment.id, {
        questionVersionId: versionId,
        section: addPayload.section,
        marks: parseFloat(addPayload.marks) || 1.0,
        negativeMarks: parseFloat(addPayload.negativeMarks) || 0.0
      });

      if (addToast) {
        addToast({
          type: "success",
          title: "Question Pinned",
          message: `Added '${qDetail.latestVersion?.title || selectedBankQuestion.title}' to ${addPayload.section}.`
        });
      }

      setSelectedBankQuestion(null);
      fetchAssessment();
      fetchBankQuestions();
    } catch (err) {
      console.error("Failed to add question to assessment:", err);
      if (addToast) {
        addToast({
          type: "error",
          title: "Failed to Add Question",
          message: err.message || "Could not pin question."
        });
      }
    } finally {
      setAddingLoading(false);
    }
  };

  const handleRemoveQuestion = async (aqId) => {
    if (!confirm("Are you sure you want to remove this question from the assessment?")) return;

    try {
      await practiceService.removeQuestionFromAssessment(assessment.id, aqId);
      if (addToast) {
        addToast({
          type: "success",
          title: "Question Removed",
          message: "Question removed from assessment."
        });
      }
      fetchAssessment();
    } catch (err) {
      console.error("Failed to remove question:", err);
      if (addToast) {
        addToast({
          type: "error",
          title: "Removal Failed",
          message: err.message || "Could not remove question."
        });
      }
    }
  };

  const handlePublishConfirm = async () => {
    setPublishLoading(true);
    try {
      const res = await practiceService.publishAssessment(assessment.id);
      if (addToast) {
        addToast({
          type: "success",
          title: "Assessment Published",
          message: "Assessment is now published and locked for evaluation."
        });
      }
      setPublishModalOpen(false);
      fetchAssessment();
    } catch (err) {
      console.error("Failed to publish assessment:", err);
      if (addToast) {
        addToast({
          type: "error",
          title: `Publish Failed (${err.status || 422})`,
          message: err.message || "Could not publish assessment."
        });
      }
    } finally {
      setPublishLoading(false);
    }
  };

  const handleAssociateDriveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDriveId) return;

    setDriveLoading(true);
    try {
      await practiceService.associateDriveToAssessment(assessment.id, selectedDriveId);
      if (addToast) {
        addToast({
          type: "success",
          title: "Placement Drive Linked",
          message: "Placement drive associated with assessment successfully."
        });
      }
      setDriveModalOpen(false);
      fetchAssessment();
    } catch (err) {
      console.error("Failed to associate placement drive:", err);
      if (addToast) {
        addToast({
          type: "error",
          title: "Drive Link Failed",
          message: err.message || "Could not associate placement drive."
        });
      }
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDisassociateDriveSubmit = async () => {
    if (!confirm("Are you sure you want to remove the placement drive link from this assessment?")) return;

    setDriveLoading(true);
    try {
      await practiceService.disassociateDriveFromAssessment(assessment.id);
      if (addToast) {
        addToast({
          type: "success",
          title: "Placement Drive Unlinked",
          message: "Placement drive disassociated successfully."
        });
      }
      setDriveModalOpen(false);
      fetchAssessment();
    } catch (err) {
      console.error("Failed to disassociate placement drive:", err);
      if (addToast) {
        addToast({
          type: "error",
          title: "Unlink Failed",
          message: err.message || "Could not remove drive association."
        });
      }
    } finally {
      setDriveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-600">Loading Assessment Studio...</p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Assessment Not Found</h2>
        <p className="text-sm text-slate-500">{error || "The requested assessment blueprint does not exist."}</p>
        <Button variant="outline" size="sm" onClick={() => navigate(`${basePath}/assessments`)}>
          Back to Assessments
        </Button>
      </div>
    );
  }

  const isPublished = assessment.status === "PUBLISHED";
  const isArchived = assessment.status === "ARCHIVED";
  const isDraft = assessment.status === "DRAFT";

  // Group questions by section
  const aptitudeQuestions = assessment.questions?.filter((q) => q.section === "APTITUDE") || [];
  const technicalQuestions = assessment.questions?.filter((q) => q.section === "TECHNICAL") || [];
  const codingQuestions = assessment.questions?.filter((q) => q.section === "CODING") || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(`${basePath}/assessments`)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assessments</span>
        </button>

        <div className="flex items-center gap-3">
          {isDraft && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Questions</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setPublishModalOpen(true)}
                disabled={!assessment.questions || assessment.questions.length === 0}
                className="flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Publish Blueprint</span>
              </Button>
            </>
          )}

          {isPublished && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`${basePath}/assessments/${assessment.id}/results`)}
                className="flex items-center gap-1.5 shadow-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Candidate Results</span>
              </Button>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <Lock className="w-3.5 h-3.5" />
                <span>Published & Locked</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assessment Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="primary" size="sm">{assessment.type || "PLACEMENT_ASSESSMENT"}</Badge>
              <Badge variant={isPublished ? "success" : isDraft ? "warning" : "neutral"} size="sm">
                {assessment.status || "DRAFT"}
              </Badge>
              {assessment.isGlobal ? (
                <Badge variant="blue" size="sm">Global Scope</Badge>
              ) : (
                <Badge variant="primary" size="sm">College Scope {assessment.collegeId ? `(${assessment.collegeId})` : ""}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{assessment.title || "Untitled Assessment"}</h1>
            {assessment.description && (
              <p className="text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">{assessment.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Duration</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{assessment.durationMinutes || 60}m</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Questions</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{assessment.questions?.length ?? assessment.questionCount ?? 0}</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Marks</div>
              <div className="text-base font-bold text-indigo-600 mt-0.5">{assessment.totalMarks ?? 0} pts</div>
            </div>
          </div>
        </div>

        {/* Placement Drive Association Banner */}
        {assessment.type === "PLACEMENT_ASSESSMENT" && (
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Placement Drive Link</span>
                  <Badge variant={assessment.placementDrive?.status === "ACTIVE" ? "success" : "neutral"} size="xs">
                    {assessment.placementDrive?.status || "LINKED"}
                  </Badge>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {assessment.placementDrive?.company
                    ? `${assessment.placementDrive.company} — ${assessment.placementDrive.title || assessment.placementDrive.role}`
                    : (assessment.sipsDriveId ? `Drive ID: ${assessment.sipsDriveId}` : "No Drive Linked Yet")}
                </p>
                {assessment.placementDrive?.deadline && (
                  <p className="text-xs text-slate-500">
                    Deadline: {new Date(assessment.placementDrive.deadline).toLocaleDateString()} | Min CGPA: {assessment.placementDrive.minCgpa || "N/A"}
                  </p>
                )}
              </div>
            </div>
            {isDraft && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  setSelectedDriveId(assessment.sipsDriveId || "");
                  setDriveModalOpen(true);
                }}
                className="bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 shrink-0"
              >
                {assessment.sipsDriveId ? "Change Drive Association" : "Link Placement Drive"}
              </Button>
            )}
          </div>
        )}

        {/* Section Metrics Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-900">Aptitude Section</div>
              <div className="text-xs text-emerald-700">{assessment.sectionBreakdown?.APTITUDE?.count || 0} questions</div>
            </div>
            <div className="text-sm font-bold text-emerald-800">{assessment.sectionBreakdown?.APTITUDE?.marks || 0} pts</div>
          </div>

          <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-sky-900">Technical Section</div>
              <div className="text-xs text-sky-700">{assessment.sectionBreakdown?.TECHNICAL?.count || 0} questions</div>
            </div>
            <div className="text-sm font-bold text-sky-800">{assessment.sectionBreakdown?.TECHNICAL?.marks || 0} pts</div>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-indigo-900">Coding Section</div>
              <div className="text-xs text-indigo-700">{assessment.sectionBreakdown?.CODING?.count || 0} questions</div>
            </div>
            <div className="text-sm font-bold text-indigo-800">{assessment.sectionBreakdown?.CODING?.marks || 0} pts</div>
          </div>
        </div>
      </div>

      {/* Questions Assembly Sections */}
      <div className="space-y-6">
        {/* Helper component for rendering a section */}
        {[
          { key: "APTITUDE", title: "Aptitude Section", icon: BookOpen, color: "emerald", list: aptitudeQuestions },
          { key: "TECHNICAL", title: "Technical Section", icon: Layers, color: "sky", list: technicalQuestions },
          { key: "CODING", title: "Coding Arena Section", icon: Code2, color: "indigo", list: codingQuestions }
        ].map((sec) => (
          <div key={sec.key} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <sec.icon className="w-5 h-5 text-slate-600" />
                <h2 className="text-base font-bold text-slate-900">{sec.title}</h2>
                <span className="text-xs font-semibold text-slate-500">
                  ({sec.list.length} {sec.list.length === 1 ? "question" : "questions"})
                </span>
              </div>

              {isDraft && (
                <button
                  onClick={() => {
                    setAddPayload({ ...addPayload, section: sec.key });
                    setAddModalOpen(true);
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to {sec.key}</span>
                </button>
              )}
            </div>

            {sec.list.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                No questions assembled in this section yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sec.list.map((aq, idx) => {
                  const qv = aq.questionVersion || {};
                  const qObj = qv.question || {};
                  return (
                    <div key={aq.id || idx} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-400 font-mono">
                            #{aq.order || idx + 1}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {qObj.externalId || qv.externalId || qv.id?.slice(0, 10) || aq.id?.slice(0, 10) || "Q"}
                          </span>
                          <Badge variant="neutral" size="sm">{qv.versionNumber ? `v${qv.versionNumber} (Pinned)` : "Pinned"}</Badge>
                          <Badge variant={(qObj.difficulty || qv.difficulty) === "EASY" ? "success" : (qObj.difficulty || qv.difficulty) === "MEDIUM" ? "warning" : "danger"} size="sm">
                            {qObj.difficulty || qv.difficulty || "EASY"}
                          </Badge>
                        </div>

                        <div className="font-semibold text-sm text-slate-900">
                          {qv.title || "Untitled Question"}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 max-w-2xl">
                          {qv.statement || ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900">{aq.marks ?? 1} marks</div>
                          {Number(aq.negativeMarks) > 0 && (
                            <div className="text-[11px] text-rose-500 font-medium">-{aq.negativeMarks} neg</div>
                          )}
                        </div>

                        {isDraft && (
                          <button
                            onClick={() => handleRemoveQuestion(aq.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Questions Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Pin Question from Question Bank"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4 max-h-[78vh] flex flex-col">
          {/* Bank Filters Bar */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5 shrink-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by title, external ID (e.g. nc-001-two-sum, quant-tw-01), or topic..."
                  value={bankSearch}
                  onChange={(e) => {
                    setBankSearch(e.target.value);
                    setBankPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBankSearch("");
                    setBankTypeFilter("ALL");
                    setBankCategoryFilter("ALL");
                    setBankDifficultyFilter("ALL");
                    setBankPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Type Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Question Type</label>
                <select
                  value={bankTypeFilter}
                  onChange={(e) => {
                    setBankTypeFilter(e.target.value);
                    setBankPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="APTITUDE">Aptitude MCQ</option>
                  <option value="TECHNICAL">Technical MCQ</option>
                  <option value="CODING">Coding Arena</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Category / Domain</label>
                <select
                  value={bankCategoryFilter}
                  onChange={(e) => {
                    setBankCategoryFilter(e.target.value);
                    setBankPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Categories (1200+ Qs)</option>
                  <option value="QUANTITATIVE">Quantitative Aptitude</option>
                  <option value="LOGICAL">Logical Reasoning</option>
                  <option value="VERBAL">Verbal Ability</option>
                  <option value="DSA">Data Structures & Algorithms</option>
                  <option value="DBMS">Database Management (DBMS)</option>
                  <option value="OS">Operating Systems (OS)</option>
                  <option value="NETWORKS">Computer Networks</option>
                  <option value="OOP">Object Oriented Programming</option>
                  <option value="SQL">SQL & Relational</option>
                  <option value="DATA_INTERPRETATION">Data Interpretation</option>
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Difficulty</label>
                <select
                  value={bankDifficultyFilter}
                  onChange={(e) => {
                    setBankDifficultyFilter(e.target.value);
                    setBankPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Difficulties</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Question List to select */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[42vh] border border-slate-100 rounded-xl p-1.5 bg-slate-50/50">
            {bankLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                <span>Loading Question Bank...</span>
              </div>
            ) : bankQuestions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                <BookOpen className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">No matching active questions available.</p>
                <p className="text-[11px] text-slate-400">Try adjusting your search query, type, or category filter.</p>
              </div>
            ) : (
              bankQuestions.map((q) => {
                const isSelected = selectedBankQuestion?.id === q.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => handleSelectBankQuestion(q)}
                    className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/90 border-indigo-400 shadow-xs ring-1 ring-indigo-400/40"
                        : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-2xs"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                          {q.externalId || q.id.slice(0, 8)}
                        </span>
                        <Badge variant="neutral" size="sm">{q.type}</Badge>
                        <Badge variant={q.difficulty === "EASY" ? "success" : q.difficulty === "MEDIUM" ? "warning" : "danger"} size="sm">
                          {q.difficulty}
                        </Badge>
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          {q.category}
                        </span>
                        {q.subcategory && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            • {q.subcategory}
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                          <Check className="w-3 h-3 text-indigo-600" /> Selected
                        </span>
                      )}
                    </div>

                    <div className="font-semibold text-slate-900 text-sm">{q.title}</div>
                    {q.statement && (
                      <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {q.statement}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Pagination Bar */}
          {!bankLoading && bankQuestions.length > 0 && (
            <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-500 shrink-0">
              <div>
                Showing <span className="font-semibold text-slate-800">{(bankPage - 1) * bankLimit + 1}</span> to{" "}
                <span className="font-semibold text-slate-800">{Math.min(bankPage * bankLimit, bankPagination.total)}</span> of{" "}
                <span className="font-semibold text-slate-800">{bankPagination.total}</span> questions
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBankPage((p) => Math.max(1, p - 1))}
                  disabled={bankPage <= 1}
                  className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium cursor-pointer"
                >
                  Previous
                </button>
                <span className="font-semibold text-slate-700 px-1">
                  {bankPage} / {bankPagination.totalPages || 1}
                </span>
                <button
                  type="button"
                  onClick={() => setBankPage((p) => Math.min(bankPagination.totalPages || 1, p + 1))}
                  disabled={bankPage >= (bankPagination.totalPages || 1)}
                  className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Configuration for selected question */}
          {selectedBankQuestion && (
            <form onSubmit={handleAddQuestionSubmit} className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-100 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-indigo-950 truncate max-w-lg">
                  Configure Pinning: <span className="text-indigo-700">{selectedBankQuestion.title}</span>
                </div>
                <Badge variant="primary" size="sm">{selectedBankQuestion.category}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Section</label>
                  <select
                    value={addPayload.section}
                    onChange={(e) => setAddPayload({ ...addPayload, section: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="APTITUDE">Aptitude Section</option>
                    <option value="TECHNICAL">Technical Section</option>
                    <option value="CODING">Coding Section</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Marks Awarded</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={addPayload.marks}
                    onChange={(e) => setAddPayload({ ...addPayload, marks: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Negative Marks</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={addPayload.negativeMarks}
                    onChange={(e) => setAddPayload({ ...addPayload, negativeMarks: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={addingLoading}
                  className="w-full font-semibold shadow-xs"
                >
                  {addingLoading ? "Pinning..." : "Pin Question to Assessment"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Publish Confirmation Modal */}
      <Modal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Publish Assessment Blueprint"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Publishing this assessment will lock its questions, marks, and section structure permanently to ensure evaluation consistency across candidate batches.
          </p>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-900">{assessment.title}</div>
            <div className="text-slate-600">Total Questions: {assessment.questionCount} | Total Marks: {assessment.totalMarks} pts</div>
            <div className="text-slate-600">Duration: {assessment.durationMinutes} minutes</div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPublishModalOpen(false)}
              disabled={publishLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePublishConfirm}
              disabled={publishLoading}
            >
              {publishLoading ? "Publishing..." : "Confirm & Publish (Lock)"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Drive Association Modal */}
      <Modal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        title="Associate SIPS Placement Drive"
      >
        <form onSubmit={handleAssociateDriveSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Link this assessment to an official SIPS campus recruitment drive. Candidate eligibility (CGPA, allowed branch, deadline) will be strictly enforced during student delivery.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Campus Placement Drive <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedDriveId}
              onChange={(e) => setSelectedDriveId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Select Placement Drive from SIPS --</option>
              {drivesList.map((d) => (
                <option key={d.id || d._id} value={d.id || d._id}>
                  {d.company} — {d.title || d.role} ({d.status || (d.isActive ? "ACTIVE" : "CLOSED")})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {assessment.sipsDriveId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDisassociateDriveSubmit}
                disabled={driveLoading}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Unlink Drive
              </Button>
            ) : <div />}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDriveModalOpen(false)}
                disabled={driveLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={driveLoading || !selectedDriveId}
              >
                {driveLoading ? "Saving..." : "Save Association"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
