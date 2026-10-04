import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Play,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  Check,
  Layers,
  Code2,
  BookOpen,
  Cpu,
  FileCode,
  Terminal,
  ExternalLink,
  Copy,
  Info
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { practiceService } from "../../services/practiceService";
import { cn } from "../../utils/cn";

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

export function ContestWorkspacePage() {
  const { contestId, attemptId } = useParams();
  const navigate = useNavigate();

  // Core Data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attemptMeta, setAttemptMeta] = useState(null);
  const [contestQuestions, setContestQuestions] = useState([]);
  const [currentSection, setCurrentSection] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // MCQ Response State: { [questionVersionId]: answerData }
  const [answers, setAnswers] = useState({});
  // Save State per question: { [questionVersionId]: 'saved' | 'saving' | 'error' }
  const [saveStatuses, setSaveStatuses] = useState({});

  // Timing State (Server-Authoritative)
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [effectiveDeadlineMs, setEffectiveDeadlineMs] = useState(null);
  const [remainingMs, setRemainingMs] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Submission Modal & States
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Numerical input draft state: { [questionVersionId]: string }
  const [numericalInputs, setNumericalInputs] = useState({});

  // Coding Workspace State
  // { [questionVersionId]: 'python' | 'cpp' | 'java' | 'javascript' }
  const [codingLanguages, setCodingLanguages] = useState({});
  // { [questionVersionId]: { [lang]: sourceCode } }
  const [codingCodes, setCodingCodes] = useState({});
  // { [questionVersionId]: 'RUN' | 'SUBMIT' | null }
  const [codingExecutionMode, setCodingExecutionMode] = useState({});
  // { [questionVersionId]: boolean }
  const [codingExecuting, setCodingExecuting] = useState({});
  // { [questionVersionId]: object | null }
  const [codingRunResults, setCodingRunResults] = useState({});
  // { [questionVersionId]: object | null }
  const [codingSubmitResults, setCodingSubmitResults] = useState({});
  // { [questionVersionId]: string | null }
  const [codingErrors, setCodingErrors] = useState({});
  // Active test case tab in results: { [questionVersionId]: number }
  const [activeTestTab, setActiveTestTab] = useState({});
  // Reset confirmation modal
  const [showResetCodeModal, setShowResetCodeModal] = useState(false);

  // Editor ref for line numbers sync
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  // Request sequencing tracker to prevent stale out-of-order writes
  const latestRequestSeqRef = useRef({});

  // Load contest questions and attempt state
  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const clientFetchStart = Date.now();
      const res = await practiceService.getContestQuestions(contestId, attemptId);

      if (!res || !res.questions) {
        throw new Error("Invalid contest workspace response received from Practice service.");
      }

      // If attempt is already finalized, route to result
      if (["SUBMITTED", "TIMED_OUT", "DISQUALIFIED"].includes(res.status)) {
        navigate(`/student/contests/${contestId}/attempt/${attemptId}/result`, { replace: true });
        return;
      }

      setAttemptMeta({
        attemptId: res.attemptId,
        contestId: res.contestId,
        status: res.status,
        totalQuestions: res.totalQuestions
      });

      setContestQuestions(res.questions);

      // Extract unique sections
      const sections = [...new Set(res.questions.map((q) => q.section))];
      if (sections.length > 0 && !currentSection) {
        setCurrentSection(sections[0]);
      }

      // Hydrate saved responses from backend
      const hydratedAnswers = {};
      const hydratedStatuses = {};
      const hydratedNumInputs = {};
      const hydratedLanguages = {};
      const hydratedCodes = {};

      // Initialize default code templates for all coding questions
      res.questions.forEach((q) => {
        if (q.section === "CODING" && q.questionVersionId) {
          const qvId = q.questionVersionId;
          hydratedLanguages[qvId] = "python";
          hydratedCodes[qvId] = {
            python: STARTER_TEMPLATES.python,
            cpp: STARTER_TEMPLATES.cpp,
            java: STARTER_TEMPLATES.java,
            javascript: STARTER_TEMPLATES.javascript
          };
        }
      });

      if (res.savedResponses) {
        Object.entries(res.savedResponses).forEach(([qvId, resp]) => {
          if (resp && resp.answerData !== undefined && resp.answerData !== null) {
            hydratedAnswers[qvId] = resp.answerData;
            hydratedStatuses[qvId] = "saved";

            if (resp.answerData.value !== undefined) {
              hydratedNumInputs[qvId] = String(resp.answerData.value);
            }

            // Hydrate coding solution if saved
            if (resp.answerData.language && resp.answerData.sourceCode) {
              const lang = resp.answerData.language.toLowerCase().trim();
              hydratedLanguages[qvId] = lang;
              if (!hydratedCodes[qvId]) {
                hydratedCodes[qvId] = { ...STARTER_TEMPLATES };
              }
              hydratedCodes[qvId][lang] = resp.answerData.sourceCode;
            }
          }
        });
      }

      setAnswers(hydratedAnswers);
      setSaveStatuses(hydratedStatuses);
      setNumericalInputs(hydratedNumInputs);
      setCodingLanguages((prev) => ({ ...hydratedLanguages, ...prev }));
      setCodingCodes((prev) => ({ ...hydratedCodes, ...prev }));

      // Server Clock Calibration
      if (res.effectiveDeadline) {
        const deadlineMs = new Date(res.effectiveDeadline).getTime();
        setEffectiveDeadlineMs(deadlineMs);

        let offset = 0;
        if (typeof res.remainingMs === "number") {
          offset = (deadlineMs - res.remainingMs) - clientFetchStart;
        }
        setServerOffsetMs(offset);

        const currentServerNow = Date.now() + offset;
        const initialRemaining = Math.max(0, deadlineMs - currentServerNow);
        setRemainingMs(initialRemaining);

        if (initialRemaining <= 0) {
          setIsExpired(true);
        }
      }
    } catch (err) {
      console.error("Failed to load contest workspace:", err);
      setError(err.message || "Failed to load contest workspace.");
    } finally {
      setLoading(false);
    }
  }, [contestId, attemptId, navigate, currentSection]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // Server-Authoritative Timer Loop
  useEffect(() => {
    if (!effectiveDeadlineMs || isExpired) return;

    const interval = setInterval(() => {
      const authoritativeNow = Date.now() + serverOffsetMs;
      const left = Math.max(0, effectiveDeadlineMs - authoritativeNow);
      setRemainingMs(left);

      if (left <= 0) {
        setIsExpired(true);
        clearInterval(interval);
        handleTimeoutFinalization();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [effectiveDeadlineMs, serverOffsetMs, isExpired]);

  // Handle Automatic Timeout Finalization
  const handleTimeoutFinalization = async () => {
    try {
      await practiceService.finalizeContest(contestId, attemptId);
    } catch (err) {
      console.warn("Finalization call on timeout completed with notice:", err);
    } finally {
      navigate(`/student/contests/${contestId}/attempt/${attemptId}/result`, { replace: true });
    }
  };

  // Section & Question Splitting
  const sections = [...new Set(contestQuestions.map((q) => q.section))];
  const sectionQuestions = contestQuestions.filter((q) => q.section === currentSection);
  const currentContestQuestion = sectionQuestions[currentQuestionIndex] || contestQuestions[0];
  const currentQuestionVersion = currentContestQuestion?.questionVersion;
  const currentQvId = currentQuestionVersion?.id;
  const currentSaveStatus = saveStatuses[currentQvId];

  // Active coding parameters for current question
  const currentCodingLang = (currentQvId && codingLanguages[currentQvId]) || "python";
  const currentSourceCode =
    (currentQvId && codingCodes[currentQvId]?.[currentCodingLang]) ||
    STARTER_TEMPLATES[currentCodingLang] ||
    "";
  const isCodingRunning = currentQvId ? Boolean(codingExecuting[currentQvId]) : false;
  const currentRunResult = currentQvId ? codingRunResults[currentQvId] : null;
  const currentSubmitResult = currentQvId ? codingSubmitResults[currentQvId] : null;
  const currentCodingError = currentQvId ? codingErrors[currentQvId] : null;

  // Format Timer String
  const formatTime = (ms) => {
    if (ms === null || ms === undefined || ms <= 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, "0");
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `00:${pad(minutes)}:${pad(seconds)}`;
  };

  // Safe Server Autosave for MCQs
  const persistAnswer = async (qvId, answerData) => {
    if (isExpired || submitting) return;

    const seq = (latestRequestSeqRef.current[qvId] || 0) + 1;
    latestRequestSeqRef.current[qvId] = seq;

    setSaveStatuses((prev) => ({ ...prev, [qvId]: "saving" }));

    try {
      await practiceService.saveContestResponse(contestId, attemptId, {
        questionVersionId: qvId,
        answerData
      });

      if (latestRequestSeqRef.current[qvId] === seq) {
        setSaveStatuses((prev) => ({ ...prev, [qvId]: "saved" }));
      }
    } catch (err) {
      console.error(`Failed to persist response for ${qvId}:`, err);
      if (latestRequestSeqRef.current[qvId] === seq) {
        setSaveStatuses((prev) => ({ ...prev, [qvId]: "error" }));
      }
    }
  };

  // Single Choice / True False Handler
  const handleSelectOption = (optionId) => {
    if (!currentQuestionVersion || isExpired || submitting) return;
    const qvId = currentQuestionVersion.id;
    const format = currentQuestionVersion.format;

    let newAnswerData;
    if (format === "TRUE_FALSE") {
      const boolVal = optionId === "true" || optionId === true;
      newAnswerData = { value: boolVal };
    } else {
      newAnswerData = { optionId };
    }

    setAnswers((prev) => ({ ...prev, [qvId]: newAnswerData }));
    persistAnswer(qvId, newAnswerData);
  };

  // Multiple Choice Handler
  const handleToggleMultiOption = (optionId) => {
    if (!currentQuestionVersion || isExpired || submitting) return;
    const qvId = currentQuestionVersion.id;

    const existingIds = answers[qvId]?.optionIds || (Array.isArray(answers[qvId]) ? answers[qvId] : []);
    const exists = existingIds.includes(optionId);
    const updated = exists ? existingIds.filter((id) => id !== optionId) : [...existingIds, optionId];
    const newAnswerData = { optionIds: updated };

    setAnswers((prev) => ({ ...prev, [qvId]: newAnswerData }));
    persistAnswer(qvId, newAnswerData);
  };

  // Numerical Value Handler
  const handleSaveNumerical = () => {
    if (!currentQuestionVersion || isExpired || submitting) return;
    const qvId = currentQuestionVersion.id;
    const rawVal = numericalInputs[qvId];

    if (rawVal === undefined || rawVal.trim() === "") return;
    const num = Number(rawVal);
    if (isNaN(num)) return;

    const newAnswerData = { value: num };
    setAnswers((prev) => ({ ...prev, [qvId]: newAnswerData }));
    persistAnswer(qvId, newAnswerData);
  };

  // Clear Answer Handler
  const handleClearAnswer = async () => {
    if (!currentQuestionVersion || isExpired || submitting) return;
    const qvId = currentQuestionVersion.id;

    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qvId];
      return copy;
    });

    setNumericalInputs((prev) => {
      const copy = { ...prev };
      delete copy[qvId];
      return copy;
    });

    const emptyAnswer = {};
    persistAnswer(qvId, emptyAnswer);
  };

  // Retry Failed Save
  const handleRetrySave = () => {
    if (!currentQuestionVersion) return;
    const qvId = currentQuestionVersion.id;
    const answerData = answers[qvId] || {};
    persistAnswer(qvId, answerData);
  };

  // ==========================================
  // CODING EXECUTION LOGIC (RUN & SUBMIT)
  // ==========================================

  const handleSourceCodeChange = (newCode) => {
    if (!currentQvId || isExpired || submitting) return;
    setCodingCodes((prev) => ({
      ...prev,
      [currentQvId]: {
        ...(prev[currentQvId] || STARTER_TEMPLATES),
        [currentCodingLang]: newCode
      }
    }));
  };

  const handleLanguageChange = (newLang) => {
    if (!currentQvId || isExpired || submitting) return;
    setCodingLanguages((prev) => ({ ...prev, [currentQvId]: newLang }));
    // Ensure code template exists
    if (!codingCodes[currentQvId]?.[newLang]) {
      setCodingCodes((prev) => ({
        ...prev,
        [currentQvId]: {
          ...(prev[currentQvId] || {}),
          [newLang]: STARTER_TEMPLATES[newLang] || ""
        }
      }));
    }
  };

  const handleResetCode = () => {
    if (!currentQvId || isExpired || submitting) return;
    setCodingCodes((prev) => ({
      ...prev,
      [currentQvId]: {
        ...(prev[currentQvId] || {}),
        [currentCodingLang]: STARTER_TEMPLATES[currentCodingLang] || ""
      }
    }));
    setShowResetCodeModal(false);
  };

  // Code editor textarea tab indentation & line sync
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = currentSourceCode;
      const updated = val.substring(0, start) + "    " + val.substring(end);
      handleSourceCodeChange(updated);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const lineCount = Math.max(15, currentSourceCode.split("\n").length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // RUN Code against Public Sample Cases
  const handleRunCode = async () => {
    if (!currentQvId || isExpired || submitting || isCodingRunning) return;

    setCodingExecuting((prev) => ({ ...prev, [currentQvId]: true }));
    setCodingExecutionMode((prev) => ({ ...prev, [currentQvId]: "RUN" }));
    setCodingErrors((prev) => ({ ...prev, [currentQvId]: null }));

    try {
      const res = await practiceService.runCode({
        questionVersionId: currentQvId,
        language: currentCodingLang,
        sourceCode: currentSourceCode,
        contestAttemptId: attemptId
      });

      setCodingRunResults((prev) => ({ ...prev, [currentQvId]: res }));
      setActiveTestTab((prev) => ({ ...prev, [currentQvId]: 0 }));
    } catch (err) {
      console.error("Run code failed:", err);
      setCodingErrors((prev) => ({
        ...prev,
        [currentQvId]: err.message || "Failed to execute code against sample test cases."
      }));
    } finally {
      setCodingExecuting((prev) => ({ ...prev, [currentQvId]: false }));
    }
  };

  // SUBMIT Code against All (Public + Hidden) Cases
  const handleSubmitCode = async () => {
    if (!currentQvId || isExpired || submitting || isCodingRunning) return;

    setCodingExecuting((prev) => ({ ...prev, [currentQvId]: true }));
    setCodingExecutionMode((prev) => ({ ...prev, [currentQvId]: "SUBMIT" }));
    setCodingErrors((prev) => ({ ...prev, [currentQvId]: null }));

    try {
      const res = await practiceService.submitCode({
        questionVersionId: currentQvId,
        language: currentCodingLang,
        sourceCode: currentSourceCode,
        contestAttemptId: attemptId
      });

      setCodingSubmitResults((prev) => ({ ...prev, [currentQvId]: res }));
      setActiveTestTab((prev) => ({ ...prev, [currentQvId]: 0 }));

      // Update answer state to mark question as answered in palette
      setAnswers((prev) => ({
        ...prev,
        [currentQvId]: {
          language: currentCodingLang,
          sourceCode: currentSourceCode,
          earnedMarks: res?.earnedMarks || 0,
          status: res?.status
        }
      }));
    } catch (err) {
      console.error("Submit code failed:", err);
      setCodingErrors((prev) => ({
        ...prev,
        [currentQvId]: err.message || "Failed to submit code for official evaluation."
      }));
    } finally {
      setCodingExecuting((prev) => ({ ...prev, [currentQvId]: false }));
    }
  };

  // Submit Final Contest Attempt
  const handleSubmitContest = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await practiceService.submitContest(contestId, attemptId);
      if (res) {
        navigate(`/student/contests/${contestId}/attempt/${attemptId}/result`, { replace: true });
      }
    } catch (err) {
      console.error("Contest submission failed:", err);
      setSubmitError(err.message || "Failed to submit contest attempt. Please try again.");
      setSubmitting(false);
    }
  };

  // Helper to determine if a question is answered
  const isQuestionAnswered = (qvId) => {
    const ans = answers[qvId];
    if (!ans) return false;
    if (ans.optionId) return true;
    if (Array.isArray(ans.optionIds) && ans.optionIds.length > 0) return true;
    if (ans.value !== undefined && ans.value !== null && ans.value !== "") return true;
    // Coding answer check
    if (ans.sourceCode && typeof ans.sourceCode === "string" && ans.sourceCode.trim()) return true;
    return false;
  };

  // Status Badge Helper for Execution
  const getStatusBadge = (status) => {
    switch (status) {
      case "ACCEPTED":
        return <Badge variant="success" size="sm">Accepted</Badge>;
      case "WRONG_ANSWER":
        return <Badge variant="danger" size="sm">Wrong Answer</Badge>;
      case "COMPILATION_ERROR":
        return <Badge variant="danger" size="sm">Compilation Error</Badge>;
      case "RUNTIME_ERROR":
        return <Badge variant="danger" size="sm">Runtime Error</Badge>;
      case "TIME_LIMIT_EXCEEDED":
        return <Badge variant="warning" size="sm">Time Limit Exceeded</Badge>;
      case "PARTIAL":
        return <Badge variant="warning" size="sm">Partial Score</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status || "Pending"}</Badge>;
    }
  };

  // Stats for submission confirmation
  const totalQuestionsCount = contestQuestions.length;
  const answeredQuestionsCount = contestQuestions.filter((q) =>
    isQuestionAnswered(q.questionVersionId)
  ).length;
  const unansweredQuestionsCount = totalQuestionsCount - answeredQuestionsCount;

  // Render Loading
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-indigo-600" />
        <div className="text-center">
          <h3 className="text-base font-bold text-slate-900">Loading Assessment Workspace...</h3>
          <p className="text-xs text-slate-500 mt-1">Calibrating server clock and syncing questions...</p>
        </div>
      </div>
    );
  }

  // Render Error
  if (error || !currentContestQuestion) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Unable to Load Contest Workspace</h3>
        <p className="text-xs text-slate-600">{error || "Contest attempt could not be initialized."}</p>
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/student/contests")}>
            Back to Assessments
          </Button>
          <Button variant="primary" size="sm" onClick={loadWorkspace}>
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  const isWarning = remainingMs !== null && remainingMs < 5 * 60 * 1000 && remainingMs > 0;
  const isCodingSection = currentContestQuestion.section === "CODING";
  const codingProblem = currentQuestionVersion?.codingProblem || {};
  const sampleTestCases = codingProblem.testCases || [];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* 1. TOP HEADER & TIMER BAR */}
      <header className="bg-white border border-slate-200/90 rounded-2xl shadow-xs px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-4 z-20 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Placement Assessment
              </span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-300" />
              <Badge variant="neutral" size="xs">
                Section: {currentSection}
              </Badge>
            </div>
            <h1 className="text-sm font-bold text-slate-900 line-clamp-1">
              Question {currentQuestionIndex + 1} of {sectionQuestions.length} ({answeredQuestionsCount}/{totalQuestionsCount} Total Answered)
            </h1>
          </div>
        </div>

        {/* Server Authoritative Timer + Submit Action */}
        <div className="flex items-center gap-3 ml-auto">
          <div
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-sm font-bold transition-all shadow-2xs",
              isExpired
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : isWarning
                ? "bg-amber-50 text-amber-700 border-amber-300 animate-pulse"
                : "bg-slate-900 text-white border-slate-900"
            )}
            title="Authoritative Server Synchronized Contest Clock"
          >
            <Clock className={cn("w-4 h-4", isWarning && "text-amber-600")} />
            <span>{formatTime(remainingMs)}</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Send}
            onClick={() => setShowSubmitModal(true)}
            disabled={submitting}
            className="shadow-sm"
          >
            Submit Assessment
          </Button>
        </div>
      </header>

      {/* 2. SECTION TABS */}
      {sections.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {sections.map((sec) => {
            const count = contestQuestions.filter((q) => q.section === sec).length;
            const answeredInSec = contestQuestions.filter(
              (q) => q.section === sec && isQuestionAnswered(q.questionVersionId)
            ).length;
            const isActive = sec === currentSection;

            return (
              <button
                key={sec}
                onClick={() => {
                  setCurrentSection(sec);
                  setCurrentQuestionIndex(0);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {sec === "CODING" ? (
                  <Code2 className="w-3.5 h-3.5" />
                ) : sec === "TECHNICAL" ? (
                  <Cpu className="w-3.5 h-3.5" />
                ) : (
                  <BookOpen className="w-3.5 h-3.5" />
                )}
                <span>{sec}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {answeredInSec}/{count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Question / Coding Problem + Editor (8 COLS) */}
        <div className="lg:col-span-8 space-y-4">
          {/* A. CODING PROBLEM WORKSPACE */}
          {isCodingSection ? (
            <div className="space-y-4">
              {/* Problem Statement Card */}
              <Card className="p-5 border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                      Q{currentQuestionIndex + 1}
                    </span>
                    <Badge variant="indigo" size="xs">
                      Algorithmic Coding
                    </Badge>
                    {currentQuestionVersion?.difficulty && (
                      <Badge
                        variant={
                          currentQuestionVersion.difficulty === "EASY"
                            ? "success"
                            : currentQuestionVersion.difficulty === "MEDIUM"
                            ? "warning"
                            : "danger"
                        }
                        size="xs"
                      >
                        {currentQuestionVersion.difficulty}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>
                      Max Marks: <strong className="text-indigo-600 font-bold">{currentContestQuestion.marks} pts</strong>
                    </span>
                  </div>
                </div>

                {/* Problem Title & Statement */}
                <div className="space-y-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {currentQuestionVersion?.title || "Coding Challenge"}
                  </h2>
                  <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {currentQuestionVersion?.statement || "No statement provided."}
                  </div>
                </div>

                {/* Constraints & Limits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {codingProblem.constraints && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]">
                      <span className="font-bold text-slate-500 block uppercase tracking-wider">Constraints</span>
                      <span className="text-slate-800 font-mono">{codingProblem.constraints}</span>
                    </div>
                  )}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]">
                    <span className="font-bold text-slate-500 block uppercase tracking-wider">Time Limit</span>
                    <span className="text-slate-800 font-mono">{codingProblem.timeLimitMs || 2000} ms</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]">
                    <span className="font-bold text-slate-500 block uppercase tracking-wider">Memory Limit</span>
                    <span className="text-slate-800 font-mono">{Math.round((codingProblem.memoryLimitKb || 128000) / 1024)} MB</span>
                  </div>
                </div>

                {/* Input / Output Format */}
                {(codingProblem.inputFormat || codingProblem.outputFormat) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {codingProblem.inputFormat && (
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                        <span className="font-bold text-slate-700 block mb-1">Input Format:</span>
                        <p className="text-slate-600 whitespace-pre-wrap font-mono text-[11px]">
                          {codingProblem.inputFormat}
                        </p>
                      </div>
                    )}
                    {codingProblem.outputFormat && (
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                        <span className="font-bold text-slate-700 block mb-1">Output Format:</span>
                        <p className="text-slate-600 whitespace-pre-wrap font-mono text-[11px]">
                          {codingProblem.outputFormat}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Sample Test Cases (Public Only) */}
                {sampleTestCases.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-slate-800 block">
                      Sample Test Cases (Public):
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {sampleTestCases.map((tc, idx) => (
                        <div
                          key={tc.id || idx}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-mono space-y-1"
                        >
                          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                            Sample {idx + 1}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-500 block text-[10px] font-bold">Input:</span>
                              <pre className="text-slate-900 bg-white p-2 rounded-lg border border-slate-200 overflow-x-auto">
                                {tc.input}
                              </pre>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] font-bold">Expected Output:</span>
                              <pre className="text-slate-900 bg-white p-2 rounded-lg border border-slate-200 overflow-x-auto">
                                {tc.expectedOutput}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source Attribution & Provenance */}
                {currentQuestionVersion?.sourceType && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Source: {currentQuestionVersion.sourceType}</span>
                    {currentQuestionVersion.attribution && <span>• {currentQuestionVersion.attribution}</span>}
                    {currentQuestionVersion.sourceUrl && (
                      <a
                        href={currentQuestionVersion.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline flex items-center gap-0.5"
                      >
                        Ref <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                )}
              </Card>

              {/* Code Editor Card */}
              <Card className="border-slate-800 bg-slate-950 shadow-md flex flex-col overflow-hidden rounded-2xl">
                {/* Editor Header: Language Selector & Controls */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Language:</span>
                    <select
                      value={currentCodingLang}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      disabled={isExpired || submitting || isCodingRunning}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer"
                    >
                      <option value="python">Python 3 (3.8.1)</option>
                      <option value="cpp">C++ (GCC 9.2.0)</option>
                      <option value="java">Java (OpenJDK 13)</option>
                      <option value="javascript">JavaScript (Node.js 12)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowResetCodeModal(true)}
                      disabled={isExpired || submitting || isCodingRunning}
                      className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Reset code template"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset Code</span>
                    </button>
                  </div>
                </div>

                {/* Editor Textarea with Line Numbers */}
                <div className="relative flex bg-slate-950 font-mono text-xs sm:text-sm h-[380px] overflow-hidden">
                  <div
                    ref={lineNumbersRef}
                    className="w-12 py-3 bg-slate-900/60 text-slate-500 text-right pr-3 select-none overflow-hidden font-mono text-xs border-r border-slate-800/80 leading-6 shrink-0"
                  >
                    {lineNumbers.map((n) => (
                      <div key={n}>{n}</div>
                    ))}
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={currentSourceCode}
                    onChange={(e) => handleSourceCodeChange(e.target.value)}
                    onScroll={handleScroll}
                    onKeyDown={handleKeyDown}
                    disabled={isExpired || submitting}
                    spellCheck={false}
                    className="flex-1 p-3 bg-transparent text-slate-100 font-mono text-xs sm:text-sm resize-none focus:outline-none leading-6 overflow-y-auto whitespace-pre tab-4"
                    placeholder="Write your code here..."
                  />
                </div>

                {/* Editor Bottom Action Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Terminal className="w-4 h-4 text-slate-500" />
                    <span>Judge0 Sandbox @ LAN</span>
                    {isQuestionAnswered(currentQvId) && (
                      <span className="text-emerald-400 font-bold ml-1 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Code Submitted
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Play}
                      onClick={handleRunCode}
                      disabled={isExpired || submitting || isCodingRunning}
                      className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                    >
                      {isCodingRunning && codingExecutionMode[currentQvId] === "RUN"
                        ? "Running Sample Tests..."
                        : "Run Code"}
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={Send}
                      onClick={handleSubmitCode}
                      disabled={isExpired || submitting || isCodingRunning}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      {isCodingRunning && codingExecutionMode[currentQvId] === "SUBMIT"
                        ? "Submitting to Judge0..."
                        : "Submit Solution"}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Execution Error Banner */}
              {currentCodingError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <span className="font-bold block">Execution Failed</span>
                    <span>{currentCodingError}</span>
                  </div>
                </div>
              )}

              {/* EXECUTION RESULTS PANEL (RUN / SUBMIT) */}
              {(currentRunResult || currentSubmitResult) && (
                <Card className="p-5 border-slate-200 shadow-xs space-y-4">
                  {/* Results Header */}
                  {(() => {
                    const activeResult = currentSubmitResult || currentRunResult;
                    const isSubmit = Boolean(currentSubmitResult);
                    const testResults = activeResult?.testResults || [];
                    const activeIndex = activeTestTab[currentQvId] || 0;
                    const selectedTestCase = testResults[activeIndex] || testResults[0];

                    return (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              {isSubmit ? "Official Submission Result" : "Sample Run Result"}
                            </h3>
                            {getStatusBadge(activeResult?.status)}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-600">
                            <span>
                              Tests Passed:{" "}
                              <strong className="text-slate-900 font-bold">
                                {activeResult?.testsPassed} / {activeResult?.testsTotal}
                              </strong>
                            </span>
                            {isSubmit && (
                              <span>
                                Score:{" "}
                                <strong className="text-emerald-600 font-bold">
                                  {activeResult?.earnedMarks} / {currentContestQuestion.marks} pts
                                </strong>
                              </span>
                            )}
                            {activeResult?.executionTimeMs !== undefined && (
                              <span>{activeResult.executionTimeMs} ms</span>
                            )}
                          </div>
                        </div>

                        {/* Compilation Error Output */}
                        {activeResult?.compileOutput && (
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4" /> Compilation Diagnostics
                            </span>
                            <pre className="p-3 bg-slate-900 text-rose-300 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
                              {activeResult.compileOutput}
                            </pre>
                          </div>
                        )}

                        {/* Test Cases Tab Strip */}
                        {testResults.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {testResults.map((tr, idx) => (
                                <button
                                  key={tr.id || idx}
                                  onClick={() =>
                                    setActiveTestTab((prev) => ({
                                      ...prev,
                                      [currentQvId]: idx
                                    }))
                                  }
                                  className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shrink-0",
                                    activeIndex === idx
                                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                      : tr.passed
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                      : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                                  )}
                                >
                                  {tr.passed ? (
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  ) : (
                                    <XCircle className="w-3 h-3" />
                                  )}
                                  <span>
                                    {tr.isHidden ? `Hidden Test ${idx + 1}` : `Sample ${idx + 1}`}
                                  </span>
                                </button>
                              ))}
                            </div>

                            {/* Selected Test Case Detail */}
                            {selectedTestCase && (
                              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 font-mono text-xs">
                                <div className="flex items-center justify-between text-[11px] text-slate-500 font-sans border-b border-slate-200 pb-2">
                                  <span className="font-bold text-slate-700">
                                    {selectedTestCase.isHidden
                                      ? `Evaluation Test Case (Hidden)`
                                      : `Sample Test Case`}
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <span>Time: {selectedTestCase.executionTimeMs || 0} ms</span>
                                    <span>Memory: {selectedTestCase.memoryUsedKb || 0} KB</span>
                                  </div>
                                </div>

                                {selectedTestCase.isHidden ? (
                                  <div className="py-3 text-center text-slate-500 font-sans text-xs">
                                    <p className="font-bold text-slate-700">Hidden Evaluation Boundary Case</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                      Input and expected output are protected for assessment integrity.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1 font-sans">
                                        Input:
                                      </span>
                                      <pre className="p-2 bg-white rounded-lg border border-slate-200 overflow-x-auto text-slate-800">
                                        {selectedTestCase.input || "Empty"}
                                      </pre>
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1 font-sans">
                                        Expected Output:
                                      </span>
                                      <pre className="p-2 bg-white rounded-lg border border-slate-200 overflow-x-auto text-slate-800">
                                        {selectedTestCase.expectedOutput || "Empty"}
                                      </pre>
                                    </div>
                                    {selectedTestCase.stdout && (
                                      <div className="sm:col-span-2">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1 font-sans">
                                          Your Output (Stdout):
                                        </span>
                                        <pre className="p-2 bg-white rounded-lg border border-slate-200 overflow-x-auto text-slate-800">
                                          {selectedTestCase.stdout}
                                        </pre>
                                      </div>
                                    )}
                                    {selectedTestCase.stderr && (
                                      <div className="sm:col-span-2">
                                        <span className="text-[10px] font-bold text-rose-600 uppercase block mb-1 font-sans">
                                          Error Output (Stderr):
                                        </span>
                                        <pre className="p-2 bg-rose-50 rounded-lg border border-rose-200 overflow-x-auto text-rose-800">
                                          {selectedTestCase.stderr}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </Card>
              )}
            </div>
          ) : (
            /* B. MCQ QUESTION WORKSPACE (Aptitude / Technical) */
            <Card className="p-6 border-slate-200/90 shadow-xs space-y-5">
              {/* Question Sub-header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                    Q{currentQuestionIndex + 1}
                  </span>
                  <Badge variant="indigo" size="xs">
                    {currentQuestionVersion?.type || currentContestQuestion.section}
                  </Badge>
                  {currentQuestionVersion?.difficulty && (
                    <Badge variant="neutral" size="xs">
                      {currentQuestionVersion.difficulty}
                    </Badge>
                  )}
                </div>

                {/* Marks & Autosave Status */}
                <div className="flex items-center gap-3">
                  <div className="text-xs font-semibold text-slate-500">
                    <span className="text-emerald-600 font-bold">+{currentContestQuestion.marks}</span>
                    {Number(currentContestQuestion.negativeMarks) > 0 && (
                      <span className="text-rose-500 font-bold ml-1">
                        (-{currentContestQuestion.negativeMarks})
                      </span>
                    )}{" "}
                    marks
                  </div>

                  {/* Save status badge */}
                  <div className="flex items-center gap-1.5 text-xs">
                    {currentSaveStatus === "saving" && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Saving...
                      </span>
                    )}
                    {currentSaveStatus === "saved" && (
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <Check className="w-3 h-3" />
                        Saved
                      </span>
                    )}
                    {currentSaveStatus === "error" && (
                      <button
                        onClick={handleRetrySave}
                        className="flex items-center gap-1 text-rose-600 font-medium hover:underline cursor-pointer"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Save Failed • Retry
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Question Title & Statement */}
              <div className="space-y-3">
                {currentQuestionVersion?.title && (
                  <h2 className="text-base font-bold text-slate-900">
                    {currentQuestionVersion.title}
                  </h2>
                )}
                <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
                  {currentQuestionVersion?.statement || "No question statement provided."}
                </div>
              </div>

              {/* MCQ OPTIONS / TRUE_FALSE / NUMERICAL */}
              <div className="space-y-3 pt-2">
                {/* Format: SINGLE_CHOICE */}
                {currentQuestionVersion?.format === "SINGLE_CHOICE" && currentQuestionVersion.options && (
                  <div className="space-y-2.5">
                    {currentQuestionVersion.options.map((opt, idx) => {
                      const optId = opt.id || `opt_${idx}`;
                      const isSelected = answers[currentQvId]?.optionId === optId;

                      return (
                        <div
                          key={optId}
                          onClick={() => !isExpired && handleSelectOption(optId)}
                          className={cn(
                            "flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                            isSelected
                              ? "bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                              isSelected
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            )}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <div className="flex-1 text-xs text-slate-800 leading-normal">
                            <span className="font-bold mr-1.5 text-slate-500">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            {opt.text || opt.statement || String(opt)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Format: MULTIPLE_CHOICE */}
                {currentQuestionVersion?.format === "MULTIPLE_CHOICE" && currentQuestionVersion.options && (
                  <div className="space-y-2.5">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Select all correct options
                    </div>
                    {currentQuestionVersion.options.map((opt, idx) => {
                      const optId = opt.id || `opt_${idx}`;
                      const selectedIds = answers[currentQvId]?.optionIds || (Array.isArray(answers[currentQvId]) ? answers[currentQvId] : []);
                      const isSelected = selectedIds.includes(optId);

                      return (
                        <div
                          key={optId}
                          onClick={() => !isExpired && handleToggleMultiOption(optId)}
                          className={cn(
                            "flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                            isSelected
                              ? "bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                              isSelected
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            )}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div className="flex-1 text-xs text-slate-800 leading-normal">
                            <span className="font-bold mr-1.5 text-slate-500">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            {opt.text || opt.statement || String(opt)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Format: TRUE_FALSE */}
                {currentQuestionVersion?.format === "TRUE_FALSE" && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "True", val: true },
                      { label: "False", val: false }
                    ].map((tf) => {
                      const isSelected = answers[currentQvId]?.value === tf.val;
                      return (
                        <button
                          key={tf.label}
                          type="button"
                          onClick={() => !isExpired && handleSelectOption(tf.val)}
                          className={cn(
                            "py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2",
                            isSelected
                              ? "bg-indigo-50 border-indigo-400 text-indigo-700 ring-2 ring-indigo-500/20 shadow-xs"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full border flex items-center justify-center",
                              isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"
                            )}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span>{tf.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Format: NUMERICAL */}
                {currentQuestionVersion?.format === "NUMERICAL" && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Enter Numerical Value:</label>
                    <div className="flex items-center gap-2 max-w-xs">
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 42"
                        value={numericalInputs[currentQvId] ?? ""}
                        onChange={(e) =>
                          setNumericalInputs((prev) => ({
                            ...prev,
                            [currentQvId]: e.target.value
                          }))
                        }
                        onBlur={handleSaveNumerical}
                        disabled={isExpired || submitting}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={handleSaveNumerical}
                        disabled={isExpired || submitting}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}

                {/* Clear Response Button if answered */}
                {isQuestionAnswered(currentQvId) && (
                  <div className="pt-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={handleClearAnswer}
                      disabled={isExpired || submitting}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      Clear Selection
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* QUESTION NAVIGATION BOTTOM BAR */}
          <div className="flex items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl px-5 py-3 shadow-2xs">
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            >
              Previous
            </Button>

            <span className="text-xs font-semibold text-slate-400">
              {currentSection} • Q{currentQuestionIndex + 1} of {sectionQuestions.length}
            </span>

            <Button
              variant="primary"
              size="sm"
              disabled={currentQuestionIndex === sectionQuestions.length - 1}
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.min(sectionQuestions.length - 1, prev + 1))
              }
              className="flex-row-reverse"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: QUESTION PALETTE (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Question Palette
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {answeredQuestionsCount} / {totalQuestionsCount} Answered
              </span>
            </div>

            {/* Questions Grid for active section */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {currentSection} Questions
              </span>
              <div className="grid grid-cols-5 gap-2">
                {sectionQuestions.map((q, idx) => {
                  const isCurrent = idx === currentQuestionIndex;
                  const answered = isQuestionAnswered(q.questionVersionId);

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={cn(
                        "h-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center relative border",
                        isCurrent
                          ? "bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-500/30 shadow-xs"
                          : answered
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      <span>{idx + 1}</span>
                      {answered && !isCurrent && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-[11px] font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-md bg-indigo-600 border border-indigo-600" />
                <span>Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-md bg-emerald-50 border border-emerald-300" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-md bg-slate-50 border border-slate-200" />
                <span>Unanswered</span>
              </div>
            </div>

            {/* Assessment Progress Bar */}
            <div className="pt-2">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 transition-all duration-300"
                  style={{
                    width: `${totalQuestionsCount > 0 ? (answeredQuestionsCount / totalQuestionsCount) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 4. SUBMISSION CONFIRMATION MODAL */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => !submitting && setShowSubmitModal(false)}
        title="Submit Placement Assessment"
        subtitle="Please review your response summary before final evaluation."
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Answered
              </span>
              <span className="text-xl font-bold text-emerald-600">
                {answeredQuestionsCount}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Unanswered
              </span>
              <span className="text-xl font-bold text-slate-700">
                {unansweredQuestionsCount}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Once submitted, your responses and coding submissions will be officially evaluated server-side and your final score will be recorded. You will not be able to modify answers after submission.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSubmitModal(false)}
              disabled={submitting}
            >
              Continue Test
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              onClick={handleSubmitContest}
              disabled={submitting}
            >
              {submitting ? "Evaluating..." : "Confirm & Submit"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 5. RESET CODE MODAL */}
      <Modal
        isOpen={showResetCodeModal}
        onClose={() => setShowResetCodeModal(false)}
        title="Reset Code Template"
        subtitle="This will replace your current code with the default starter template."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to reset the code for{" "}
            <strong className="text-slate-900">{currentCodingLang.toUpperCase()}</strong>? Any unsaved edits will be discarded.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setShowResetCodeModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleResetCode}>
              Confirm Reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
