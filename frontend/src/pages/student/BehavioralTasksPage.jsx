import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Flame,
  Award,
  Clock,
  Lock,
  CheckCircle2,
  Mic,
  Send,
  Zap
} from "lucide-react";
import { taskService } from "../../services/taskService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { ProgressBar } from "../../components/common/ProgressBar";
import { useNotifications } from "../../context/NotificationContext";

export function BehavioralTasksPage() {
  const { addToast } = useNotifications();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissionText, setSubmissionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await taskService.getTasksData();
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-center text-slate-400">Loading daily tasks...</div>;
  }

  const { state, tasks, calendar } = data;
  const todayTask = tasks.find((t) => t.id === "task_today");

  const handleComplete = async () => {
    if (!submissionText.trim()) {
      addToast("Please provide your verbal pitch notes or transcript.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const { updatedState, updatedTasks } = await taskService.completeDailyTask("task_today", {
        text: submissionText,
        submittedAt: new Date().toLocaleTimeString()
      });
      setData((prev) => ({ ...prev, state: updatedState, tasks: updatedTasks }));
      addToast(`🎉 Challenge Complete! +150 XP Earned! Streak updated to ${updatedState.streakDays} days!`, "success");
      setSubmissionText("");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Gamification Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-8 h-8 text-indigo-600" />
            Daily Behavioral Micro-Challenges
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Build fluent communication, behavioral poise, and elevator pitch readiness 5 minutes a day.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500 animate-pulse" />
            <span className="font-extrabold text-sm">{state.streakDays} Day Streak!</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900">
            <Zap className="w-5 h-5 fill-purple-600 text-purple-600" />
            <span className="font-extrabold text-sm">{state.totalXp} XP</span>
          </div>
        </div>
      </div>

      {/* Gamification Level Status & Weekly Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Level Card */}
        <Card className="flex flex-col justify-between bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 text-white shadow-lg">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs uppercase tracking-widest font-bold text-indigo-300">
                Current Rank
              </span>
              <Badge variant="purple" size="sm" className="bg-purple-500/20 text-purple-200 border-purple-400/30">
                Tier 4
              </Badge>
            </div>
            <h3 className="text-2xl font-black">{state.level}</h3>
            <p className="text-xs text-indigo-200 mt-1">
              Earn 250 more XP to unlock "Senior Career Tactician"
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <ProgressBar
              value={state.totalXp}
              max={state.nextLevelXp}
              label="Progress to Level 5"
              variant="emerald"
              size="sm"
            />
          </div>
        </Card>

        {/* Weekly Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Weekly Consistency Tracker"
            subtitle="Practice every day to maintain your institutional placement momentum"
          />
          <div className="grid grid-cols-7 gap-2 text-center">
            {calendar.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex flex-col items-center justify-between gap-2 transition-all ${
                  item.status === "completed"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : item.status === "active"
                    ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-900 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
              >
                <span className="text-xs font-semibold">{item.day}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-white shadow-2xs">
                  {item.status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : item.status === "active" ? (
                    <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-300" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500">{item.date}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Today's Active Task Workspace */}
      {todayTask && (
        <Card className="border-indigo-200 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Today's Active Task
                </span>
                <Badge
                  variant={todayTask.status === "completed" ? "success" : "primary"}
                  size="sm"
                >
                  {todayTask.status === "completed" ? "Completed" : "In Progress"}
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {todayTask.title}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                Reward: <strong className="text-purple-600 font-bold">+{todayTask.xpReward} XP</strong>
              </span>
              <Badge variant="neutral" size="sm">
                Difficulty: {todayTask.difficulty}
              </Badge>
            </div>
          </div>

          <div className="py-4 space-y-4">
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {todayTask.description}
            </p>

            {todayTask.instructions && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-700">
                <p className="font-bold text-slate-900 mb-1">Coaching Checklist:</p>
                {todayTask.instructions.map((ins, i) => (
                  <p key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{ins}</span>
                  </p>
                ))}
              </div>
            )}

            {todayTask.status !== "completed" ? (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Your Pitch Transcript or Response Notes
                </label>
                <textarea
                  rows={4}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Draft your 60-second pitch or paste audio transcript here..."
                  className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Mic}
                    onClick={() =>
                      setSubmissionText(
                        todayTask.sampleScript ||
                          "Hi, I'm Khushi Sharma. I'm a final-year CS engineer specializing in distributed systems and cloud backends..."
                      )
                    }
                  >
                    Simulate Audio Recording
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    icon={Send}
                    loading={submitting}
                    onClick={handleComplete}
                  >
                    Submit & Claim +150 XP
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">Completed Today! (Score: 92/100)</p>
                    <p className="text-[11px] text-emerald-600">Great pacing and concise hook.</p>
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  +150 XP Claimed
                </Badge>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Past & Upcoming Challenges */}
      <Card>
        <CardHeader
          title="Challenge Library & Upcoming Tasks"
          subtitle="Review previous scores and unlock higher difficulty rounds"
        />
        <div className="space-y-3">
          {tasks
            .filter((t) => t.id !== "task_today")
            .map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      task.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {task.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                    {task.unlockRequirement && (
                      <span className="text-[10px] font-semibold text-amber-600 mt-1 block">
                        🔒 {task.unlockRequirement}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    variant={task.status === "completed" ? "success" : "neutral"}
                    size="sm"
                  >
                    {task.status === "completed"
                      ? `Score: ${task.userScore}/100`
                      : `+${task.xpReward} XP`}
                  </Badge>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Achievement Badges Showcase */}
      <Card>
        <CardHeader
          title="Placement Achievement Showcase"
          subtitle="Badges unlocked by consistent behavioral and interview practice"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {state.badges.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white text-center flex flex-col items-center justify-center shadow-2xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 shadow-xs">
                <Award className="w-6 h-6" />
              </div>
              <h5 className="font-bold text-slate-900 text-xs sm:text-sm">{b.title}</h5>
              <p className="text-[11px] text-slate-500 mt-1">{b.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
