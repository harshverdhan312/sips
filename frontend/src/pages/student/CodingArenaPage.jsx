import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Code2,
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  FileCode,
  History
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { ProblemStatement } from "../../components/common/ProblemStatement";
import { practiceService } from "../../services/practiceService";

const STARTER_TEMPLATES = {
  python: `# Python 3 Solution
import sys

def solve():
    # Read entire input from standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    # Write your solution logic here
    

if __name__ == '__main__':
    solve()
`,
  cpp: `// C++ (GCC) Solution
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

using namespace std;

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Write your solution logic here
    

    return 0;
}
`,
  java: `// Java (OpenJDK) Solution
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        // Write your solution logic here
        
    }
}
`,
  javascript: `// JavaScript (Node.js) Solution
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const lines = [];

rl.on('line', (line) => {
    if (line.trim()) {
        lines.push(line.trim());
    }
});

rl.on('close', () => {
    // Write your solution logic here
    
});
`
};

export function CodingArenaPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // Attempt & Problem State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [question, setQuestion] = useState(null);

  // Editor State
  const [language, setLanguage] = useState("python");
  const [sourceCodeByLang, setSourceCodeByLang] = useState(STARTER_TEMPLATES);
  const [copiedInputIndex, setCopiedInputIndex] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Active Left Tab
  const [activeLeftTab, setActiveLeftTab] = useState("problem"); // "problem" | "submissions"

  // Execution States
  const [runningCode, setRunningCode] = useState(false);
  const [submittingCode, setSubmittingCode] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [executionError, setExecutionError] = useState(null);

  // Bottom Console / Results Active Tab
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);
  const [consoleOpen, setConsoleOpen] = useState(false);

  // Submissions History (Local state per attempt session)
  const [submissionsHistory, setSubmissionsHistory] = useState([]);

  // Editor Ref for synchronized scroll
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Load Attempt and Delivered Question
  const loadArena = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await practiceService.getDeliveredQuestions(attemptId);
      if (!data || !data.questions || data.questions.length === 0) {
        throw new Error("No coding questions found for this practice attempt.");
      }

      const codingQ = data.questions[0]; // Self-paced single coding challenge attempt
      setQuestion(codingQ);

      // Check if candidate previously had code in question response
      if (codingQ.currentAnswer && codingQ.currentAnswer.sourceCode) {
        const savedLang = codingQ.currentAnswer.language || "python";
        setLanguage(savedLang);
        setSourceCodeByLang((prev) => ({
          ...prev,
          [savedLang]: codingQ.currentAnswer.sourceCode
        }));
      }
    } catch (err) {
      console.error("Failed to load coding arena:", err);
      setError(err.message || "Failed to load coding challenge.");
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    loadArena();
  }, [loadArena]);

  const currentSourceCode = sourceCodeByLang[language] || STARTER_TEMPLATES[language];

  const handleSourceCodeChange = (newCode) => {
    setSourceCodeByLang((prev) => ({
      ...prev,
      [language]: newCode
    }));
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    // Keep console state or reset test case tab
    setSelectedTestCaseIndex(0);
  };

  const handleResetTemplate = () => {
    setSourceCodeByLang((prev) => ({
      ...prev,
      [language]: STARTER_TEMPLATES[language]
    }));
    setShowResetModal(false);
  };

  // Synchronize line numbers scroll with textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Support Tab key in editor
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      // Insert 4 spaces
      const updated = val.substring(0, start) + "    " + val.substring(end);
      handleSourceCodeChange(updated);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  // RUN code (public tests only)
  const handleRunCode = async () => {
    if (!question || runningCode || submittingCode) return;
    setRunningCode(true);
    setExecutionError(null);
    setConsoleOpen(true);

    try {
      const res = await practiceService.runCode({
        questionVersionId: question.id,
        language,
        sourceCode: currentSourceCode,
        practiceAttemptId: attemptId
      });

      setExecutionResult(res);
      setSelectedTestCaseIndex(0);

      // Record in local session history
      setSubmissionsHistory((prev) => [
        {
          id: res.id || `run_${Date.now()}`,
          timestamp: new Date(),
          mode: "RUN",
          language,
          status: res.status,
          testsPassed: res.testsPassed,
          testsTotal: res.testsTotal,
          earnedMarks: 0.0,
          executionTimeMs: res.executionTimeMs
        },
        ...prev
      ]);
    } catch (err) {
      console.error("Run code error:", err);
      setExecutionError(err.message || "Execution failed. Please check your source code or try again.");
    } finally {
      setRunningCode(false);
    }
  };

  // SUBMIT code (public + hidden tests with server scoring)
  const handleSubmitCode = async () => {
    if (!question || runningCode || submittingCode) return;
    setSubmittingCode(true);
    setExecutionError(null);
    setConsoleOpen(true);

    try {
      const res = await practiceService.submitCode({
        questionVersionId: question.id,
        language,
        sourceCode: currentSourceCode,
        practiceAttemptId: attemptId
      });

      setExecutionResult(res);
      setSelectedTestCaseIndex(0);

      // Record in local session history
      setSubmissionsHistory((prev) => [
        {
          id: res.id || `sub_${Date.now()}`,
          timestamp: new Date(),
          mode: "SUBMIT",
          language,
          status: res.status,
          testsPassed: res.testsPassed,
          testsTotal: res.testsTotal,
          earnedMarks: res.earnedMarks,
          executionTimeMs: res.executionTimeMs
        },
        ...prev
      ]);
    } catch (err) {
      console.error("Submit code error:", err);
      setExecutionError(err.message || "Submission evaluation failed. Please try again.");
    } finally {
      setSubmittingCode(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedInputIndex(index);
    setTimeout(() => setCopiedInputIndex(null), 2000);
  };

  // Compute line numbers string
  const lineCount = (currentSourceCode || "").split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1);

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACCEPTED":
        return <Badge variant="success" size="md" className="gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Accepted</Badge>;
      case "PARTIAL":
        return <Badge variant="warning" size="md" className="gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Partial Pass</Badge>;
      case "WRONG_ANSWER":
        return <Badge variant="danger" size="md" className="gap-1.5"><XCircle className="w-3.5 h-3.5" /> Wrong Answer</Badge>;
      case "COMPILATION_ERROR":
        return <Badge variant="danger" size="md" className="gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Compilation Error</Badge>;
      case "TIME_LIMIT_EXCEEDED":
        return <Badge variant="purple" size="md" className="gap-1.5"><Clock className="w-3.5 h-3.5" /> Time Limit Exceeded</Badge>;
      case "RUNTIME_ERROR":
        return <Badge variant="danger" size="md" className="gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Runtime Error</Badge>;
      case "SYSTEM_ERROR":
        return <Badge variant="warning" size="md" className="gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> System Error</Badge>;
      default:
        return <Badge variant="neutral" size="md">{status || "Pending"}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 space-y-3 animate-in fade-in">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
        <h3 className="font-bold text-slate-800 text-base">Initializing Coding Workspace</h3>
        <p className="text-xs text-slate-500">Connecting to secure Judge0 execution pipeline...</p>
      </div>
    );
  }

  if (error || !question) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto space-y-4 border-rose-200 bg-rose-50/50 mt-8">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="font-bold text-slate-900 text-lg">Unable to Open Workspace</h3>
        <p className="text-xs text-rose-700">{error || "Coding problem not found."}</p>
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/student/practice/coding")}>
            Back to Challenges
          </Button>
          <Button variant="primary" size="sm" onClick={loadArena}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const codingProblem = question.codingProblem || {};
  const publicTestCases = codingProblem.testCases || [];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Workspace Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/student/practice/coding"
            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Back to Coding Problems"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {question.title}
              </h1>
              <Badge variant={question.difficulty === "EASY" ? "success" : question.difficulty === "MEDIUM" ? "warning" : "danger"} size="sm">
                {question.difficulty}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{question.category}</span>
              {question.subcategory && <span>• {question.subcategory}</span>}
              <span>• Max Marks: <strong className="text-indigo-600 font-bold">{codingProblem.maxMarks !== undefined ? codingProblem.maxMarks : (question.difficulty === 'HARD' ? 100 : question.difficulty === 'MEDIUM' ? 50 : 20)} pts</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Live Session
          </span>

          <Button
            variant="outline"
            size="sm"
            icon={History}
            onClick={() => setActiveLeftTab(activeLeftTab === "submissions" ? "problem" : "submissions")}
            className={activeLeftTab === "submissions" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : ""}
          >
            Submissions ({submissionsHistory.length})
          </Button>
        </div>
      </div>

      {/* Main Split-Screen Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[620px]">
        {/* LEFT COLUMN: Problem Statement & Test Cases OR Submissions */}
        <div className="lg:col-span-5 flex flex-col h-full space-y-4">
          <Card className="p-5 border-slate-200 shadow-xs flex-1 flex flex-col overflow-hidden">
            {/* Left Header Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <button
                onClick={() => setActiveLeftTab("problem")}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeLeftTab === "problem"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                Problem Description
              </button>
              <button
                onClick={() => setActiveLeftTab("submissions")}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeLeftTab === "submissions"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Submissions History ({submissionsHistory.length})
              </button>
            </div>

            {/* TAB 1: Problem Details */}
            {activeLeftTab === "problem" && (
              <div className="overflow-y-auto pr-1 space-y-5 flex-1 max-h-[600px]">
                {/* Rich Problem Statement & Formatted Sections */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    Description & Specifications
                  </h4>
                  <ProblemStatement statement={question.statement} />
                </div>

                {/* Additional Input Format if custom */}
                {codingProblem.inputFormat && !codingProblem.inputFormat.toLowerCase().includes("standard input via stdin") && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                      Input Format
                    </h5>
                    <p className="text-xs text-slate-600 whitespace-pre-line font-mono">
                      {codingProblem.inputFormat}
                    </p>
                  </div>
                )}

                {/* Additional Output Format if custom */}
                {codingProblem.outputFormat && !codingProblem.outputFormat.toLowerCase().includes("standard output via stdout") && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                      Output Format
                    </h5>
                    <p className="text-xs text-slate-600 whitespace-pre-line font-mono">
                      {codingProblem.outputFormat}
                    </p>
                  </div>
                )}

                {/* Constraints */}
                {codingProblem.constraints && (
                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60 space-y-1">
                    <h5 className="text-xs font-bold text-amber-900">Constraints</h5>
                    <p className="text-xs text-amber-800 whitespace-pre-line font-mono leading-relaxed">
                      {codingProblem.constraints}
                    </p>
                  </div>
                )}

                {/* Public Sample Test Cases */}
                {publicTestCases.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                      Sample Test Cases
                    </h4>
                    {publicTestCases.map((tc, idx) => (
                      <div
                        key={tc.id || idx}
                        className="p-3.5 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-2.5 font-mono text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-slate-300">Sample {idx + 1}</span>
                          <button
                            onClick={() => copyToClipboard(tc.input, idx)}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-sans transition-colors"
                          >
                            {copiedInputIndex === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Input</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-sans">
                            Input:
                          </p>
                          <pre className="p-2 rounded-lg bg-slate-950 text-slate-200 whitespace-pre-wrap overflow-x-auto text-xs">
                            {tc.input}
                          </pre>
                        </div>

                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-sans">
                            Expected Output:
                          </p>
                          <pre className="p-2 rounded-lg bg-slate-950 text-emerald-300 whitespace-pre-wrap overflow-x-auto text-xs">
                            {tc.expectedOutput}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Submissions History */}
            {activeLeftTab === "submissions" && (
              <div className="overflow-y-auto pr-1 space-y-3 flex-1 max-h-[600px]">
                {submissionsHistory.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <History className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-700">No Submissions Yet</p>
                    <p className="text-[11px] text-slate-400">
                      Use the RUN or SUBMIT buttons to execute your code against test cases.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {submissionsHistory.map((sub, idx) => (
                      <div key={sub.id || idx} className="py-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              sub.mode === "SUBMIT" ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-700"
                            }`}>
                              {sub.mode}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                              {sub.language}
                            </span>
                          </div>
                          {getStatusBadge(sub.status)}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            Tests: <strong className="text-slate-800">{sub.testsPassed} / {sub.testsTotal}</strong>
                          </span>
                          {sub.mode === "SUBMIT" && (
                            <span>
                              Score: <strong className="text-indigo-600 font-bold">{sub.earnedMarks} pts</strong>
                            </span>
                          )}
                          <span>
                            {new Date(sub.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Code Editor Workspace & Action Controls */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <Card className="border-slate-800 bg-slate-950 shadow-md flex flex-col overflow-hidden rounded-2xl">
            {/* Editor Top Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Language:</span>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  <option value="python">Python 3 (3.8.1)</option>
                  <option value="cpp">C++ (GCC 9.2.0)</option>
                  <option value="java">Java (OpenJDK 13)</option>
                  <option value="javascript">JavaScript (Node.js 12)</option>
                </select>
              </div>

              {/* Editor Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                  title="Reset to starter template"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Code</span>
                </button>
              </div>
            </div>

            {/* Code Textarea with Line Numbers */}
            <div className="relative flex bg-slate-950 font-mono text-xs sm:text-sm h-[420px] overflow-hidden">
              {/* Line Numbers Gutter */}
              <div
                ref={lineNumbersRef}
                className="w-12 py-3 bg-slate-900/60 text-slate-500 text-right pr-3 select-none overflow-hidden font-mono text-xs border-r border-slate-800/80 leading-6"
              >
                {lineNumbers.map((n) => (
                  <div key={n}>{n}</div>
                ))}
              </div>

              {/* Code Textarea */}
              <textarea
                ref={textareaRef}
                value={currentSourceCode}
                onChange={(e) => handleSourceCodeChange(e.target.value)}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                spellCheck="false"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                className="flex-1 py-3 px-4 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none resize-none font-mono leading-6 overflow-y-auto whitespace-pre tab-4"
                placeholder="Write your solution here..."
              />
            </div>

            {/* Action Bar Footer */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {executionResult && (
                  <button
                    onClick={() => setConsoleOpen(!consoleOpen)}
                    className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Console Results</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${consoleOpen ? "rotate-180" : ""}`} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {/* RUN Button */}
                <Button
                  variant="outline"
                  size="sm"
                  icon={Play}
                  loading={runningCode}
                  disabled={runningCode || submittingCode}
                  onClick={handleRunCode}
                  className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white"
                >
                  {runningCode ? "Running..." : "Run Tests"}
                </Button>

                {/* SUBMIT Button */}
                <Button
                  variant="primary"
                  size="sm"
                  icon={Send}
                  loading={submittingCode}
                  disabled={runningCode || submittingCode}
                  onClick={handleSubmitCode}
                  className="shadow-sm"
                >
                  {submittingCode ? "Evaluating..." : "Submit Solution"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Execution Error Banner */}
          {executionError && (
            <Card className="p-4 border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Execution Error</p>
                <p className="text-rose-700">{executionError}</p>
              </div>
            </Card>
          )}

          {/* Bottom Execution Results Drawer */}
          {consoleOpen && executionResult && (
            <Card className="p-5 border-slate-200 shadow-sm space-y-4 animate-in fade-in">
              {/* Result Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {getStatusBadge(executionResult.status)}
                  <div className="text-xs text-slate-600">
                    Mode: <strong className="font-bold text-slate-900">{executionResult.mode}</strong> ({executionResult.mode === "RUN" ? "Public Tests Only" : "Public + Hidden Evaluation"})
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div>
                    Tests: <strong className="text-slate-900">{executionResult.testsPassed} / {executionResult.testsTotal}</strong>
                  </div>
                  {executionResult.mode === "SUBMIT" && (
                    <div className="text-indigo-600 font-extrabold bg-indigo-50 px-2.5 py-1 rounded-md">
                      Score: {executionResult.earnedMarks} / {codingProblem.maxMarks !== undefined ? codingProblem.maxMarks : (question.difficulty === 'HARD' ? 100 : question.difficulty === 'MEDIUM' ? 50 : 20)} pts
                    </div>
                  )}
                  {executionResult.executionTimeMs !== undefined && (
                    <div className="text-slate-400">
                      Time: {executionResult.executionTimeMs}ms
                    </div>
                  )}
                </div>
              </div>

              {/* Compilation Error Display */}
              {executionResult.compileOutput && (
                <div className="p-4 rounded-xl bg-slate-950 text-rose-400 font-mono text-xs border border-rose-900/50 space-y-1">
                  <p className="font-bold text-rose-300">Compilation / Build Error:</p>
                  <pre className="whitespace-pre-wrap overflow-x-auto text-[11px] leading-relaxed">
                    {executionResult.compileOutput}
                  </pre>
                </div>
              )}

              {/* Test Cases Results Navigator */}
              {executionResult.testResults && executionResult.testResults.length > 0 && (
                <div className="space-y-3">
                  {/* Test Case Selection Tabs */}
                  <div className="flex flex-wrap gap-2">
                    {executionResult.testResults.map((tr, idx) => (
                      <button
                        key={tr.id || idx}
                        onClick={() => setSelectedTestCaseIndex(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          selectedTestCaseIndex === idx
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {tr.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span>{tr.isHidden ? `Hidden Test ${idx + 1}` : `Sample ${idx + 1}`}</span>
                      </button>
                    ))}
                  </div>

                  {/* Selected Test Case Details */}
                  {(() => {
                    const activeResult = executionResult.testResults[selectedTestCaseIndex] || executionResult.testResults[0];
                    if (!activeResult) return null;

                    if (activeResult.isHidden) {
                      return (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">Hidden Evaluation Test Case</span>
                            {activeResult.passed ? (
                              <Badge variant="success" size="sm">Passed</Badge>
                            ) : (
                              <Badge variant="danger" size="sm">Failed ({activeResult.status})</Badge>
                            )}
                          </div>
                          <p className="text-slate-500 text-[11px]">
                            Hidden test cases evaluate edge cases, boundary constraints, and execution limits. Inputs and outputs remain protected by server security policies.
                          </p>
                          {activeResult.executionTimeMs !== undefined && (
                            <p className="text-slate-400 text-[11px]">
                              Execution Time: {activeResult.executionTimeMs}ms • Memory: {activeResult.memoryUsedKb} KB
                            </p>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-slate-300">
                            Sample Test Case {selectedTestCaseIndex + 1}
                          </span>
                          {activeResult.passed ? (
                            <Badge variant="success" size="sm">Passed</Badge>
                          ) : (
                            <Badge variant="danger" size="sm">Failed ({activeResult.status})</Badge>
                          )}
                        </div>

                        {activeResult.input !== undefined && (
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-sans">
                              Input:
                            </p>
                            <pre className="p-2.5 rounded-lg bg-slate-950 text-slate-200 whitespace-pre-wrap overflow-x-auto text-xs">
                              {activeResult.input}
                            </pre>
                          </div>
                        )}

                        {activeResult.expectedOutput !== undefined && (
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-sans">
                              Expected Output:
                            </p>
                            <pre className="p-2.5 rounded-lg bg-slate-950 text-emerald-300 whitespace-pre-wrap overflow-x-auto text-xs">
                              {activeResult.expectedOutput}
                            </pre>
                          </div>
                        )}

                        {activeResult.stdout !== undefined && (
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-sans">
                              Your Output:
                            </p>
                            <pre className={`p-2.5 rounded-lg bg-slate-950 whitespace-pre-wrap overflow-x-auto text-xs ${
                              activeResult.passed ? "text-emerald-300" : "text-rose-300"
                            }`}>
                              {activeResult.stdout || "(Empty output)"}
                            </pre>
                          </div>
                        )}

                        {activeResult.stderr && (
                          <div>
                            <p className="text-[10px] text-rose-400 uppercase tracking-wider mb-1 font-sans">
                              Standard Error / Stacktrace:
                            </p>
                            <pre className="p-2.5 rounded-lg bg-slate-950 text-rose-400 whitespace-pre-wrap overflow-x-auto text-xs">
                              {activeResult.stderr}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Reset Code Confirmation Modal */}
      {showResetModal && (
        <Modal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          title={`Reset ${language.toUpperCase()} Solution Template`}
        >
          <div className="space-y-4 text-xs sm:text-sm text-slate-600">
            <p>
              Are you sure you want to reset the editor to the default starter template for <strong className="text-slate-900">{language.toUpperCase()}</strong>?
            </p>
            <p className="text-rose-600 font-semibold">
              Any unsaved changes in this language will be discarded.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowResetModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleResetTemplate}>
                Reset to Template
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
