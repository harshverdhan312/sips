import React, { useState, useEffect } from "react";
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
  Award
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { practiceService } from "../../services/practiceService";

export function CodingQuestionListPage() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingQuestionId, setStartingQuestionId] = useState(null);
  const [startError, setStartError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedSubcategory, setSelectedSubcategory] = useState("ALL");

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await practiceService.getCodingQuestions();
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load coding questions:", err);
      setError(err.message || "Unable to fetch coding questions from the Practice service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
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

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.latestTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.subcategory && q.subcategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.category && q.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDifficulty =
      selectedDifficulty === "ALL" || q.difficulty.toUpperCase() === selectedDifficulty.toUpperCase();

    const matchesSubcategory =
      selectedSubcategory === "ALL" || q.subcategory === selectedSubcategory;

    return matchesSearch && matchesDifficulty && matchesSubcategory;
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
            loading={loading}
            onClick={fetchQuestions}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Languages & Features Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
            C++
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">C++ (GCC)</p>
            <p className="text-[11px] text-slate-400">Fast STL execution</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
            Java
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Java (OpenJDK)</p>
            <p className="text-[11px] text-slate-400">Object-oriented core</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
            Py
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Python 3</p>
            <p className="text-[11px] text-slate-400">Standard runtime</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
            JS
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">JavaScript</p>
            <p className="text-[11px] text-slate-400">Node.js sandbox</p>
          </div>
        </div>
      </div>

      {/* Global Start Error Alert */}
      {startError && (
        <Card className="p-4 border-rose-200 bg-rose-50/70 text-rose-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-900">Session Initialization Error</h4>
              <p className="text-xs text-rose-700">{startError}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4 border-slate-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search coding problems by title, topic or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedDifficulty === diff
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {diff === "ALL" ? "All" : diff.charAt(0) + diff.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Subcategory dropdown if available */}
          {subcategories.length > 2 && (
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Topics</option>
              {subcategories.filter((s) => s !== "ALL").map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      </Card>

      {/* Problems List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs font-medium">Loading coding challenges from Practice service...</p>
        </div>
      ) : error ? (
        <Card className="p-8 text-center max-w-md mx-auto space-y-3 border-rose-200 bg-rose-50/50">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">Failed to Load Challenges</h3>
          <p className="text-xs text-rose-700">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchQuestions}>
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
            {searchQuery || selectedDifficulty !== "ALL" || selectedSubcategory !== "ALL"
              ? "No problems match your current search or filter criteria. Try resetting filters."
              : "No coding challenges are currently available in the database."}
          </p>
          {(searchQuery || selectedDifficulty !== "ALL" || selectedSubcategory !== "ALL") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedDifficulty("ALL");
                setSelectedSubcategory("ALL");
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
            return (
              <Card
                key={q.id}
                className="p-5 border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      {getDifficultyBadge(q.difficulty)}
                      {q.subcategory && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                          {q.subcategory}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      {(q.difficulty === 'HARD' ? 100 : q.difficulty === 'MEDIUM' ? 50 : 20)} pts
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-indigo-600 transition-colors">
                    {q.latestTitle}
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

                  <Button
                    variant="primary"
                    size="sm"
                    icon={Play}
                    loading={isStarting}
                    disabled={isStarting}
                    onClick={() => handleSolveChallenge(q.id)}
                    className="shadow-xs"
                  >
                    Solve Challenge
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
