import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Code2,
  BrainCircuit,
  Calculator,
  Compass,
  BookOpen,
  PieChart,
  Binary,
  Cpu,
  Database,
  Layers,
  Network,
  TableProperties,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Play,
  ShieldCheck,
  Flame,
  Zap,
  Target,
  Clock,
  History,
  TrendingUp,
  Award
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { practiceService } from "../../services/practiceService";
import { useAuth } from "../../context/AuthContext";

export function PracticeHubPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("all"); // "all" | "aptitude" | "technical" | "coding"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);

  // Progress & Streak state
  const [progress, setProgress] = useState(null);
  const [streak, setStreak] = useState(null);

  // Modal / Start Attempt state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [startingAttempt, setStartingAttempt] = useState(false);
  const [startError, setStartError] = useState(null);

  const aptitudeCategories = [
    {
      id: "QUANTITATIVE",
      title: "Quantitative Aptitude",
      type: "APTITUDE",
      icon: Calculator,
      color: "indigo",
      description: "Arithmetic, speed-distance-time, work-time, percentages, and profit-loss.",
      topics: ["Time & Work", "Speed & Distance", "Percentages", "Ratio & Proportion"]
    },
    {
      id: "LOGICAL",
      title: "Logical Reasoning",
      type: "APTITUDE",
      icon: Compass,
      color: "sky",
      description: "Series completion, syllogisms, blood relations, and coding-decoding.",
      topics: ["Number Series", "Syllogisms", "Direction Sense", "Deductive Logic"]
    },
    {
      id: "VERBAL",
      title: "Verbal Ability",
      type: "APTITUDE",
      icon: BookOpen,
      color: "emerald",
      description: "Vocabulary, reading comprehension, antonyms, and sentence correction.",
      topics: ["Antonyms & Synonyms", "Sentence Correction", "Comprehension", "Grammar"]
    },
    {
      id: "DATA_INTERPRETATION",
      title: "Data Interpretation",
      type: "APTITUDE",
      icon: PieChart,
      color: "amber",
      description: "Table charts, bar graphs, pie charts, and data sufficiency problems.",
      topics: ["Table Charts", "Growth Rates", "Bar Graphs", "Data Analysis"]
    }
  ];

  const technicalCategories = [
    {
      id: "DSA",
      title: "Data Structures & Algorithms",
      type: "TECHNICAL",
      icon: Binary,
      color: "indigo",
      description: "Arrays, stacks, queues, trees, searching, sorting, and time complexity.",
      topics: ["Stacks & Queues", "Binary Search", "Tree Traversals", "Big-O Analysis"]
    },
    {
      id: "OOP",
      title: "Object-Oriented Programming",
      type: "TECHNICAL",
      icon: Layers,
      color: "violet",
      description: "Encapsulation, inheritance, polymorphism, abstraction, and SOLID principles.",
      topics: ["Dynamic Dispatch", "LSP & SOLID", "Method Overriding", "Abstract Classes"]
    },
    {
      id: "DBMS",
      title: "Database Management Systems",
      type: "TECHNICAL",
      icon: Database,
      color: "emerald",
      description: "ACID properties, relational schema, indexing, transactions, and normalization.",
      topics: ["ACID Isolation", "Normalization", "B-Trees & Indexing", "Transactions"]
    },
    {
      id: "OS",
      title: "Operating Systems",
      type: "TECHNICAL",
      icon: Cpu,
      color: "amber",
      description: "Process synchronization, deadlock Coffman conditions, paging, and CPU scheduling.",
      topics: ["Deadlock Conditions", "Virtual Memory", "Paging", "Thread Scheduling"]
    },
    {
      id: "NETWORKS",
      title: "Computer Networks",
      type: "TECHNICAL",
      icon: Network,
      color: "blue",
      description: "OSI and TCP/IP stack, TCP vs UDP, IP addressing, DNS, and HTTP/HTTPS.",
      topics: ["TCP vs UDP", "OSI 7-Layers", "DNS & Routing", "Handshakes"]
    },
    {
      id: "SQL",
      title: "SQL & Relational Queries",
      type: "TECHNICAL",
      icon: TableProperties,
      color: "cyan",
      description: "Aggregations, WHERE vs HAVING, JOIN types, subqueries, and window functions.",
      topics: ["GROUP BY / HAVING", "Joins", "Aggregations", "Query Optimization"]
    }
  ];

  const fetchPracticeData = async () => {
    setLoading(true);
    setError(null);
    try {
      await practiceService.checkHealth();
      setBackendConnected(true);

      const [progressRes, streakRes] = await Promise.allSettled([
        practiceService.getPracticeProgress(),
        practiceService.getPracticeStreak()
      ]);

      if (progressRes.status === "fulfilled") {
        setProgress(progressRes.value);
      }
      if (streakRes.status === "fulfilled") {
        setStreak(streakRes.value);
      }
    } catch (err) {
      console.error("Failed to load practice data:", err);
      setError(err.message || "Unable to communicate with the Practice Platform service.");
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPracticeData();
  }, []);

  const handleStartAttempt = async () => {
    if (!selectedCategory) return;
    setStartingAttempt(true);
    setStartError(null);

    try {
      const attempt = await practiceService.createPracticeAttempt({
        type: selectedCategory.type,
        category: selectedCategory.id,
        questionCount: parseInt(questionCount, 10) || 5
      });

      if (attempt && attempt.attemptId) {
        navigate(`/student/practice/attempt/${attempt.attemptId}`);
      } else {
        throw new Error("Invalid attempt creation response");
      }
    } catch (err) {
      console.error("Failed to start practice attempt:", err);
      setStartError(err.message || "Failed to start practice session. Please verify questions exist for this category.");
      setStartingAttempt(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              SIPS Verified Session
            </span>
            {backendConnected && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Practice Service Active
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Code2 className="w-8 h-8 text-indigo-600" />
            Practice & Assessment Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Master aptitude fundamentals, test core CS concepts, and prepare with server-evaluated practice sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchPracticeData}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Progress & Streak Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Streak Card */}
        <Card className="p-5 border-amber-200/70 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Flame className="w-5 h-5 fill-amber-500 text-amber-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Practice Streak</h3>
                <div className="text-xl font-extrabold text-slate-900">
                  {streak?.currentStreak || 0} <span className="text-xs font-semibold text-slate-500">days</span>
                </div>
              </div>
            </div>
            {streak?.activeToday ? (
              <Badge variant="success" size="xs">Active Today</Badge>
            ) : (
              <Badge variant="neutral" size="xs">Inactive Today</Badge>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-amber-100/80 flex items-center justify-between text-xs text-slate-600">
            <span>Longest Streak: <strong className="text-slate-800">{streak?.longestStreak || 0} days</strong></span>
            {streak?.lastPracticeDate && (
              <span className="text-[11px] text-slate-400">Last: {streak.lastPracticeDate}</span>
            )}
          </div>
        </Card>

        {/* Completed Attempts */}
        <Card className="p-5 border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Sessions</h3>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {progress?.overall?.completedAttempts ?? progress?.overall?.completed ?? progress?.overall?.attempts ?? 0}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Total Attempts: <strong className="text-slate-700">{progress?.overall?.attempts || 0}</strong></span>
            <Button
              variant="ghost"
              size="xs"
              icon={History}
              onClick={() => navigate("/student/practice/history")}
              className="text-indigo-600 p-0 h-auto hover:bg-transparent"
            >
              History
            </Button>
          </div>
        </Card>

        {/* Questions Solved & Accuracy */}
        <Card className="p-5 border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Questions Solved</h3>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {progress?.overall?.uniqueQuestionsSolved ?? progress?.overall?.questionsCorrect ?? 0} <span className="text-xs font-medium text-slate-400">/ {progress?.overall?.totalPlatformQuestions ?? 0}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Accuracy Rate:</span>
            <strong className="text-emerald-600 font-bold">{progress?.overall?.accuracy || 0}%</strong>
          </div>
        </Card>

        {/* Average Score */}
        <Card className="p-5 border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Score</h3>
              <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                {progress?.overall?.averagePercentage || 0}%
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Performance Level:</span>
            <strong className="text-slate-700">
              {(progress?.overall?.averagePercentage || 0) >= 75 ? "Advanced" : (progress?.overall?.averagePercentage || 0) >= 50 ? "Proficient" : "Beginner"}
            </strong>
          </div>
        </Card>
      </div>

      {/* Category Performance Breakdown */}
      {progress?.categories && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Aptitude</div>
                <div className="text-[11px] text-slate-500">{progress.categories.APTITUDE?.completed || 0} completed • {progress.categories.APTITUDE?.questionsCorrect || 0} solved</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-extrabold text-indigo-600">{progress.categories.APTITUDE?.accuracy || 0}%</div>
              <div className="text-[10px] text-slate-400">accuracy</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Binary className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Technical MCQs</div>
                <div className="text-[11px] text-slate-500">{progress.categories.TECHNICAL?.completed || 0} completed • {progress.categories.TECHNICAL?.questionsCorrect || 0} solved</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-extrabold text-sky-600">{progress.categories.TECHNICAL?.accuracy || 0}%</div>
              <div className="text-[10px] text-slate-400">accuracy</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Coding Arena</div>
                <div className="text-[11px] text-slate-500">{progress.categories.CODING?.completed || 0} completed • {progress.categories.CODING?.questionsCorrect || 0} solved</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-extrabold text-emerald-600">{progress.categories.CODING?.accuracy || 0}%</div>
              <div className="text-[10px] text-slate-400">accuracy</div>
            </div>
          </div>
        </div>
      )}

      {/* Category Tab Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "all"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          All Categories
        </button>
        <button
          onClick={() => setActiveTab("aptitude")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "aptitude"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          Aptitude Practice
        </button>
        <button
          onClick={() => setActiveTab("technical")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "technical"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Binary className="w-4 h-4" />
          Technical MCQs
        </button>
        <button
          onClick={() => setActiveTab("coding")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "coding"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Code2 className="w-4 h-4" />
          Coding Arena
        </button>
      </div>

      {/* Aptitude Practice Section */}
      {(activeTab === "all" || activeTab === "aptitude") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-600" />
              Aptitude Practice Modules
            </h2>
            <Badge variant="primary" size="xs">Self-Paced MCQs</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {aptitudeCategories.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <Card
                  key={cat.id}
                  className="p-5 border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group cursor-pointer"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setStartError(null);
                  }}
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {cat.topics.map((t, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                      Start Session
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Technical MCQs Section */}
      {(activeTab === "all" || activeTab === "technical") && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Binary className="w-5 h-5 text-indigo-600" />
              Technical Core MCQs
            </h2>
            <Badge variant="primary" size="xs">CS Fundamentals</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {technicalCategories.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <Card
                  key={cat.id}
                  className="p-5 border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group cursor-pointer"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setStartError(null);
                  }}
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {cat.topics.map((t, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                      Start Session
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Coding Practice Section */}
      {(activeTab === "all" || activeTab === "coding") && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-600" />
              Coding Practice Arena
            </h2>
            <Button
              variant="primary"
              size="xs"
              icon={ArrowRight}
              onClick={() => navigate("/student/practice/coding")}
            >
              Explore All Challenges
            </Button>
          </div>

          <Card className="p-6 border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm overflow-hidden relative">
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Live Compiler Sandbox
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  C++, Java, Python, JS
                </span>
              </div>

              <h3 className="text-xl font-extrabold tracking-tight text-white">
                Algorithmic & Data Structures Coding Practice
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Test your code against server-evaluated public sample tests and hidden boundary test cases with automated scoring, time limits, and memory limits.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Play}
                  onClick={() => navigate("/student/practice/coding")}
                  className="bg-indigo-500 hover:bg-indigo-400 text-white border-0 shadow-sm"
                >
                  Enter Coding Arena
                </Button>
                <span className="text-xs text-slate-400">
                  Automated scoring • Zero setup required
                </span>
              </div>
            </div>

            {/* Decorative bg icon */}
            <Code2 className="absolute -right-6 -bottom-6 w-48 h-48 text-white/5 pointer-events-none" />
          </Card>
        </div>
      )}

      {/* Recent Practice Activity */}
      <Card className="p-6 border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              Recent Practice Activity
            </h3>
            <p className="text-xs text-slate-500">
              Your most recent practice sessions and performance summaries
            </p>
          </div>
          <Button
            variant="outline"
            size="xs"
            icon={ArrowRight}
            onClick={() => navigate("/student/practice/history")}
          >
            View Full History
          </Button>
        </div>

        {loading ? (
          <div className="py-6 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs">Loading recent attempts...</p>
          </div>
        ) : !progress?.recentActivity || progress.recentActivity.length === 0 ? (
          <div className="py-6 text-center text-slate-400 space-y-1">
            <p className="text-xs text-slate-500">No practice attempts recorded yet. Start practicing with the modules above!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {progress.recentActivity.map((item) => {
              const isSubmitted = item.status === "SUBMITTED";
              const isCoding = item.type === "CODING" || item.category === "CODING";
              const dateStr = item.submittedAt || item.startedAt || item.createdAt;
              const formattedDate = dateStr
                ? new Date(dateStr).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })
                : "Recent";

              return (
                <div
                  key={item.attemptId}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-lg transition-colors cursor-pointer"
                  onClick={() => {
                    if (isSubmitted) {
                      navigate(`/student/practice/attempt/${item.attemptId}/result`);
                    } else if (isCoding) {
                      navigate(`/student/practice/coding/${item.attemptId}`);
                    } else {
                      navigate(`/student/practice/attempt/${item.attemptId}`);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      {isCoding ? (
                        <Code2 className="w-4 h-4 text-emerald-600" />
                      ) : ["QUANTITATIVE", "LOGICAL", "VERBAL", "DATA_INTERPRETATION"].includes(item.category) ? (
                        <BrainCircuit className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Binary className="w-4 h-4 text-sky-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{item.category}</span>
                        <Badge variant={isSubmitted ? "success" : "warning"} size="xs">
                          {isSubmitted ? "Completed" : "In Progress"}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-400">{formattedDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isSubmitted ? (
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900">{item.score}/{item.totalMarks}</span>
                        <span className="text-[11px] text-emerald-600 font-semibold ml-1">({item.percentage}%)</span>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 font-medium">Resume</span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>



      {/* Start Practice Session Modal */}
      {selectedCategory && (
        <Modal
          isOpen={!!selectedCategory}
          onClose={() => {
            if (!startingAttempt) {
              setSelectedCategory(null);
              setStartError(null);
            }
          }}
          title={`Start Practice: ${selectedCategory.title}`}
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-600">
              You are about to start a self-paced assessment in <span className="font-bold text-slate-800">{selectedCategory.title}</span>. Questions will be delivered and evaluated on the server.
            </p>

            {startError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{startError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Number of Questions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      questionCount === cnt
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Session Rules:</p>
              <p>• Questions are presented one at a time with instant answer saving.</p>
              <p>• Explanations and answer keys will be revealed after final submission.</p>
              <p>• Server calculates your official score upon completion.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                disabled={startingAttempt}
                onClick={() => setSelectedCategory(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                loading={startingAttempt}
                onClick={handleStartAttempt}
              >
                Begin Practice
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
