import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Code2,
  Terminal,
  Search,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Play,
  ChevronRight,
  Binary,
  Award,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Trophy,
  Filter
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { practiceService } from "../../services/practiceService";

export function CodingQuestionListPage() {
  const navigate = useNavigate();

  // Instant in-memory cache hydration - 0ms perceived lag on mount & back navigation
  const [questions, setQuestions] = useState(() => practiceService.getCachedCodingQuestions() || []);
  const [solvedIds, setSolvedIds] = useState(() => {
    const cachedStatus = practiceService.getCachedCodingSolveStatus();
    return new Set(cachedStatus?.solvedQuestionIds || []);
  });
  const [attemptedIds, setAttemptedIds] = useState(() => {
    const cachedStatus = practiceService.getCachedCodingSolveStatus();
    return new Set(cachedStatus?.attemptedQuestionIds || []);
  });
  const [loading, setLoading] = useState(() => !(practiceService.getCachedCodingQuestions()?.length > 0));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [startingQuestionId, setStartingQuestionId] = useState(null);
  const [startError, setStartError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedSubcategory, setSelectedSubcategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL"); // ALL | SOLVED | UNSOLVED

  const fetchQuestionsAndStatus = async ({ forceRefresh = false } = {}) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else if (questions.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const [questionsData, statusData] = await Promise.all([
        practiceService.getCodingQuestions({}, { forceRefresh }),
        practiceService.getCodingSolveStatus({ forceRefresh })
      ]);

      if (Array.isArray(questionsData)) {
        setQuestions(questionsData);
      }
      if (statusData) {
        setSolvedIds(new Set(statusData?.solvedQuestionIds || []));
        setAttemptedIds(new Set(statusData?.attemptedQuestionIds || []));
      }
    } catch (err) {
      console.error("Failed to load coding questions & status:", err);
      if (questions.length === 0) {
        setError(err.message || "Unable to fetch coding questions from the Practice service.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuestionsAndStatus();
  }, []);

  const handleSolveChallenge = async (questionId) => {
    setStartingQuestionId(questionId);
    setStartError(null);
    try {
      const attempt = await practiceService.createPracticeAttempt({
        type: "CODING",
        questionId,
        questionCount: 1
      });

      if (attempt && attempt.attemptId) {
        navigate(`/student/practice/coding/${attempt.attemptId}`);
      } else {
        throw new Error("Failed to initialize coding practice session.");
      }
    } catch (err) {
      console.error("Failed to start coding session:", err);
      setStartError(err.message || "Failed to start coding challenge. Please try again.");
      setStartingQuestionId(null);
    }
  };

  // Extract unique subcategories
  const subcategories = ["ALL", ...new Set(questions.map((q) => q.subcategory).filter(Boolean))];

  // Calculate stats
  const totalQuestions = questions.length;
  const totalSolved = useMemo(() => {
    return questions.filter((q) => solvedIds.has(q.id)).length;
  }, [questions, solvedIds]);

  const easySolved = useMemo(() => {
    return questions.filter((q) => q.difficulty === "EASY" && solvedIds.has(q.id)).length;
  }, [questions, solvedIds]);

  const mediumSolved = useMemo(() => {
    return questions.filter((q) => q.difficulty === "MEDIUM" && solvedIds.has(q.id)).length;
  }, [questions, solvedIds]);

  const hardSolved = useMemo(() => {
    return questions.filter((q) => q.difficulty === "HARD" && solvedIds.has(q.id)).length;
  }, [questions, solvedIds]);

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const isSolved = solvedIds.has(q.id);
    const isAttempted = attemptedIds.has(q.id) && !isSolved;

    const matchesSearch =
      (q.latestTitle || q.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.subcategory && q.subcategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.category && q.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDifficulty =
      selectedDifficulty === "ALL" || q.difficulty.toUpperCase() === selectedDifficulty.toUpperCase();

    const matchesSubcategory =
      selectedSubcategory === "ALL" || q.subcategory === selectedSubcategory;

    const matchesStatus =
      selectedStatus === "ALL" ||
      (selectedStatus === "SOLVED" && isSolved) ||
      (selectedStatus === "UNSOLVED" && !isSolved) ||
      (selectedStatus === "ATTEMPTED" && (isAttempted || isSolved));

    return matchesSearch && matchesDifficulty && matchesSubcategory && matchesStatus;
  });

  const getDifficultyBadge = (difficulty) => {
    switch ((difficulty || "").toUpperCase()) {
      case "EASY":
        return <Badge variant="success" size="sm">Easy</Badge>;
      case "MEDIUM":
        return <Badge variant="warning" size="sm">Medium</Badge>;
      case "HARD":
        return <Badge variant="danger" size="sm">Hard</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{difficulty}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/student/practice" className="hover:text-indigo-600 transition-colors">
          Practice Hub
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800">Coding Practice Arena</span>
      </nav>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <Terminal className="w-3.5 h-3.5" />
              Judge0 Sandbox Execution
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              SIPS Cryptographic Auth
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Code2 className="w-8 h-8 text-indigo-600" />
            Coding Practice Challenges
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Solve algorithmic problems in C++, Java, Python, or JavaScript with real-time compilation and server-evaluated test cases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={isRefreshing}
            onClick={() => fetchQuestionsAndStatus({ forceRefresh: true })}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Progress & Solved Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Solved</p>
            <p className="text-lg font-black text-slate-900">
              {totalSolved} <span className="text-xs text-slate-400 font-medium">/ {totalQuestions}</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
            20p
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Easy Solved</p>
            <p className="text-lg font-black text-slate-900">
              {easySolved} <span className="text-xs text-slate-400 font-medium">passed</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
            50p
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Medium Solved</p>
            <p className="text-lg font-black text-slate-900">
              {mediumSolved} <span className="text-xs text-slate-400 font-medium">passed</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
            100p
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hard Solved</p>
            <p className="text-lg font-black text-slate-900">
              {hardSolved} <span className="text-xs text-slate-400 font-medium">passed</span>
            </p>
          </div>
        </div>
      </div>

      {/* Start Error Banner */}
      {startError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{startError}</span>
          </div>
          <button
            onClick={() => setStartError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters & Search Bar */}
      <Card className="p-4 space-y-3.5 border-slate-200">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs: All / Solved / Unsolved */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            {[
              { id: "ALL", label: `All (${totalQuestions})` },
              { id: "SOLVED", label: `Solved (${totalSolved})` },
              { id: "UNSOLVED", label: `Unsolved (${Math.max(0, totalQuestions - totalSolved)})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedStatus === tab.id
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 md:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problems by title, topic, algorithm..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Secondary Filter: Difficulty & Subcategory */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px] mr-1">Difficulty:</span>
          {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                selectedDifficulty === diff
                  ? "bg-indigo-600 text-white font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {diff}
            </button>
          ))}

          {subcategories.length > 2 && (
            <>
              <div className="h-4 w-px bg-slate-200 mx-2" />
              <span className="text-slate-400 font-semibold uppercase text-[10px] mr-1">Topic:</span>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="text-xs font-semibold px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Topics</option>
                {subcategories.filter((s) => s !== "ALL").map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </>
          )}

          <div className="ml-auto text-slate-400 text-xs font-medium">
            Showing <strong className="text-slate-700">{filteredQuestions.length}</strong> problems
          </div>
        </div>
      </Card>

      {/* Problems List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs font-medium">Loading coding challenges and your solve status...</p>
        </div>
      ) : error ? (
        <Card className="p-8 text-center max-w-md mx-auto space-y-3 border-rose-200 bg-rose-50/50">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">Failed to Load Challenges</h3>
          <p className="text-xs text-rose-700">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchQuestionsAndStatus}>
            Try Again
          </Button>
        </Card>
      ) : filteredQuestions.length === 0 ? (
        <Card className="p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Code2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No Matching Coding Problems</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {searchQuery || selectedDifficulty !== "ALL" || selectedSubcategory !== "ALL" || selectedStatus !== "ALL"
              ? "No problems match your current filter criteria. Try resetting your search or filters."
              : "No coding challenges are currently available in the database."}
          </p>
          {(searchQuery || selectedDifficulty !== "ALL" || selectedSubcategory !== "ALL" || selectedStatus !== "ALL") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedDifficulty("ALL");
                setSelectedSubcategory("ALL");
                setSelectedStatus("ALL");
              }}
            >
              Reset Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuestions.map((q) => {
            const isStarting = startingQuestionId === q.id;
            const isSolved = solvedIds.has(q.id);
            const isAttempted = attemptedIds.has(q.id) && !isSolved;
            const points = q.difficulty === "HARD" ? 100 : q.difficulty === "MEDIUM" ? 50 : 20;

            return (
              <Card
                key={q.id}
                className={`p-5 transition-all flex flex-col justify-between group ${
                  isSolved
                    ? "border-emerald-200/80 bg-emerald-50/15 hover:border-emerald-300 shadow-2xs"
                    : "border-slate-200 hover:border-indigo-300 hover:shadow-md"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      {getDifficultyBadge(q.difficulty)}

                      {/* Solved / Attempted Status Badge */}
                      {isSolved ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Solved
                        </span>
                      ) : isAttempted ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Attempted
                        </span>
                      ) : null}

                      {q.subcategory && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                          {q.subcategory}
                        </span>
                      )}
                    </div>

                    {/* Points Badge */}
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      isSolved
                        ? "text-emerald-700 bg-emerald-100"
                        : "text-indigo-600 bg-indigo-50"
                    }`}>
                      <Award className="w-3.5 h-3.5" />
                      {points} pts
                    </span>
                  </div>

                  <h3 className={`text-base font-bold mb-1.5 transition-colors ${
                    isSolved
                      ? "text-slate-900 group-hover:text-emerald-700"
                      : "text-slate-900 group-hover:text-indigo-600"
                  }`}>
                    {q.latestTitle || q.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    Algorithms challenge • Evaluated with server-side public & hidden test cases with execution time limits.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                    <Binary className="w-3.5 h-3.5" />
                    <span>C++, Java, Python, JS</span>
                  </div>

                  {isSolved ? (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={RotateCcw}
                      loading={isStarting}
                      disabled={isStarting}
                      onClick={() => handleSolveChallenge(q.id)}
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 shadow-2xs font-semibold"
                    >
                      Solve Again
                    </Button>
                  ) : isAttempted ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Play}
                      loading={isStarting}
                      disabled={isStarting}
                      onClick={() => handleSolveChallenge(q.id)}
                      className="bg-amber-600 hover:bg-amber-700 text-white shadow-2xs font-semibold"
                    >
                      Resume Challenge
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Play}
                      loading={isStarting}
                      disabled={isStarting}
                      onClick={() => handleSolveChallenge(q.id)}
                      className="shadow-2xs font-semibold"
                    >
                      Solve Challenge
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CodingQuestionListPage;
