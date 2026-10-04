import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Filter,
  CheckCircle2,
  Archive,
  Eye,
  Code2,
  BookOpen,
  Layers,
  Shield,
  Clock,
  AlertCircle,
  RefreshCw,
  FileCode2,
  Globe2,
  Building,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
  Upload,
  FileText,
  Download,
  Plus,
  HelpCircle
} from "lucide-react";
import { practiceService } from "../../services/practiceService";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { useNotifications } from "../../context/NotificationContext";

const SAMPLE_MCQ_JSON = [
  {
    externalId: "COLLEGE-MCQ-001",
    status: "ACTIVE",
    tags: ["dsa", "arrays", "efficiency"],
    source: {
      type: "COLLEGE_CREATED",
      namespace: "college-bank"
    },
    question: {
      type: "TECHNICAL",
      format: "SINGLE_CHOICE",
      domain: "DSA",
      topic: "ARRAYS",
      difficulty: "EASY",
      title: "Time Complexity of Array Access",
      statement: "What is the time complexity to access an element by its index in a standard static array?",
      options: [
        { id: "A", text: "O(1)" },
        { id: "B", text: "O(n)" },
        { id: "C", text: "O(log n)" },
        { id: "D", text: "O(n^2)" }
      ],
      correctAnswer: { optionId: "A" },
      explanation: "Array indexing calculates memory offset directly in constant O(1) time."
    }
  }
];

const SAMPLE_CODING_JSON = [
  {
    externalId: "COLLEGE-CODE-001",
    status: "ACTIVE",
    tags: ["dsa", "arrays"],
    source: {
      type: "COLLEGE_CREATED",
      namespace: "college-bank"
    },
    question: {
      type: "CODING",
      format: "CODING",
      domain: "DSA",
      topic: "ARRAYS",
      difficulty: "EASY",
      title: "Array Sum Target",
      statement: "Given an array of integers `nums` and an integer `target`, return the sum of all elements greater than `target`.",
      constraints: "1 <= nums.length <= 10^5\n-10^9 <= nums[i], target <= 10^9",
      codingProblem: {
        allowedLanguages: ["python", "cpp", "java", "javascript"],
        timeLimitMs: 2000,
        memoryLimitKb: 256000,
        starterTemplates: {
          python: "def solve(nums: list[int], target: int) -> int:\n    # Write your solution here\n    pass\n",
          javascript: "function solve(nums, target) {\n    // Write your solution here\n}\n"
        },
        testCases: [
          { input: "[1, 2, 3, 4, 5]\n2", expectedOutput: "12", isSample: true, isHidden: false, order: 1 },
          { input: "[10, -5, 20]\n0", expectedOutput: "30", isSample: false, isHidden: true, order: 2 }
        ]
      }
    }
  }
];

