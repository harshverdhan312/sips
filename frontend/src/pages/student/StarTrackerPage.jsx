import React, { useState } from "react";
import {
  Award,
  Sparkles,
  CheckCircle2,
  Save
} from "lucide-react";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { ProgressBar } from "../../components/common/ProgressBar";
import { useNotifications } from "../../context/NotificationContext";

export function StarTrackerPage() {
  const { addToast } = useNotifications();

  const samplePrompts = [
    "Tell me about a high-pressure situation where a production bug broke before a deadline.",
    "Describe a project where you had to persuade team members who disagreed with your architecture.",
    "Tell me about a time you had to quickly learn an unfamiliar technology stack to deliver a milestone."
  ];

  const [selectedPrompt, setSelectedPrompt] = useState(samplePrompts[0]);
  const [situation, setSituation] = useState(
    "During the final sprint of our distributed task queue project, our Redis broker crashed repeatedly under 3,000 simulated concurrent worker connections, jeopardizing our capstone submission in 48 hours."
  );
  const [task, setTask] = useState(
    "As the backend lead, I was responsible for diagnosing the memory leak, stabilizing connection pooling, and ensuring zero task drop before the final demo."
  );
  const [action, setAction] = useState(
    "I profiled Redis memory allocations and identified unclosed connection leaks in the worker heartbeat loops. I re-architected the connection pool using a singleton pattern, implemented exponential backoff retries with jitter, and wrote unit tests simulating spike traffic."
  );
  const [result, setResult] = useState(
    "We successfully demonstrated the system handling 5,000+ continuous workers with 99.9% uptime. Query latency dropped by 45%, and the project was awarded Top Capstone Project in the department."
  );

  const [evaluating, setEvaluating] = useState(false);
  const [starScore, setStarScore] = useState(88);
  const [feedback, setFeedback] = useState({
    situation: "Strong, concise context with explicit stakes and time pressure.",
    task: "Clear ownership definition; clearly demarcates your role from general team scope.",
    action: "Excellent specific technical verbs ('profiled', 're-architected', 'implemented backoff').",
    result: "Outstanding quantifiable metrics (5,000+ workers, 45% latency reduction, Top Capstone)."
  });

  const filledCount = [situation, task, action, result].filter((s) => s.trim().length > 15).length;
  const completionPercentage = (filledCount / 4) * 100;

  const handleEvaluate = () => {
    setEvaluating(true);
    setTimeout(() => {
      setEvaluating(false);
      setStarScore(91);
      setFeedback({
        situation: "Very strong situation setup. The 48-hour deadline stakes immediately grab the interviewer's attention.",
        task: "Clearly sets your individual responsibility apart from the group.",
        action: "Action is detailed and technical. Demonstrates engineering depth and problem-solving maturity.",
        result: "Excellent quantifiable impact. Recruiters love seeing concrete percentage improvements and capacity numbers."
      });
      addToast("STAR Story evaluated! Overall STAR Score: 91/100", "success");
    }, 800);
  };

  const handleSave = () => {
    addToast("STAR Story saved to your interview prep library!", "success");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-8 h-8 text-indigo-600" />
            STAR Method Behavioral Story Builder
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Structure your real-world engineering experiences into the proven Situation-Task-Action-Result format.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={Save} onClick={handleSave}>
            Save Story
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Sparkles}
            loading={evaluating}
            onClick={handleEvaluate}
          >
            Evaluate with AI
          </Button>
        </div>
      </div>

      {/* Select Prompt & Progress Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Interview Behavioral Prompt"
            subtitle="Choose a common campus behavioral question to structure"
          />
          <div className="space-y-2">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedPrompt(p)}
                className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  selectedPrompt === p
                    ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                "{p}"
              </button>
            ))}
          </div>
        </Card>

        {/* Score & Progress */}
        <Card className="flex flex-col justify-between">
          <CardHeader title="STAR Quality Score" subtitle="AI structure compliance" />
          <div className="py-2 text-center">
            <div className="inline-flex items-baseline gap-1 text-5xl font-black text-indigo-600">
              {starScore}<span className="text-xl text-slate-400 font-semibold">/100</span>
            </div>
            <p className="text-xs font-semibold text-emerald-600 mt-1">
              Recruiter-Ready Narrative
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <ProgressBar
              value={completionPercentage}
              label={`Sections Structured (${filledCount}/4)`}
              variant="emerald"
              size="sm"
            />
          </div>
        </Card>
      </div>

      {/* 4 Interactive S-T-A-R Sections */}
      <div className="space-y-4">
        {/* Situation */}
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600">
                S — Situation (15-20% of response)
              </span>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Set the Context and High Stakes
              </h3>
              <p className="text-xs text-slate-500">
                What was the setting? What problem, project, or crisis were you facing?
              </p>
            </div>
            <Badge variant="blue" size="sm">
              Context
            </Badge>
          </div>

          <textarea
            rows={3}
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 mt-2"
          />

          {feedback.situation && (
            <div className="mt-2 text-xs flex items-start gap-1.5 text-slate-600 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>{feedback.situation}</span>
            </div>
          )}
        </Card>

        {/* Task */}
        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-purple-600">
                T — Task (10-15% of response)
              </span>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Define Your Specific Responsibility
              </h3>
              <p className="text-xs text-slate-500">
                What was your individual duty? What needed to be achieved to solve the situation?
              </p>
            </div>
            <Badge variant="purple" size="sm">
              Role
            </Badge>
          </div>

          <textarea
            rows={3}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 mt-2"
          />

          {feedback.task && (
            <div className="mt-2 text-xs flex items-start gap-1.5 text-slate-600 bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
              <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>{feedback.task}</span>
            </div>
          )}
        </Card>

        {/* Action */}
        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-600">
                A — Action (50-60% of response)
              </span>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Concrete Actions You Personally Took
              </h3>
              <p className="text-xs text-slate-500">
                Avoid generic "we did"; emphasize tools, code optimizations, architecture decisions, and steps.
              </p>
            </div>
            <Badge variant="warning" size="sm">
              Core Execution
            </Badge>
          </div>

          <textarea
            rows={4}
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 mt-2"
          />

          {feedback.action && (
            <div className="mt-2 text-xs flex items-start gap-1.5 text-slate-600 bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{feedback.action}</span>
            </div>
          )}
        </Card>

        {/* Result */}
        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-600">
                R — Result (15-20% of response)
              </span>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Quantifiable Impact & Lessons Learned
              </h3>
              <p className="text-xs text-slate-500">
                Include percentage drops, throughput numbers, awards, or direct business outcomes.
              </p>
            </div>
            <Badge variant="success" size="sm">
              Impact
            </Badge>
          </div>

          <textarea
            rows={3}
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 mt-2"
          />

          {feedback.result && (
            <div className="mt-2 text-xs flex items-start gap-1.5 text-slate-600 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{feedback.result}</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
