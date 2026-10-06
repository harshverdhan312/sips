import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Code2,
  HelpCircle,
  Sparkles,
  Archive,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Layers,
  ChevronRight,
  ChevronLeft,
  Eye,
  Globe,
  Tag,
  AlertCircle,
  AlertTriangle,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  PlayCircle,
  Check,
  ShieldAlert,
  Database
} from "lucide-react";
import { superAdminService } from "../../services/superAdminService";
import { useNotifications } from "../../context/NotificationContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { ProblemStatement } from "../../components/common/ProblemStatement";

export function GlobalQuestionBankPage() {
  const { showSuccess, showError } = useNotifications();
  const [searchParams] = useSearchParams();
  const shouldOpenNewModal = searchParams.get("action") === "new";

  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Selection State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(shouldOpenNewModal);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, isBulk: false, question: null });

  // Form State for New Question
  const [formType, setFormType] = useState("CODING");
  const [formTitle, setFormTitle] = useState("");
  const [formStatement, setFormStatement] = useState("");
  const [formCategory, setFormCategory] = useState("Algorithms");
  const [formDifficulty, setFormDifficulty] = useState("MEDIUM");
  const [formTags, setFormTags] = useState("arrays, dynamic-programming");
  const [formTestCases, setFormTestCases] = useState('[{"input": "2 3\\n", "output": "5\\n", "isSample": true, "explanation": "Sample test case"}]');
  const [formOptions, setFormOptions] = useState("Option A\nOption B\nOption C\nOption D");
  const [formCorrectAnswer, setFormCorrectAnswer] = useState("0");
  const [formCreating, setFormCreating] = useState(false);

  const loadQuestions = async (page = 1) => {
    try {
      setLoading(true);
      const res = await superAdminService.getGlobalQuestions({
        page,
        limit: 20,
        search,
        type: typeFilter,
        difficulty: difficultyFilter,
        status: statusFilter
      });
      setQuestions(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error("Error loading global questions:", err);
      showError("Failed to load global question bank");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedIds(new Set());
    loadQuestions(1);
  }, [typeFilter, difficultyFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSelectedIds(new Set());
    loadQuestions(1);
  };

  // Selection Logic
  const allCurrentPageSelected = useMemo(() => {
    if (questions.length === 0) return false;
    return questions.every((q) => selectedIds.has(q.id));
  }, [questions, selectedIds]);

  const someCurrentPageSelected = useMemo(() => {
    if (questions.length === 0) return false;
    return questions.some((q) => selectedIds.has(q.id)) && !allCurrentPageSelected;
  }, [questions, selectedIds, allCurrentPageSelected]);

  const handleToggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allCurrentPageSelected) {
      questions.forEach((q) => next.delete(q.id));
    } else {
      questions.forEach((q) => next.add(q.id));
    }
    setSelectedIds(next);
  };

  const handleToggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAllLoaded = () => {
    const next = new Set(questions.map((q) => q.id));
    setSelectedIds(next);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Single Actions
  const handleArchive = async (question) => {
    try {
      setActionLoadingId(question.id);
      const res = await superAdminService.archiveGlobalQuestion(question.id);
      showSuccess(res.message || "Question archived successfully");
      loadQuestions(pagination.page);
    } catch (err) {
      showError(err.message || "Failed to archive question");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleActivate = async (question) => {
    try {
      setActionLoadingId(question.id);
      const res = await superAdminService.activateGlobalQuestion(question.id);
      showSuccess(res.message || "Question published & active in Practice Hub!");
      loadQuestions(pagination.page);
    } catch (err) {
      showError(err.message || "Failed to activate question");
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmSingleDelete = (question) => {
    setDeleteModalState({ isOpen: true, isBulk: false, question });
  };

  const confirmBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setDeleteModalState({ isOpen: true, isBulk: true, question: null });
  };

  const executeDelete = async () => {
    try {
      if (deleteModalState.isBulk) {
        setBulkActionLoading(true);
        const idsArray = Array.from(selectedIds);
        const res = await superAdminService.bulkDeleteGlobalQuestions(idsArray);
        showSuccess(res.message || `Deleted ${idsArray.length} questions successfully`);
        setSelectedIds(new Set());
      } else if (deleteModalState.question) {
        setActionLoadingId(deleteModalState.question.id);
        const res = await superAdminService.deleteGlobalQuestion(deleteModalState.question.id);
        showSuccess(res.message || "Question deleted successfully");
        const next = new Set(selectedIds);
        next.delete(deleteModalState.question.id);
        setSelectedIds(next);
      }
      setDeleteModalState({ isOpen: false, isBulk: false, question: null });
      loadQuestions(pagination.page);
    } catch (err) {
      showError(err.message || "Failed to delete question(s)");
    } finally {
      setBulkActionLoading(false);
      setActionLoadingId(null);
    }
  };

  // Bulk Actions
  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;
    try {
      setBulkActionLoading(true);
      const idsArray = Array.from(selectedIds);
      const res = await superAdminService.bulkActivateGlobalQuestions(idsArray);
      showSuccess(res.message || `Activated and published ${idsArray.length} questions to Practice Hub!`);
      loadQuestions(pagination.page);
    } catch (err) {
      showError(err.message || "Failed to activate selected questions");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;
    try {
      setBulkActionLoading(true);
      const idsArray = Array.from(selectedIds);
      const res = await superAdminService.bulkArchiveGlobalQuestions(idsArray);
      showSuccess(res.message || `Archived ${idsArray.length} questions.`);
      loadQuestions(pagination.page);
    } catch (err) {
      showError(err.message || "Failed to archive selected questions");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formStatement.trim()) {
      showError("Title and problem statement are required.");
      return;
    }

    try {
      setFormCreating(true);
      let parsedTestCases = [];
      if (formType === "CODING" && formTestCases.trim()) {
        try {
          parsedTestCases = JSON.parse(formTestCases);
        } catch (e) {
          showError("Invalid JSON in Test Cases. Please provide a valid JSON array.");
          setFormCreating(false);
          return;
        }
      }

      const tagsArray = formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: formTitle.trim(),
        statement: formStatement.trim(),
        type: formType,
        category: formCategory.trim(),
        difficulty: formDifficulty,
        tags: tagsArray,
        isGlobal: true,
        testCases: parsedTestCases,
        options: formType === "MCQ" ? formOptions.split("\n").filter(Boolean) : null,
        correctAnswer: formType === "MCQ" ? parseInt(formCorrectAnswer, 10) : null
      };

      const res = await superAdminService.createGlobalQuestion(payload);
      showSuccess(res.message || "Global question added to platform universal bank and Practice Hub!");
      setIsAddModalOpen(false);
      setFormTitle("");
      setFormStatement("");
      loadQuestions(1);
    } catch (err) {
      showError(err.message || "Failed to create global question");
    } finally {
      setFormCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
            <Globe className="w-4 h-4" />
            Universal Question Bank & Practice Hub Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Question Bank Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage, curate, select, publish, and delete benchmark coding questions & MCQs across the student Practice Hub and College Assessments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => loadQuestions(pagination.page)}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            Add Question
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card padding="p-4" className="space-y-3 shadow-sm border-slate-200/80">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            {[
              { id: "ALL", label: "All Questions" },
              { id: "ACTIVE", label: "Live in Practice Hub" },
              { id: "ARCHIVED", label: "Archived" }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, tag, category, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-20 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-2.5 py-1 text-[11px] font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Secondary filters: Type & Difficulty */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Type:</span>
              {["ALL", "CODING", "MCQ"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    typeFilter === t ? "bg-purple-600 text-white font-bold" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Difficulty:</span>
              {["ALL", "EASY", "MEDIUM", "HARD"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficultyFilter(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    difficultyFilter === d ? "bg-purple-600 text-white font-bold" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
            <Database className="w-3.5 h-3.5 text-purple-600" />
            <span>
              Showing <strong className="text-slate-900">{questions.length}</strong> of <strong className="text-slate-900">{pagination.total}</strong> questions
            </span>
          </div>
        </div>
      </Card>

      {/* Master Selection Toolbar */}
      {questions.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-purple-600 transition-colors"
            >
              {allCurrentPageSelected ? (
                <CheckSquare className="w-4 h-4 text-purple-600" />
              ) : someCurrentPageSelected ? (
                <MinusSquare className="w-4 h-4 text-purple-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All on Page ({questions.length})</span>
            </button>

            {selectedIds.size > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                {selectedIds.size} Selected
              </span>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllLoaded}
                className="text-xs font-medium text-purple-700 hover:underline"
              >
                Select all loaded
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Questions List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-600" />
          Loading questions from database...
        </div>
      ) : questions.length === 0 ? (
        <Card padding="p-16" className="text-center shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No questions match your criteria</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords, clearing status filters, or add new benchmark questions.
          </p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {questions.map((q) => {
            const isSelected = selectedIds.has(q.id);
            const isCoding = q.type === "CODING";
            const isArchived = q.status === "ARCHIVED";
            const isActive = q.status === "ACTIVE";

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected
                    ? "bg-purple-50/60 border-purple-300 shadow-sm ring-1 ring-purple-400/30"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Select Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleSelectOne(q.id)}
                    className="mt-0.5 text-slate-400 hover:text-purple-600 transition-colors shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                    )}
                  </button>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Type Badge */}
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
                          isCoding ? "bg-blue-50 text-blue-700 border border-blue-200/60" : "bg-amber-50 text-amber-700 border border-amber-200/60"
                        }`}
                      >
                        {isCoding ? <Code2 className="w-3 h-3" /> : <HelpCircle className="w-3 h-3" />}
                        {q.type}
                      </span>

                      {/* Question Title */}
                      <h4
                        onClick={() => setSelectedQuestion(q)}
                        className="font-bold text-sm text-slate-900 hover:text-purple-700 cursor-pointer truncate max-w-xl"
                      >
                        {q.latestTitle || q.title || q.externalId || "Untitled Question"}
                      </h4>

                      {/* Difficulty Badge */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.difficulty === "EASY"
                            ? "bg-emerald-100 text-emerald-800"
                            : q.difficulty === "MEDIUM"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {q.difficulty}
                      </span>

                      {/* Status / Hub Badge */}
                      {isActive ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          Live in Practice Hub
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Archived / Hidden
                        </span>
                      )}

                      {/* Global Badge */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        GLOBAL
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Category: <strong className="text-slate-700">{q.category || "General"}</strong></span>
                      {q.sourceNamespace && (
                        <>
                          <span>•</span>
                          <span>Source: <code className="text-indigo-600 font-mono text-[11px]">{q.sourceNamespace}</code></span>
                        </>
                      )}
                      {q.tags && q.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            {q.tags.slice(0, 4).map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600">
                                #{tag}
                              </span>
                            ))}
                            {q.tags.length > 4 && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                +{q.tags.length - 4} more
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Eye}
                    onClick={() => setSelectedQuestion(q)}
                    className="text-slate-600 hover:text-purple-600"
                  >
                    Details
                  </Button>

                  {isArchived ? (
                    <Button
                      variant="outline"
                      size="xs"
                      icon={CheckCircle2}
                      onClick={() => handleActivate(q)}
                      loading={actionLoadingId === q.id}
                      className="text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                      title="Publish and make live in Practice Hub"
                    >
                      Publish
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="xs"
                      icon={Archive}
                      onClick={() => handleArchive(q)}
                      loading={actionLoadingId === q.id}
                      className="text-slate-600 hover:text-amber-600 hover:border-amber-300"
                      title="Archive from Practice Hub"
                    >
                      Archive
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="xs"
                    icon={Trash2}
                    onClick={() => confirmSingleDelete(q)}
                    loading={actionLoadingId === q.id}
                    className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                    title="Hard delete question from database"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 text-xs text-slate-500 bg-white p-4 rounded-xl border border-slate-200">
          <span>
            Page <strong className="text-slate-900">{pagination.page}</strong> of <strong className="text-slate-900">{pagination.totalPages}</strong> ({pagination.total} items)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              icon={ChevronLeft}
              disabled={pagination.page <= 1}
              onClick={() => loadQuestions(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              icon={ChevronRight}
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadQuestions(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* FLOATING BULK ACTIONS TOOLBAR */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 animate-bounce-short">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
            <span className="w-6 h-6 rounded-full bg-purple-500/30 text-purple-300 font-black text-xs flex items-center justify-center">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold text-slate-200">
              Questions Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="xs"
              icon={CheckCircle2}
              onClick={handleBulkActivate}
              loading={bulkActionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Publish to Practice Hub
            </Button>

            <Button
              variant="outline"
              size="xs"
              icon={Archive}
              onClick={handleBulkArchive}
              loading={bulkActionLoading}
              className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              Archive
            </Button>

            <Button
              variant="outline"
              size="xs"
              icon={Trash2}
              onClick={confirmBulkDelete}
              loading={bulkActionLoading}
              className="text-rose-400 border-rose-900/50 hover:bg-rose-950/50 hover:border-rose-700"
            >
              Delete Selected
            </Button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-1"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">
                {deleteModalState.isBulk
                  ? `Delete ${selectedIds.size} Selected Questions?`
                  : "Delete Global Question?"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {deleteModalState.isBulk
                  ? `This action will permanently delete ${selectedIds.size} questions from the PostgreSQL database, including all their versions, test cases, and coding problem references.`
                  : `Are you sure you want to permanently delete "${deleteModalState.question?.latestTitle || deleteModalState.question?.title}"? This cannot be undone.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteModalState({ isOpen: false, isBulk: false, question: null })}
                disabled={bulkActionLoading || !!actionLoadingId}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Trash2}
                onClick={executeDelete}
                loading={bulkActionLoading || !!actionLoadingId}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Global Question Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-purple-900 to-slate-900 p-6 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Add Question to Question Bank</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Universal question visible across Practice Hub and Campus Assessments.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateQuestion} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Question Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormType("CODING")}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      formType === "CODING"
                        ? "border-purple-600 bg-purple-50/50 text-purple-950 font-bold shadow-sm"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Code2 className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="text-xs">Coding Problem</div>
                      <div className="text-[10px] text-slate-500">I/O test cases & code execution</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType("MCQ")}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      formType === "MCQ"
                        ? "border-purple-600 bg-purple-50/50 text-purple-950 font-bold shadow-sm"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <HelpCircle className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="text-xs">Multiple Choice MCQ</div>
                      <div className="text-[10px] text-slate-500">Single correct choice</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Question Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Two Sum Problem / Maximum Subarray Sum"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              {/* Category & Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g., Algorithms, Data Structures, DBMS, Networks"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 bg-white"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
              </div>

              {/* Problem Statement */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Problem Statement / Markdown Text
                </label>
                <textarea
                  rows={4}
                  required
                  value={formStatement}
                  onChange={(e) => setFormStatement(e.target.value)}
                  placeholder="Describe the problem, input format, constraints, and output expectations..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-mono"
                />
              </div>

              {/* Type specific fields */}
              {formType === "CODING" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Test Cases (JSON Array)
                  </label>
                  <textarea
                    rows={3}
                    value={formTestCases}
                    onChange={(e) => setFormTestCases(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Array of objects with input, output, isSample, explanation.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Options (One per line)
                    </label>
                    <textarea
                      rows={4}
                      value={formOptions}
                      onChange={(e) => setFormOptions(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Correct Answer (0-indexed option index)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={formCorrectAnswer}
                      onChange={(e) => setFormCorrectAnswer(e.target.value)}
                      className="w-32 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                    />
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="algorithms, math, trees, dynamic-programming"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)} disabled={formCreating}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={formCreating}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                >
                  Publish to Question Bank & Practice Hub
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Details View Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[88vh] flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/20">
                    {selectedQuestion.type} • {selectedQuestion.difficulty}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
                    {selectedQuestion.status || "ACTIVE"}
                  </span>
                </div>
                <h3 className="text-lg font-bold">{selectedQuestion.latestTitle || selectedQuestion.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <p className="text-slate-400 uppercase font-bold text-[10px] mb-1.5">Problem Statement & Format</p>
                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <ProblemStatement statement={selectedQuestion.statement} />
                </div>
              </div>

              {selectedQuestion.options && selectedQuestion.options.length > 0 && (
                <div>
                  <p className="text-slate-400 uppercase font-bold text-[10px] mb-1.5">MCQ Options</p>
                  <div className="space-y-2">
                    {selectedQuestion.options.map((opt, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                        <span className="font-bold text-slate-500 text-xs">Option {idx + 1}:</span>
                        <span className="text-slate-800 font-medium">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Category</span>
                  <strong className="text-slate-800 text-xs">{selectedQuestion.category || "General"}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Source Namespace</span>
                  <strong className="text-slate-800 text-xs font-mono">{selectedQuestion.sourceNamespace || "Global"}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Total Practice Runs</span>
                  <strong className="text-slate-800 text-xs">{selectedQuestion.totalRuns || 0} Submissions</strong>
                </div>
              </div>

              {selectedQuestion.tags && selectedQuestion.tags.length > 0 && (
                <div>
                  <p className="text-slate-400 uppercase font-bold text-[10px] mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedQuestion.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-semibold">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <Button
                variant="outline"
                size="xs"
                icon={Trash2}
                onClick={() => {
                  const q = selectedQuestion;
                  setSelectedQuestion(null);
                  confirmSingleDelete(q);
                }}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Delete Question
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSelectedQuestion(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
