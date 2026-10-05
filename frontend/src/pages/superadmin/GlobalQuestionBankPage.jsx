import React, { useState, useEffect } from "react";
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
  Eye,
  Globe,
  Tag,
  AlertCircle
} from "lucide-react";
import { superAdminService } from "../../services/superAdminService";
import { useNotifications } from "../../context/NotificationContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";

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
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(shouldOpenNewModal);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

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
    loadQuestions(1);
  }, [typeFilter, difficultyFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadQuestions(1);
  };

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
      showSuccess(res.message || "Question activated successfully");
      loadQuestions(pagination.page);
    } catch (err) {
      showError(err.message || "Failed to activate question");
    } finally {
      setActionLoadingId(null);
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
      showSuccess(res.message || "Global question added to platform universal bank!");
      setIsAddModalOpen(false);
      // Reset form
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">
            <Globe className="w-4 h-4" />
            Universal Content Repository
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Global Question Bank
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage centralized benchmark problems and MCQs universally available across all campus placement drives.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Add Global Question
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card padding="p-4" className="space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            {["ACTIVE", "ARCHIVED", "ALL"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {st === "ACTIVE" ? "Active Questions" : st === "ARCHIVED" ? "Archived" : "All Statuses"}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, tag, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </form>
        </div>

        {/* Secondary filters: Type & Difficulty */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px]">Type:</span>
          {["ALL", "CODING", "MCQ"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                typeFilter === t ? "bg-purple-100 text-purple-800" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t}
            </button>
          ))}

          <span className="text-slate-400 font-semibold uppercase text-[10px] ml-3">Difficulty:</span>
          {["ALL", "EASY", "MEDIUM", "HARD"].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficultyFilter(d)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                difficultyFilter === d ? "bg-purple-100 text-purple-800" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {d}
            </button>
          ))}

          <span className="ml-auto text-slate-400 font-medium text-xs">
            Showing {questions.length} of {pagination.total} global questions
          </span>
        </div>
      </Card>

      {/* Questions Table / List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-600" />
          Loading questions...
        </div>
      ) : questions.length === 0 ? (
        <Card padding="p-16" className="text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No questions found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or filters, or add a new global question using the button above.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {questions.map((q) => {
            const isCoding = q.type === "CODING";
            const isArchived = q.status === "ARCHIVED";

            return (
              <Card
                key={q.id}
                padding="p-4"
                className="hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
                        isCoding ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {isCoding ? <Code2 className="w-3 h-3" /> : <HelpCircle className="w-3 h-3" />}
                      {q.type}
                    </span>

                    <h4 className="font-bold text-sm text-slate-900 truncate">
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

                    {/* Global Badge */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                      GLOBAL
                    </span>

                    {isArchived && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                        ARCHIVED
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Category: <strong className="text-slate-700">{q.category || "General"}</strong></span>
                    {q.sourceNamespace && (
                      <>
                        <span>•</span>
                        <span>Source: <code className="text-indigo-600">{q.sourceNamespace}</code></span>
                      </>
                    )}
                    {q.tags && q.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          {q.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] text-slate-600">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={Eye}
                    onClick={() => setSelectedQuestion(q)}
                  >
                    View Details
                  </Button>

                  {isArchived ? (
                    <Button
                      variant="outline"
                      size="xs"
                      icon={CheckCircle2}
                      onClick={() => handleActivate(q)}
                      loading={actionLoadingId === q.id}
                      className="text-emerald-600 hover:bg-emerald-50 border-emerald-200"
                    >
                      Activate
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="xs"
                      icon={Archive}
                      onClick={() => handleArchive(q)}
                      loading={actionLoadingId === q.id}
                      className="text-slate-600 hover:text-rose-600 hover:border-rose-300"
                    >
                      Archive
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 text-xs text-slate-500">
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              disabled={pagination.page <= 1}
              onClick={() => loadQuestions(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadQuestions(pagination.page + 1)}
            >
              Next
            </Button>
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
                  <h3 className="text-lg font-bold">Add Global Benchmark Question</h3>
                  <p className="text-xs text-slate-300 mt-0.5">Visible across all campus tenants and assessment builders.</p>
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
                  placeholder="e.g., Maximum Subarray Sum (Kadane's Algorithm)"
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
                    placeholder="e.g., Dynamic Programming, Graph Theory"
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
                  placeholder="algorithms, math, trees"
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
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Publish Global Question
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Details View Drawer / Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/20">
                  {selectedQuestion.type} • {selectedQuestion.difficulty}
                </span>
                <h3 className="text-lg font-bold mt-1.5">{selectedQuestion.latestTitle || selectedQuestion.title}</h3>
              </div>
              <Button variant="ghost" size="xs" onClick={() => setSelectedQuestion(null)} className="text-slate-400 hover:text-white">
                ✕
              </Button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <p className="text-slate-400 uppercase font-semibold text-[10px] mb-1">Problem Statement</p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 whitespace-pre-wrap font-mono leading-relaxed">
                  {selectedQuestion.statement || "No statement text provided."}
                </div>
              </div>

              {selectedQuestion.options && selectedQuestion.options.length > 0 && (
                <div>
                  <p className="text-slate-400 uppercase font-semibold text-[10px] mb-1">MCQ Options</p>
                  <div className="space-y-1.5">
                    {selectedQuestion.options.map((opt, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                        <span className="font-bold text-slate-500">[{idx + 1}]</span>
                        <span className="text-slate-800">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-slate-50 text-slate-600">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Category</span>
                  <strong>{selectedQuestion.category || "General"}</strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 text-slate-600">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Namespace</span>
                  <strong>{selectedQuestion.sourceNamespace || "Global"}</strong>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
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