export function QuestionListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/placement") ? "/placement" : "/admin";
  const { addToast } = useNotifications();

  // Filter States
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("ALL");
  const [scopeFilter, setScopeFilter] = useState("ALL");

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });

  // Data & Loading States
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showIngestionInfo, setShowIngestionInfo] = useState(false);

  // Ingestion Modal States
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);

  // Lifecycle Action Modal States
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [actionType, setActionType] = useState(null); // 'ACTIVATE' | 'ARCHIVE'
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await practiceService.getAdminQuestions({
        page,
        limit,
        search,
        type: typeFilter,
        difficulty: difficultyFilter,
        status: statusFilter,
        sourceType: sourceTypeFilter,
        scope: scopeFilter
      });

      if (res && res.data) {
        setQuestions(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error("Failed to load admin questions:", err);
      setError(err.message || "Failed to load question bank.");
      if (addToast) {
        addToast({
          type: "error",
          title: "Failed to load question bank",
          message: err.message || "Please check your network connection."
        });
      }
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, typeFilter, difficultyFilter, statusFilter, sourceTypeFilter, scopeFilter, addToast]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchQuestions();
  };

  const handleResetFilters = () => {
    setSearch("");
    setTypeFilter("ALL");
    setDifficultyFilter("ALL");
    setStatusFilter("ALL");
    setSourceTypeFilter("ALL");
    setScopeFilter("ALL");
    setPage(1);
  };

  const openActionModal = (question, type) => {
    setSelectedQuestion(question);
    setActionType(type);
    setActionModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedQuestion || !actionType) return;
    setActionLoading(true);
    try {
      if (actionType === "ACTIVATE") {
        await practiceService.activateQuestion(selectedQuestion.id);
        if (addToast) {
          addToast({
            type: "success",
            title: "Question Activated",
            message: `Question '${selectedQuestion.externalId || selectedQuestion.id}' is now ACTIVE.`
          });
        }
      } else if (actionType === "ARCHIVE") {
        await practiceService.archiveQuestion(selectedQuestion.id);
        if (addToast) {
          addToast({
            type: "success",
            title: "Question Archived",
            message: `Question '${selectedQuestion.externalId || selectedQuestion.id}' has been ARCHIVED.`
          });
        }
      }
      setActionModalOpen(false);
      fetchQuestions();
    } catch (err) {
      console.error(`Failed to ${actionType.toLowerCase()} question:`, err);
      if (addToast) {
        addToast({
          type: "error",
          title: `Action Failed (${err.status || 500})`,
          message: err.message || `Could not ${actionType.toLowerCase()} question.`
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = JSON.parse(text);
        setImportJsonText(JSON.stringify(parsed, null, 2));
        setImportError(null);
      } catch (err) {
        setImportError("Invalid JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setImportError(null);
    setImportResult(null);

    let items;
    try {
      const parsed = JSON.parse(importJsonText);
      items = Array.isArray(parsed) ? parsed : [parsed];
      if (items.length === 0) {
        throw new Error("JSON array must contain at least 1 question object.");
      }
    } catch (err) {
      setImportError("JSON Parse Error: " + err.message);
      return;
    }

    setImportLoading(true);
    try {
      const res = await practiceService.bulkImportQuestions(items);
      const data = res?.data || res;
      setImportResult(data);
      if (addToast) {
        addToast({
          type: "success",
          title: "Import Successful",
          message: `Ingested ${data.inserted || 0} questions (${data.skipped || 0} skipped, ${data.versioned || 0} updated).`
        });
      }
      fetchQuestions();
    } catch (err) {
      console.error("Failed to bulk import questions:", err);
      setImportError(err.message || "Bulk import failed.");
      if (addToast) {
        addToast({
          type: "error",
          title: "Import Failed",
          message: err.message || "Failed to ingest question dataset."
        });
      }
    } finally {
      setImportLoading(false);
    }
  };

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case "EASY":
        return <Badge variant="success" size="sm">Easy</Badge>;
      case "MEDIUM":
        return <Badge variant="warning" size="sm">Medium</Badge>;
      case "HARD":
        return <Badge variant="danger" size="sm">Hard</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{diff}</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success" size="sm">Active</Badge>;
      case "DRAFT":
        return <Badge variant="warning" size="sm">Draft</Badge>;
      case "ARCHIVED":
        return <Badge variant="neutral" size="sm">Archived</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "CODING":
        return <Code2 className="w-4 h-4 text-indigo-600" />;
      case "APTITUDE":
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case "TECHNICAL":
        return <Layers className="w-4 h-4 text-sky-600" />;
      default:
        return <FileCode2 className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Question Bank Management</h1>
            <Badge variant="primary" size="md">Admin Portal</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Inspect, audit, activate, and archive canonical MCQ and Coding questions with full version provenance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setImportJsonText(JSON.stringify(SAMPLE_MCQ_JSON, null, 2));
              setImportError(null);
              setImportResult(null);
              setImportModalOpen(true);
            }}
            className="flex items-center gap-2 shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Import Questions (JSON)</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowIngestionInfo(!showIngestionInfo)}
            className="flex items-center gap-2"
          >
            <Info className="w-4 h-4 text-slate-500" />
            <span>Ingestion Pipeline</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchQuestions}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Canonical Dataset Info Banner */}
      {showIngestionInfo && (
        <div className="p-5 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-slate-700 text-sm space-y-3 transition-all animate-in fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 font-semibold text-indigo-900">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span>Canonical Ingestion & Versioning Architecture</span>
            </div>
            <button
              onClick={() => setShowIngestionInfo(false)}
              className="text-indigo-400 hover:text-indigo-600 text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <p className="text-slate-600 leading-relaxed">
            The SIPS Practice Platform utilizes source-controlled canonical JSON datasets located at{" "}
            <code className="px-1.5 py-0.5 bg-indigo-100/70 text-indigo-800 rounded font-mono text-xs">
              practice-platform/backend/data/question-bank/
            </code>
            . Bulk imports are validated transactionally, replay-protected, and strictly versioned.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 bg-white rounded-xl border border-indigo-100/80 shadow-2xs">
              <div className="font-semibold text-slate-900 mb-1">1. Replay Idempotency</div>
              <div className="text-slate-500">Unchanged questions are automatically skipped with 0 duplicate records.</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-indigo-100/80 shadow-2xs">
              <div className="font-semibold text-slate-900 mb-1">2. Immutable Versioning</div>
              <div className="text-slate-500">Modified problem content appends Version N+1; historical versions remain immutable.</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-indigo-100/80 shadow-2xs">
              <div className="font-semibold text-slate-900 mb-1">3. Server-Authoritative Scopes</div>
              <div className="text-slate-500">Distinguishes platform Global questions vs College-specific datasets.</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, external ID (e.g. CODE-ARR-001), category, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>
          <Button type="submit" variant="primary" size="md" className="shrink-0">
            Search Questions
          </Button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {/* Type Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Types</option>
              <option value="CODING">Coding</option>
              <option value="APTITUDE">Aptitude MCQ</option>
              <option value="TECHNICAL">Technical MCQ</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Difficulty</label>
            <select
              value={difficultyFilter}
              onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Source Type Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Source Type</label>
            <select
              value={sourceTypeFilter}
              onChange={(e) => { setSourceTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Sources</option>
              <option value="ORIGINAL">Original (SIPS)</option>
              <option value="CURATED">Curated</option>
              <option value="COLLEGE_CREATED">College Created</option>
              <option value="PUBLIC_SOURCE">Public Source</option>
              <option value="THIRD_PARTY">Third Party</option>
            </select>
          </div>

          {/* Scope Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Scope</label>
            <select
              value={scopeFilter}
              onChange={(e) => { setScopeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Scopes</option>
              <option value="global">Global Only</option>
              <option value="college">College Specific</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-600">Loading Question Bank records...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-base font-semibold text-slate-900">Failed to load questions</p>
            <p className="text-sm text-slate-500 max-w-md mx-auto">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchQuestions}>Try Again</Button>
          </div>
        ) : questions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-semibold text-slate-800">No questions found</p>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              No questions matched your active filters or search criteria. Try modifying your search filters.
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>Clear Filters</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">ID / Namespace</th>
                  <th className="px-5 py-3.5">Question Title</th>
                  <th className="px-5 py-3.5">Type & Topic</th>
                  <th className="px-4 py-3.5">Difficulty</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Versions</th>
                  <th className="px-4 py-3.5">Scope</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* ID / Namespace */}
                    <td className="px-5 py-4 align-middle">
                      <div className="font-mono text-xs font-bold text-slate-900">
                        {q.externalId || q.id.slice(0, 10)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {q.sourceNamespace || "sips-core"}
                      </div>
                    </td>

                    {/* Question Title */}
                    <td className="px-5 py-4 align-middle max-w-md">
                      <div
                        onClick={() => navigate(`/admin/questions/${q.id}`)}
                        className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer truncate"
                        title={q.title}
                      >
                        {q.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-medium">
                          {q.category}
                        </span>
                        {q.subcategory && (
                          <span className="text-xs text-slate-400">
                            • {q.subcategory}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Type & Format */}
                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 text-xs">
                        {getTypeIcon(q.type)}
                        <span>{q.type}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {q.format}
                      </div>
                    </td>

                    {/* Difficulty */}
                    <td className="px-4 py-4 align-middle">
                      {getDifficultyBadge(q.difficulty)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 align-middle">
                      {getStatusBadge(q.status)}
                    </td>

                    {/* Versions */}
                    <td className="px-4 py-4 align-middle">
                      <Badge variant="neutral" size="sm">
                        v{q.latestVersionNumber} ({q.versionCount || 1})
                      </Badge>
                    </td>

                    {/* Scope */}
                    <td className="px-4 py-4 align-middle">
                      {q.isGlobal ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Globe2 className="w-3 h-3" /> Global
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                          <Building className="w-3 h-3" /> College
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`${basePath}/questions/${q.id}`)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="View Details & Versions"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {q.status === "DRAFT" && (
                          <button
                            onClick={() => openActionModal(q, "ACTIVATE")}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Activate Question"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {q.status === "ACTIVE" && (
                          <button
                            onClick={() => openActionModal(q, "ARCHIVE")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Archive Question"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && questions.length > 0 && (
          <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-semibold text-slate-800">{Math.min(page * limit, pagination.total)}</span> of{" "}
              <span className="font-semibold text-slate-800">{pagination.total}</span> questions
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold text-slate-700 px-2">
                Page {page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Activate / Archive */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={actionType === "ACTIVATE" ? "Activate Question" : "Archive Question"}
      >
        {selectedQuestion && (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{selectedQuestion.title}</div>
              <div className="font-mono text-slate-500">ID: {selectedQuestion.externalId || selectedQuestion.id}</div>
              <div className="text-slate-500">Type: {selectedQuestion.type} | Status: {selectedQuestion.status}</div>
            </div>

            {actionType === "ACTIVATE" ? (
              <p className="text-sm text-slate-600">
                Activating this question will make it available for student practice selection and placement contests.
              </p>
            ) : (
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  Archiving this question will remove it from future student practice delivery and contest pinning.
                </p>
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <strong>Reference Safety Note:</strong> Existing attempts, contest histories, and code submissions referencing this question will remain readable and preserved immutably.
                </p>
              </div>
            )}

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
        )}
      </Modal>

      {/* Bulk Import Questions Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Ingest Question Dataset (JSON)"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="text-slate-600">
              Import single questions or bulk batches directly into your institution's Question Bank.
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setImportJsonText(JSON.stringify(SAMPLE_MCQ_JSON, null, 2))}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 rounded-md font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3 h-3 text-emerald-600" />
                MCQ Sample
              </button>
              <button
                type="button"
                onClick={() => setImportJsonText(JSON.stringify(SAMPLE_CODING_JSON, null, 2))}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 rounded-md font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Code2 className="w-3 h-3 text-indigo-600" />
                Coding Sample
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Upload .json file or paste raw JSON</label>
              <label className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>Upload JSON file</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <textarea
              rows={12}
              required
              value={importJsonText}
              onChange={(e) => {
                setImportJsonText(e.target.value);
                setImportError(null);
              }}
              placeholder="Paste JSON array containing question definitions here..."
              className="w-full px-3 py-2.5 font-mono text-xs bg-slate-900 text-emerald-400 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {importError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{importError}</div>
            </div>
          )}

          {importResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Ingestion Completed Successfully
              </div>
              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="p-2 bg-white rounded-lg border border-emerald-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Inserted</div>
                  <div className="text-base font-bold text-emerald-700 mt-0.5">{importResult.inserted || 0}</div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Versioned</div>
                  <div className="text-base font-bold text-indigo-700 mt-0.5">{importResult.versioned || 0}</div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Skipped</div>
                  <div className="text-base font-bold text-slate-600 mt-0.5">{importResult.skipped || 0}</div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Failed</div>
                  <div className="text-base font-bold text-rose-600 mt-0.5">{importResult.failed || 0}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setImportModalOpen(false)}
              disabled={importLoading}
            >
              Close
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={importLoading || !importJsonText.trim()}
              className="flex items-center gap-1.5"
            >
              {importLoading ? "Ingesting..." : "Run Ingestion Pipeline"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
