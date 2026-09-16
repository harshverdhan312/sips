import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Target,
  FileText,
  Mic,
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  Flame
} from "lucide-react";
import { studentService } from "../../services/studentService";
import { taskService } from "../../services/taskService";
import { placementService } from "../../services/placementService";
import { StatCard } from "../../components/common/StatCard";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { ProgressBar } from "../../components/common/ProgressBar";
import { ProbabilityGauge } from "../../components/charts/ProbabilityGauge";
import { RadarSkillChart } from "../../components/charts/RadarSkillChart";
import { DashboardSkeleton } from "../../components/common/LoadingSkeleton";

export function StudentDashboard() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [radarData, setRadarData] = useState([]);
  const [tasksData, setTasksData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [studentData, radar, tasks, jobList] = await Promise.all([
          studentService.getCurrentStudent(),
          studentService.getRadarData(),
          taskService.getTasksData(),
          studentService.getStudentJobs()
        ]);
        setStudent(studentData);
        setRadarData(radar);
        setTasksData(tasks);
        setJobs(jobList.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !student) {
    return <DashboardSkeleton />;
  }

  const { metrics } = student;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              AI Placement Intelligence Active
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Good morning, {student.name.split(" ")[0]} 👋
            </h1>
            <p className="text-sm sm:text-base text-indigo-200 max-w-xl">
              Here is your holistic placement readiness overview. Your profile is in the top 12% of the 2025 engineering batch.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="md"
              icon={FileText}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 shadow-none"
              onClick={() => navigate("/student/resume")}
            >
              Analyze Resume
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Play}
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-900/40"
              onClick={() => navigate("/student/interview")}
            >
              Start AI Mock Drill
            </Button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 -bottom-10 w-96 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
      </div>

      {/* Main 6 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Employability Index"
          value={`${metrics.employabilityIndex}/100`}
          trend={{ value: "+3 pts", direction: "up", label: "this mo" }}
          icon={TrendingUp}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Placement Prob."
          value={`${metrics.placementProbability}%`}
          trend={{ value: "+4%", direction: "up", label: "vs batch" }}
          icon={Target}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Technical Score"
          value={metrics.technicalScore}
          subtitle="Top 15% in CSE"
          icon={Sparkles}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Soft Skill Index"
          value={metrics.softSkillScore}
          subtitle="Speech pace: 136 WPM"
          icon={Mic}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Resume Score"
          value={`${metrics.resumeScore}/100`}
          subtitle="ATS Verified"
          icon={FileText}
          iconBg="bg-sky-50 text-sky-600"
        />
        <StatCard
          title="Interview Ready"
          value={`${metrics.interviewReadiness}%`}
          trend={{ value: "+5%", direction: "up" }}
          icon={Award}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* 2-Column Row: Placement Probability Gauge & Radar Skill Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Placement Probability Breakdown Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader
            title="Placement Probability"
            subtitle="Calculated across 40+ industry recruitment criteria"
            action={
              <Badge variant="success" size="sm">
                High Target Fit
              </Badge>
            }
          />
          <div className="py-2">
            <ProbabilityGauge probability={metrics.placementProbability} />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-500">Tier-1 SDE Drives (Google / Microsoft):</span>
              <span className="font-semibold text-slate-800">86% Fit</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-500">FinTech & Quantitative Roles:</span>
              <span className="font-semibold text-slate-800">82% Fit</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-500">Mass / IT Services:</span>
              <span className="font-semibold text-slate-800">98% Fit</span>
            </div>
          </div>
        </Card>

        {/* Radar Skill Intelligence */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Skill Intelligence Benchmark"
            subtitle="Your current proficiency evaluated against Tier-1 campus benchmarks"
            action={
              <Button
                variant="ghost"
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => navigate("/student/skills")}
              >
                Detailed Gap Analysis
              </Button>
            }
          />
          <RadarSkillChart data={radarData} height={280} />
        </Card>
      </div>

      {/* Skill Strengths vs Gaps Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Skills */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Your Strongest Proficiencies
              </h3>
              <p className="text-xs text-slate-500">Exceeds campus hiring standards</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800">Python & Problem Solving</span>
                <span className="text-emerald-600 font-bold">88% (Benchmark 85%)</span>
              </div>
              <ProgressBar value={88} variant="emerald" size="sm" showPercentage={false} />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800">React.js & Web Architecture</span>
                <span className="text-emerald-600 font-bold">85% (Benchmark 80%)</span>
              </div>
              <ProgressBar value={85} variant="emerald" size="sm" showPercentage={false} />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800">JavaScript ES6+ & Async Concurrency</span>
                <span className="text-emerald-600 font-bold">82% (Benchmark 85%)</span>
              </div>
              <ProgressBar value={82} variant="emerald" size="sm" showPercentage={false} />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800">Git Collaboration & Rebase Workflows</span>
                <span className="text-emerald-600 font-bold">90% (Benchmark 80%)</span>
              </div>
              <ProgressBar value={90} variant="emerald" size="sm" showPercentage={false} />
            </div>
          </div>
        </Card>

        {/* Needs Improvement */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Skills Requiring Immediate Focus
              </h3>
              <p className="text-xs text-slate-500">Identified in 70%+ of target JDs</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800">Docker & Containerization</span>
                <span className="text-rose-600 font-bold">55% (Gap: 20%)</span>
              </div>
              <ProgressBar value={55} variant="rose" size="sm" showPercentage={false} />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800">AWS Cloud Services (S3, Lambda)</span>
                <span className="text-rose-600 font-bold">50% (Gap: 20%)</span>
              </div>
              <ProgressBar value={50} variant="rose" size="sm" showPercentage={false} />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800">System Design & Sharding Patterns</span>
                <span className="text-amber-600 font-bold">58% (Gap: 22%)</span>
              </div>
              <ProgressBar value={58} variant="amber" size="sm" showPercentage={false} />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-800">SQL Window Functions & Indexing</span>
                <span className="text-amber-600 font-bold">72% (Gap: 13%)</span>
              </div>
              <ProgressBar value={72} variant="amber" size="sm" showPercentage={false} />
            </div>
          </div>
        </Card>
      </div>

      {/* Gamified Daily Task & Recommended Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Behavioral Task */}
        {tasksData && (
          <Card className="bg-gradient-to-br from-indigo-50/70 to-white border-indigo-200/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {tasksData.state.streakDays}-Day Streak!
              </div>
              <Badge variant="purple" size="sm">
                +{tasksData.tasks[0]?.xpReward || 150} XP
              </Badge>
            </div>

            <h3 className="font-bold text-slate-900 text-base leading-snug">
              Today's Challenge: {tasksData.tasks[0]?.title}
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 line-clamp-3">
              {tasksData.tasks[0]?.description}
            </p>

            <div className="mt-5 pt-4 border-t border-indigo-100 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Difficulty: {tasksData.tasks[0]?.difficulty}
              </span>
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                onClick={() => navigate("/student/tasks")}
              >
                Complete Task
              </Button>
            </div>
          </Card>
        )}

        {/* Recommended Actions */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="AI Recommended Placement Actions"
            subtitle="Prioritized steps to boost your Employability Index from 78 to 85+"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/student/recommendations")}
              >
                View All
              </Button>
            }
          />

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-4 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                  01
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                    Complete Docker Containerization Lab
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Directly addresses 20% gap in Microsoft SDE requirements
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() => navigate("/student/skills")}
              >
                Start Lab
              </Button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-4 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                  02
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                    Practice STAR Behavioral Story: Tight Deadlines
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Boost behavioral score by adding quantifiable result metrics
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() => navigate("/student/star")}
              >
                Open STAR
              </Button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-4 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                  03
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                    Schedule Peer Mock Drill with Rohan Deshmukh
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    94% match for Go & backend system design mock practice
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() => navigate("/student/peers")}
              >
                Connect
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Upcoming Placement Drives & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Campus Drives */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Upcoming Placement Opportunities</h3>
              <p className="text-xs text-slate-500">Campus recruitment drives matching your academic and skill criteria</p>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => navigate("/student/jobs")}
            >
              View All Drives
            </Button>
          </div>
          <div className="p-6 pt-2 space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-base shrink-0">
                    {job.company.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{job.company}</h4>
                      <Badge
                        variant={
                          job.matchScore >= 80
                            ? "success"
                            : job.matchScore >= 60
                            ? "primary"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {job.matchScore}% Match
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{job.role}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                      <span className="font-semibold text-emerald-600">{job.ctc}</span>
                      <span>•</span>
                      <span>Min CGPA: {job.minCgpa}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5" /> Deadline: {job.deadline}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/student/jobs")}
                >
                  Explore Drive
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader title="Recent Activity" subtitle="Your latest platform interactions" />
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-800">Resume Parsed via ATS</p>
                <p className="text-slate-500">Score increased from 82 to 88</p>
                <span className="text-[10px] text-slate-400">Today, 10:15 AM</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-800">Full-Stack AI Mock Drill Completed</p>
                <p className="text-slate-500">Scored 82/100, Speech pace 136 WPM</p>
                <span className="text-[10px] text-slate-400">Yesterday, 3:45 PM</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-800">STAR Story Drafted & Evaluated</p>
                <p className="text-slate-500">Rated 88/100 for Quantifiable Impact</p>
                <span className="text-[10px] text-slate-400">2 days ago</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-semibold text-slate-800">Completed 7-Day Behavioral Streak</p>
                <p className="text-slate-500">Earned '7-Day Streak' badge & 150 XP</p>
                <span className="text-[10px] text-slate-400">3 days ago</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
