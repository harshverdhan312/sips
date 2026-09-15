import React, { useState, useEffect } from "react";
import {
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Award
} from "lucide-react";
import { interviewService } from "../../services/interviewService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { useNotifications } from "../../context/NotificationContext";

export function MockInterviewPage() {
  const { addToast } = useNotifications();

  // Screen states: 'setup' | 'session' | 'evaluating' | 'report'
  const [screen, setScreen] = useState("setup");

  // Setup options
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("Full Stack Software Engineer");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [questionCount, setQuestionCount] = useState(3);

  // Active session states
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [userAnswers, setUserAnswers] = useState([]);

  // Final report
  const [report, setReport] = useState(null);

  useEffect(() => {
    async function init() {
      const r = await interviewService.getRoles();
      setRoles(r);
    }
    init();
  }, []);

  // Timer tick during active session
  useEffect(() => {
    let interval = null;
    if (screen === "session" && isRecording) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [screen, isRecording]);

  const handleStartInterview = async () => {
    const qList = await interviewService.getQuestionsForRole(selectedRole);
    setQuestions(qList.slice(0, questionCount));
    setCurrentQIndex(0);
    setTimerSeconds(0);
    setTranscript("");
    setUserAnswers([]);
    setScreen("session");
    addToast(`Interview session started for ${selectedRole}`, "info");
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTranscript("Listening... \"In my recent project, I designed a microservices architecture using Node.js and Redis to handle asynchronous task execution with delayed retries...\"");
    } else {
      setIsRecording(false);
    }
  };

  const handleNextQuestion = () => {
    const currentQ = questions[currentQIndex];
    setUserAnswers((prev) => [
      ...prev,
      {
        question: currentQ.question,
        transcript: transcript || "Sample spoken response regarding engineering best practices.",
        duration: timerSeconds
      }
    ]);

    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex((prev) => prev + 1);
      setIsRecording(false);
      setTimerSeconds(0);
      setTranscript("");
    } else {
      // Finish interview and evaluate
      finishInterview();
    }
  };

  const finishInterview = async () => {
    setScreen("evaluating");
    try {
      const rep = await interviewService.submitInterviewSession({
        role: selectedRole,
        answers: userAnswers
      });
      setReport(rep);
      setScreen("report");
      addToast("AI Interview evaluation completed!", "success");
    } catch (e) {
      console.error(e);
      setScreen("setup");
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. SETUP SCREEN */}
      {screen === "setup" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mb-2">
              <Mic className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Mock Interview Practice
            </h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Simulate high-stakes campus technical & behavioral interviews with live speech-to-text, pacing analysis, and STAR compliance scoring.
            </p>
          </div>

          <Card className="p-6 sm:p-8 space-y-6 shadow-md border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Target Interview Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        difficulty === lvl
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Questions to Practice
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        questionCount === cnt
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {cnt} Questions
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3 text-xs text-slate-600">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">
                  AI Multi-Factor Evaluation Engine
                </p>
                <p className="mt-0.5">
                  During this drill, the system evaluates your response for verbal clarity, speech pace (target 125-150 WPM), STAR structure completion, and technical keyword accuracy.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full py-3"
              icon={Play}
              onClick={handleStartInterview}
            >
              Launch Interview Session
            </Button>
          </Card>
        </div>
      )}

      {/* 2. ACTIVE SESSION SCREEN */}
      {screen === "session" && questions.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="md">
                Question {currentQIndex + 1} of {questions.length}
              </Badge>
              <span className="text-xs text-slate-500 font-medium">
                {selectedRole} • {difficulty}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 text-white font-mono text-sm font-semibold">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>{formatTimer(timerSeconds)}</span>
            </div>
          </div>

          {/* Question Card */}
          <Card className="p-6 sm:p-8 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 text-white shadow-xl">
            <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-300">
              {questions[currentQIndex]?.category} Interview Question
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-2 leading-snug">
              "{questions[currentQIndex]?.question}"
            </h2>

            {questions[currentQIndex]?.tips && (
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-indigo-200">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Tip: {questions[currentQIndex].tips}</span>
              </div>
            )}
          </Card>

          {/* Recording & Audio Simulation Interface */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isRecording
                      ? "bg-rose-500 text-white animate-pulse shadow-rose-200"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
                  }`}
                >
                  {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {isRecording ? "Listening to Speech..." : "Microphone Idle"}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isRecording
                      ? "Speak clearly into your mic. Click button when finished."
                      : "Click the mic button to start recording your response."}
                  </p>
                </div>
              </div>

              {/* Animated Waveform mock when recording */}
              {isRecording && (
                <div className="flex items-center gap-1 h-8 px-4 py-2 rounded-xl bg-rose-50 border border-rose-100">
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-4" />
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-7" />
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-3" />
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-8" />
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-5" />
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-2" />
                  <span className="text-xs text-rose-700 font-bold ml-2">REC</span>
                </div>
              )}
            </div>

            {/* Live Transcript / Answer Box */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Real-Time Answer Transcript (Spoken or Typed)
              </label>
              <textarea
                rows={5}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Spoken words will automatically transcribe here. You may also edit or type your answer directly..."
                className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("Are you sure you want to end this interview session?")) {
                    setScreen("setup");
                  }
                }}
              >
                Quit Session
              </Button>

              <Button
                variant="primary"
                size="md"
                icon={ArrowRight}
                iconPosition="right"
                onClick={handleNextQuestion}
              >
                {currentQIndex + 1 < questions.length
                  ? "Next Question"
                  : "Finish & Generate AI Report"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 3. EVALUATING LOADING STATE */}
      {screen === "evaluating" && (
        <div className="max-w-md mx-auto p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm animate-pulse">
            <Sparkles className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Synthesizing Interview Performance
          </h3>
          <p className="text-xs text-slate-500">
            Analyzing audio pacing, speech cadence, STAR compliance, and keyword density...
          </p>
        </div>
      )}

      {/* 4. COMPREHENSIVE REPORT SCREEN */}
      {screen === "report" && report && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                <Award className="w-8 h-8 text-indigo-600" />
                AI Mock Interview Performance Report
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Completed on {report.date} for <span className="font-semibold text-slate-800">{report.role}</span>
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={RotateCcw}
              onClick={() => setScreen("setup")}
            >
              Practice Another Drill
            </Button>
          </div>

          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-200 text-center p-4">
              <p className="text-xs text-indigo-900 font-bold uppercase">Overall Score</p>
              <h4 className="text-3xl font-extrabold text-indigo-600 mt-1">
                {report.overallScore}/100
              </h4>
              <span className="text-[10px] text-emerald-600 font-semibold">Tier-1 Ready</span>
            </Card>

            <Card className="text-center p-4">
              <p className="text-xs text-slate-500 font-medium">Clarity</p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">
                {report.metrics.communicationClarity}%
              </h4>
              <span className="text-[10px] text-emerald-600 font-semibold">Crisp & Fluent</span>
            </Card>

            <Card className="text-center p-4">
              <p className="text-xs text-slate-500 font-medium">Speech Pace</p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">
                {report.metrics.speechPaceWpm} WPM
              </h4>
              <span className="text-[10px] text-emerald-600 font-semibold">Optimal Range</span>
            </Card>

            <Card className="text-center p-4">
              <p className="text-xs text-slate-500 font-medium">Confidence</p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">
                {report.metrics.confidenceScore}%
              </h4>
              <span className="text-[10px] text-slate-500">3 Filler Words</span>
            </Card>

            <Card className="text-center p-4">
              <p className="text-xs text-slate-500 font-medium">Sentiment</p>
              <h4 className="text-lg font-bold text-slate-900 mt-1 truncate">
                Positive
              </h4>
              <span className="text-[10px] text-purple-600 font-semibold">Collaborative</span>
            </Card>

            <Card className="text-center p-4">
              <p className="text-xs text-slate-500 font-medium">STAR Score</p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">
                {report.metrics.starCompliance}%
              </h4>
              <span className="text-[10px] text-amber-600 font-semibold">Improve Result</span>
            </Card>
          </div>

          {/* AI Diagnostic Summary */}
          <Card>
            <CardHeader
              title="Executive Diagnostic Summary"
              subtitle="Holistic review based on campus interviewer expectations"
            />
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {report.summary}
            </p>
          </Card>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-emerald-200 bg-emerald-50/20">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Key Strengths Noted</h3>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                {report.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="border-amber-200 bg-amber-50/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">Recommended Improvements</h3>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                {report.improvements.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Question-by-Question Breakdown */}
          <Card>
            <CardHeader
              title="Question-by-Question Diagnostic"
              subtitle="Individual scores and specific coaching suggestions"
            />
            <div className="space-y-4">
              {report.questionBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      Q{idx + 1}: {item.question}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">
                        Score: {item.score}/100
                      </Badge>
                      <Badge variant="purple" size="sm">
                        STAR: {item.starScore}%
                      </Badge>
                      <span className="text-xs text-slate-500 font-medium">
                        {item.wpm} WPM
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{item.feedback}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
