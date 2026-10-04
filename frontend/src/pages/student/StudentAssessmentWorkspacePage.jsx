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
import { practiceApi } from "../../services/practiceApi";
import { cn } from "../../utils/cn";

const STARTER_TEMPLATES = {
  python: `# Python 3 Solution
import sys

def solve():
    # Read input from standard input
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

import {
  normalizeOptions,
  isOptionSelected,
  extractQuestionDetails,
  isQuestionAnswered
} from "../../utils/questionUtils";

export function StudentAssessmentWorkspacePage() {
  const { assessmentId, attemptId } = useParams();
  const navigate = useNavigate();

  // Attempt & Questions state
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Response state map: questionVersionId -> answerData
  const [responses, setResponses] = useState({});
  const [savingStatus, setSavingStatus] = useState("SAVED"); // "SAVING" | "SAVED" | "ERROR"

  // Active section filter
  const [activeSection, setActiveSection] = useState("ALL");

  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Code editor state per coding question: questionVersionId -> { language, code, runResult, submitResult }
  const [codingState, setCodingState] = useState({});
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Autosave debounce timer ref
  const saveTimeoutRef = useRef({});

  // 1. Initial Load: Fetch Attempt and Questions
  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [attemptRes, questionsRes] = await Promise.all([
        practiceService.getAssessmentAttempt(assessmentId, attemptId),
        practiceService.getAssessmentQuestions(assessmentId, attemptId)
      ]);

      const attemptData = attemptRes?.data && attemptRes.data.id ? attemptRes.data : attemptRes;

      const rawList = Array.isArray(questionsRes)
        ? questionsRes
        : Array.isArray(questionsRes?.data)
        ? questionsRes.data
        : Array.isArray(questionsRes?.questions)
        ? questionsRes.questions
        : [];

      const questionsData = rawList.map(extractQuestionDetails).filter(Boolean);

      if (!attemptData || !attemptData.id) {
        throw new Error("Unable to retrieve attempt.");
      }

      setAttempt(attemptData);
      setQuestions(questionsData);

      // Initialize responses & coding states
      const initialResponses = {};
      const initialCoding = {};

      questionsData.forEach((q) => {
        const vId = q.questionVersionId;
        if (q.response?.answerData) {
          initialResponses[vId] = q.response.answerData;
        }

        if (q.section === "CODING" || q.codingProblem) {
          const prevLang = q.response?.answerData?.language || q.latestSubmission?.language || "python";
          const prevCode = q.response?.answerData?.sourceCode || STARTER_TEMPLATES[prevLang] || "";

          initialCoding[vId] = {
            language: prevLang,
            sourceCode: prevCode,
            runResult: null,
            submitResult: q.latestSubmission || null
          };
        }
      });

      setResponses(initialResponses);
      setCodingState(initialCoding);

      // Compute remaining time
      if (attemptData.effectiveDeadline) {
        const deadlineMs = new Date(attemptData.effectiveDeadline).getTime();
        const diffSec = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
        setRemainingSeconds(diffSec);

        if (diffSec <= 0 || attemptData.status === "TIMED_OUT") {
          setIsTimedOut(true);
        }
      }
    } catch (err) {
      console.error("Error initializing workspace:", err);
      setError(err.message || "Failed to load assessment workspace.");
    } finally {
      setLoading(false);
    }
  }, [assessmentId, attemptId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // 2. Countdown Timer Loop
  useEffect(() => {
    if (remainingSeconds === null || isTimedOut) return;

    if (remainingSeconds <= 0) {
      setIsTimedOut(true);
      handleAutoSubmitOnTimeout();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimedOut(true);
          handleAutoSubmitOnTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, isTimedOut]);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSec) => {
    if (totalSec === null || totalSec < 0) return "00:00:00";
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 3. Auto-Submit on Timeout
  const handleAutoSubmitOnTimeout = async () => {
    try {
      await practiceService.submitAssessment(assessmentId, attemptId);
      navigate(`/student/assessments/${assessmentId}/result/${attemptId}`);
    } catch (err) {
      console.error("Auto submit error:", err);
      navigate(`/student/assessments/${assessmentId}/result/${attemptId}`);
    }
  };

  // 4. Autosave response
  const triggerAutosave = (questionVersionId, answerData) => {
    setSavingStatus("SAVING");

    if (saveTimeoutRef.current[questionVersionId]) {
      clearTimeout(saveTimeoutRef.current[questionVersionId]);
    }

    saveTimeoutRef.current[questionVersionId] = setTimeout(async () => {
      try {
        await practiceService.saveAssessmentResponse(assessmentId, attemptId, {
          questionVersionId,
          answerData
        });
        setSavingStatus("SAVED");
      } catch (err) {
        console.error("Autosave failed:", err);
        setSavingStatus("ERROR");
      }
    }, 400);
  };

  // Handle MCQ selection
  const handleOptionSelect = (optionId) => {
    if (isTimedOut) return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const vId = currentQ.questionVersionId;
    const format = currentQ.format;

    let newAnswerData;
    if (format === "MULTIPLE_CHOICE") {
      const existing = Array.isArray(responses[vId]?.optionIds)
        ? responses[vId].optionIds
        : Array.isArray(responses[vId]?.selectedOptionIds)
        ? responses[vId].selectedOptionIds
        : [];
      const updated = existing.includes(optionId)
        ? existing.filter((id) => id !== optionId)
        : [...existing, optionId];
      newAnswerData = { optionIds: updated };
    } else if (format === "TRUE_FALSE") {
      const isBoolTrue = String(optionId).toLowerCase() === "true" || optionId === true;
      newAnswerData = { value: isBoolTrue, optionId: String(optionId) };
    } else {
      newAnswerData = { optionId: String(optionId) };
    }

    setResponses((prev) => ({
      ...prev,
      [vId]: newAnswerData
    }));

    triggerAutosave(vId, newAnswerData);
  };

  // Handle Numerical Input
  const handleNumericalChange = (value) => {
    if (isTimedOut) return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const vId = currentQ.questionVersionId;
    const newAnswerData = { value };

    setResponses((prev) => ({
      ...prev,
      [vId]: newAnswerData
    }));

    triggerAutosave(vId, newAnswerData);
  };

  // Handle Code Changes
  const handleCodeChange = (code) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const vId = currentQ.questionVersionId;
    setCodingState((prev) => ({
      ...prev,
      [vId]: {
        ...(prev[vId] || {}),
        sourceCode: code
      }
    }));
  };

  // Handle Language Switch
  const handleLanguageChange = (lang) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;


    const vId = currentQ.questionVersionId;
    const currentLang = codingState[vId]?.language || "python";

    if (lang !== currentLang) {
      const defaultTemplate = STARTER_TEMPLATES[lang] || "";
      setCodingState((prev) => ({
        ...prev,
        [vId]: {
          ...(prev[vId] || {}),
          language: lang,
          sourceCode: defaultTemplate,
          runResult: null
        }
      }));
    }
  };

  // Reset Code Template
  const handleResetTemplate = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const vId = currentQ.questionVersionId;
    const lang = codingState[vId]?.language || "python";
    const defaultTemplate = STARTER_TEMPLATES[lang] || "";

    setCodingState((prev) => ({
      ...prev,
      [vId]: {
        ...(prev[vId] || {}),
        sourceCode: defaultTemplate,
        runResult: null
      }
    }));
  };

  // Run Code against public test cases
  const handleRunCode = async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ || isRunningCode) return;

    const vId = currentQ.questionVersionId;
    const qState = codingState[vId] || {};
    const lang = qState.language || "python";
    const code = qState.sourceCode || STARTER_TEMPLATES[lang] || "";

    setIsRunningCode(true);
    setError(null);

    try {
      const res = await practiceApi.post("/api/coding/execute/run", {
        questionVersionId: vId,
        assessmentAttemptId: attemptId,
        language: lang,
        sourceCode: code
      });

      const resultData = res?.data || res;

      setCodingState((prev) => ({
        ...prev,
        [vId]: {
          ...(prev[vId] || {}),
          runResult: resultData
        }
      }));
    } catch (err) {
      console.error("Run code error:", err);
      setError(err.message || "Failed to execute code in sandbox.");
    } finally {
      setIsRunningCode(false);
    }
  };

  // Submit Code for official scoring
  const handleSubmitCode = async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ || isSubmittingCode) return;

    const vId = currentQ.questionVersionId;
    const qState = codingState[vId] || {};
    const lang = qState.language || "python";
    const code = qState.sourceCode || STARTER_TEMPLATES[lang] || "";

    setIsSubmittingCode(true);
    setError(null);

    try {
      const res = await practiceApi.post("/api/coding/execute/submit", {
        questionVersionId: vId,
        assessmentAttemptId: attemptId,
        language: lang,
        sourceCode: code
      });

      const resultData = res?.data || res;

      setCodingState((prev) => ({
        ...prev,
        [vId]: {
          ...(prev[vId] || {}),
          submitResult: resultData,
          runResult: null
        }
      }));

      // Mark question as answered in responses map
      setResponses((prev) => ({
        ...prev,
        [vId]: { language: lang, sourceCode: code, submissionId: resultData.id }
      }));
    } catch (err) {
      console.error("Submit code error:", err);
      setError(err.message || "Failed to submit code for assessment scoring.");
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // Final Assessment Submission
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await practiceService.submitAssessment(assessmentId, attemptId);
      setShowSubmitModal(false);
      navigate(`/student/assessments/${assessmentId}/result/${attemptId}`);
    } catch (err) {
      console.error("Final submit error:", err);
      setError(err.message || "Failed to finalize assessment attempt.");
      setSubmitting(false);
    }
  };

  // Filtered Questions by Section
  const filteredQuestions = questions.filter((q) => {
    if (activeSection === "ALL") return true;
    return q.section === activeSection;
  });

  const currentQ = questions[currentIndex];
  const isCoding = currentQ?.section === "CODING" || Boolean(currentQ?.codingProblem);

  // Compute total answered count
  const answeredCount = questions.filter((q) => isQuestionAnswered(q, responses)).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-indigo-400" />
        <p className="text-sm font-medium text-slate-300">Loading your secure assessment session...</p>
      </div>
    );
  }

  if (error && !currentQ) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Session Error</h2>
          <p className="text-sm text-slate-600">{error}</p>
          <Button onClick={() => navigate("/student/assessments")} className="w-full">
            Back to Assessments
          </Button>
        </Card>
      </div>
    );
  }

  const isCurrentAnswered = isQuestionAnswered(currentQ, responses);

  const currentCodingState = currentQ ? codingState[currentQ.questionVersionId] || {} : {};

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* 1. Header Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 text-white px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 select-none shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold text-white tracking-tight line-clamp-1">
              {attempt?.assessment?.title || "Assessment Session"}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <span>Section: {currentQ?.section || "APTITUDE"}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">{answeredCount} of {questions.length} Answered</span>
            </div>
          </div>
        </div>

        {/* Timer & Submit Controls */}
        <div className="flex items-center gap-4">
          {/* Autosave badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            {savingStatus === "SAVING" ? (
              <span className="flex items-center gap-1 text-amber-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
              </span>
            ) : savingStatus === "SAVED" ? (
              <span className="flex items-center gap-1 text-slate-400">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Saved
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400">
                <AlertCircle className="w-3.5 h-3.5" /> Save Error
              </span>
            )}
          </div>

          {/* Countdown Clock */}
          <div className={cn(
            "flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-mono text-sm font-bold border",
            (remainingSeconds || 0) < 300
              ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse"
              : "bg-slate-800 text-amber-400 border-slate-700"
          )}>
            <Clock className="w-4 h-4" />
            {formatTime(remainingSeconds)}
          </div>

          {/* End & Submit Button */}
          <Button
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 px-4 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Test
          </Button>
        </div>
      </header>

      {/* 2. Workspace Body: Left Palette Sidebar + Center Question/Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Question Palette (collapsible on mobile) */}
        <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col shrink-0 select-none">
          {/* Section Selector */}
          <div className="p-3 border-b border-slate-100 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Filter Section</span>
            <div className="grid grid-cols-2 gap-1.5">
              {["ALL", "APTITUDE", "TECHNICAL", "CODING"].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setActiveSection(sec)}
                  className={cn(
                    "px-2 py-1 text-xs font-semibold rounded-md transition-all text-center",
                    activeSection === sec
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {/* Question Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isSelected = idx === currentIndex;
                const isAns = isQuestionAnswered(q, responses);

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center relative",
                      isSelected
                        ? "ring-2 ring-indigo-600 bg-indigo-600 text-white shadow-sm"
                        : isAns
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Palette Legend */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
              <span>Unanswered</span>
            </div>
          </div>
        </aside>

        {/* Center / Right Content Area */}
        <main className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
          {currentQ && (
            <div className="max-w-5xl mx-auto w-full p-4 md:p-6 space-y-6 flex-1 flex flex-col">
              {/* Question Header Card */}
              <Card className="p-6 bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                      {currentQ.section}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      +{Number(currentQ.marks)} Marks
                    </span>
                    {Number(currentQ.negativeMarks) > 0 && (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        -{Number(currentQ.negativeMarks)} Negative
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Statement */}
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 mb-2">
                    {currentQ.title}
                  </h2>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {currentQ.statement}
                  </p>
                </div>
              </Card>

              {/* Interaction Component based on Type */}
              {isCoding ? (
                /* Coding Arena Sub-Workspace */
                <Card className="flex-1 flex flex-col p-6 bg-white border border-slate-200 shadow-xs space-y-4">
                  {/* Problem Details */}
                  {currentQ.codingProblem && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                      {currentQ.codingProblem.constraints && (
                        <div>
                          <strong className="text-slate-800 uppercase block text-[10px] font-bold">Constraints:</strong>
                          <p className="font-mono text-slate-700">{currentQ.codingProblem.constraints}</p>
                        </div>
                      )}
                      {currentQ.codingProblem.testCases?.length > 0 && (
                        <div>
                          <strong className="text-slate-800 uppercase block text-[10px] font-bold mb-1">Sample Example:</strong>
                          <div className="grid grid-cols-2 gap-2 font-mono bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Input:</span>
                              <pre className="whitespace-pre-wrap text-slate-800">{currentQ.codingProblem.testCases[0].input}</pre>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Expected Output:</span>
                              <pre className="whitespace-pre-wrap text-slate-800">{currentQ.codingProblem.testCases[0].expectedOutput}</pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Code Editor Header */}
                  <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 rounded-t-xl text-white">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-indigo-400" />
                      <select
                        value={currentCodingState.language || "python"}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="bg-slate-800 text-white text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-700 focus:outline-hidden"
                      >
                        <option value="python">Python 3</option>
                        <option value="cpp">C++ (GCC)</option>
                        <option value="java">Java (OpenJDK)</option>
                        <option value="javascript">JavaScript (Node.js)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={handleResetTemplate}
                        className="text-slate-300 hover:text-white text-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Code
                      </Button>
                    </div>
                  </div>

                  {/* Code Editor Textarea */}
                  <div className="flex-1 min-h-[280px]">
                    <textarea
                      value={currentCodingState.sourceCode || ""}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      placeholder="Write your solution code here..."
                      spellCheck="false"
                      className="w-full h-full min-h-[280px] p-4 bg-slate-950 text-slate-100 font-mono text-xs rounded-b-xl border border-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-y"
                    />
                  </div>

                  {/* Coding Action Controls */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-slate-500">
                      {currentCodingState.submitResult ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Official Submission: {currentCodingState.submitResult.status} ({currentCodingState.submitResult.earnedMarks} Marks)
                        </span>
                      ) : (
                        <span>Remember to click SUBMIT to record your official score.</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRunCode}
                        disabled={isRunningCode || isSubmittingCode}
                        className="border-slate-300 hover:bg-slate-100 font-semibold text-xs"
                      >
                        <Play className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                        {isRunningCode ? "Running Tests..." : "Run Public Tests"}
                      </Button>

                      <Button
                        size="sm"
                        onClick={handleSubmitCode}
                        disabled={isRunningCode || isSubmittingCode}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                      >
                        <Send className="w-3.5 h-3.5 mr-1" />
                        {isSubmittingCode ? "Evaluating..." : "Submit Code"}
                      </Button>
                    </div>
                  </div>

                  {/* Execution Results View */}
                  {currentCodingState.runResult && (
                    <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-3 text-xs mt-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <Terminal className="w-4 h-4 text-indigo-400" /> Run Diagnostics
                        </span>
                        <Badge variant={currentCodingState.runResult.status === "ACCEPTED" ? "success" : "danger"}>
                          {currentCodingState.runResult.status}
                        </Badge>
                      </div>

                      {currentCodingState.runResult.compileOutput && (
                        <div className="bg-rose-950/60 p-3 rounded-lg border border-rose-900 text-rose-300 font-mono text-[11px] whitespace-pre-wrap">
                          {currentCodingState.runResult.compileOutput}
                        </div>
                      )}

                      <div className="space-y-2">
                        {currentCodingState.runResult.testResults?.map((tr, i) => (
                          <div key={i} className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 space-y-1.5">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="font-bold text-slate-300">Test Case #{i + 1}</span>
                              <span className={tr.passed ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                {tr.status} ({tr.executionTimeMs || 0}ms)
                              </span>
                            </div>
                            {tr.stdout && (
                              <div className="font-mono text-[11px] bg-slate-950 p-2 rounded text-slate-200">
                                <span className="text-slate-500 block text-[9px]">Output:</span>
                                {tr.stdout}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ) : (
                /* MCQ Question Selection Area */
                <Card className="p-6 bg-white border border-slate-200 shadow-xs space-y-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {currentQ.format === "MULTIPLE_CHOICE"
                      ? "Select All Correct Options (Multiple Choice)"
                      : currentQ.format === "TRUE_FALSE"
                      ? "Select True or False"
                      : currentQ.format === "NUMERICAL"
                      ? "Enter Numerical Value"
                      : "Select One Option (Single Choice)"}
                  </span>

                  {/* Options List */}
                  {currentQ.format === "NUMERICAL" ? (
                    <div className="max-w-xs space-y-2">
                      <label className="text-xs font-medium text-slate-700">Enter Numerical Value:</label>
                      <input
                        type="text"
                        value={responses[currentQ.questionVersionId]?.value ?? responses[currentQ.questionVersionId]?.answer ?? ""}
                        onChange={(e) => handleNumericalChange(e.target.value)}
                        placeholder="e.g. 42"
                        className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {normalizeOptions(currentQ.options, currentQ.format).map((opt) => {
                        const optId = opt.id;
                        const vId = currentQ.questionVersionId;
                        const isSelected = isOptionSelected(optId, vId, currentQ.format, responses);

                        return (
                          <div
                            key={optId}
                            onClick={() => handleOptionSelect(optId)}
                            className={cn(
                              "p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5",
                              isSelected
                                ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                                : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/70"
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0",
                              isSelected
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            )}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>

                            <span className="text-sm font-medium text-slate-800 leading-snug">
                              {opt.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              )}

              {/* Bottom Navigation Toolbar */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    disabled={currentIndex === questions.length - 1}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Assessment"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to end and submit your assessment? Once submitted, your answers will be finalized and evaluated by the server.
          </p>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Total Questions:</span>
              <span className="font-bold text-slate-800">{questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Answered:</span>
              <span className="font-bold text-emerald-600">{answeredCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Unanswered:</span>
              <span className="font-bold text-rose-600">{questions.length - answeredCount}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setShowSubmitModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {submitting ? "Submitting..." : "Yes, Submit Final Test"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
