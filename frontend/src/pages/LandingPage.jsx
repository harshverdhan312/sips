import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Award,
  GitFork,
  Sliders,
  Cpu,
  Users,
  Building2,
  GraduationCap,
  Target,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Layers,
  ChevronRight,
  Database,
  Search,
  Activity,
  Calendar,
  Lock,
  Compass,
  Mail,
  Phone,
  User
} from "lucide-react";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";

export function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("telemetry");
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoForm, setDemoForm] = useState({
    name: "",
    collegeName: "",
    designation: "TPO",
    email: "",
    phone: "",
    studentsCount: "1000-2500"
  });

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    setDemoSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* ------------------------------------------------------------- */}
      {/* Sovereign Top Navigation Bar                                  */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/branding/sips-logo-compact.png"
              alt="SIPS - Skill Intelligence Placement System"
              className="h-9 w-auto max-w-[170px] sm:max-w-[200px] object-contain cursor-pointer"
              onClick={() => navigate("/")}
            />
            <span className="hidden sm:inline-flex text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              v4.8.2 Synced
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#problem" className="hover:text-indigo-600 transition-colors">Problem Diagnostic</a>
            <a href="#pipeline" className="hover:text-indigo-600 transition-colors">5-Stage Pipeline</a>
            <a href="#loop" className="hover:text-indigo-600 transition-colors">Continuous Intelligence</a>
            <a href="#portals" className="hover:text-indigo-600 transition-colors">Stakeholder Portals</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-bold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Button
              variant="primary"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => setDemoModalOpen(true)}
              className="bg-[#4338ca] hover:bg-[#2a14b4] shadow-sm text-xs font-bold"
            >
              Request Institutional Pilot
            </Button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION: Product-Led Telemetry Hero                      */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-200/60 bg-gradient-to-b from-white to-[#f8f9ff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Vision & CTA */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-[#4338ca] border border-indigo-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Institutional Day-0 Predictive Engine
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Eliminating <span className="text-[#ba1a1a] underline decoration-[#ffdad6] decoration-4">Data Blindness</span> in Campus Placements.
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Higher-ed placement cells traditionally operate as reactive logistics hubs. SIPS converts scattered LeetCode, GitHub, and academic records into continuous, predictive rubrics aligned to Tier-1 enterprise standards.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => setDemoModalOpen(true)}
                  className="bg-[#4338ca] hover:bg-[#2a14b4] font-bold shadow-md shadow-indigo-200"
                >
                  Schedule Campus Briefing
                </Button>
                <Link
                  to="/login?tab=student"
                  className="px-5 py-3 rounded-lg border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
                >
                  Student Portal Login
                </Link>
              </div>

              {/* Authority Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80">
                <div>
                  <p className="text-2xl font-black font-mono text-slate-900">74.2%</p>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Cohort Employability</p>
                </div>
                <div>
                  <p className="text-2xl font-black font-mono text-emerald-700">624</p>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Tier-1 Cleared</p>
                </div>
                <div>
                  <p className="text-2xl font-black font-mono text-[#ba1a1a]">186</p>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">Triaged in Sprints</p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Abstract Telemetry Widget */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/40 p-6 relative">
                {/* Header Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono font-bold text-slate-500 ml-2">
                      SIPS_TELEMETRY // Candidate_4029_Vance
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    REALTIME_STREAM
                  </span>
                </div>

                {/* Main Telemetry Readout */}
                <div className="py-5 space-y-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Real-time Placement Readiness Index
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl sm:text-5xl font-black font-mono text-[#4338ca]">
                          82.4
                        </span>
                        <span className="text-sm font-bold text-slate-400 font-mono">/ 100</span>
                        <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded ml-2">
                          +6.8pt in 14d
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Verified Skills Coverage
                      </p>
                      <p className="text-2xl font-black font-mono text-slate-900 mt-1">
                        18 <span className="text-sm font-semibold text-slate-400">/ 22</span>
                      </p>
                    </div>
                  </div>

                  {/* Progress Matrix Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold font-mono text-slate-600">
                      <span>RUBRIC CONVERGENCE</span>
                      <span className="text-emerald-700">DAY-0 QUALIFIED</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1 p-0.5 border border-slate-200">
                      <div className="h-full bg-[#4338ca] rounded-full" style={{ width: "45%" }} title="DSA / Core Systems" />
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: "25%" }} title="System Design" />
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: "15%" }} title="STAR Behavioral" />
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: "10%" }} title="CS Fundamentals" />
                    </div>
                  </div>

                  {/* Target Company Matrix Readout */}
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Microsoft</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-700">88% Match</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Core Systems SDE</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">AWS Cloud</span>
                        <span className="text-[10px] font-mono font-bold text-indigo-700">76% Match</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Distributed Architect</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Goldman Sachs</span>
                        <span className="text-[10px] font-mono font-bold text-amber-700">62% Match</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Quant Tech Division</p>
                    </div>
                  </div>

                  {/* Proctored Audio-Visual AI Telemetry */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <Activity className="w-4 h-4 text-[#4338ca]" />
                      <span className="font-semibold text-slate-800">
                        AI Mock Interview Telemetry:
                      </span>
                      <span className="font-mono text-slate-600">138 WPM (Optimal) • 1.2% Fillers</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-indigo-700 border border-indigo-200">
                      STAR Adherent
                    </span>
                  </div>
                </div>

                {/* Footer Status */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>LATENCY: 18ms</span>
                  <span>SYNC_FREQ: 60s PROCTORED</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION: Problem Diagnostic (Asymmetrical Comparative Matrix) */}
      {/* ------------------------------------------------------------- */}
      <section id="problem" className="py-16 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 font-mono">
              Diagnostic Analysis
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Why Traditional Campus Placement Models Fail on Day-0
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Spreadsheet tracking and monolithic training create silent operational deficits that become visible only after recruiters leave the campus.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: 3 Institutional Failure Modes */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-5 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      DEFICIT 01
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Fragmented Candidate Data</h3>
                  </div>
                  <Database className="w-4 h-4 text-rose-500" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  LeetCode stats, GitHub code commits, academic CGPA, and soft-skill reports reside in unlinked silos with zero cross-correlation.
                </p>
                <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200/60">
                  Impact: Placement officers cannot forecast Day-0 shortlist conversion.
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      DEFICIT 02
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Uncalibrated Readiness Illusion</h3>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Students pass standard exams without knowing if their algorithmic complexity or STAR behavioral pacing meets marquee enterprise bars.
                </p>
                <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200/60">
                  Impact: High candidate confidence followed by sudden first-round elimination.
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      DEFICIT 03
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">Monolithic Mass Training</h3>
                  </div>
                  <Layers className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Colleges deliver uniform 200-hour lecture bootcamps to 1,000+ candidates instead of targeting isolated gaps per student.
                </p>
                <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200/60">
                  Impact: Substantial institutional training spend with stagnant median CTCs.
                </div>
              </div>
            </div>

            {/* Right Column: SIPS Closed-Loop Resolution Architecture */}
            <div className="lg:col-span-6 p-6 rounded-xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white border border-indigo-900/60 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-indigo-800/60 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 font-bold">
                    SIPS SYSTEM ARCHITECTURE
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">Continuous Telemetry Engine</h3>
                </div>
                <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ZERO BLINDNESS
                </span>
              </div>

              <div className="space-y-4 text-xs text-indigo-100/90">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-800/50 px-2 py-0.5 rounded border border-indigo-700 shrink-0">
                    01
                  </span>
                  <div>
                    <h4 className="font-bold text-white">Unified Telemetry Ingestion</h4>
                    <p className="text-[11px] text-indigo-200/80 mt-0.5">Real-time sync from LeetCode, GitHub, coding arenas, and proctored AI voice rubrics.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-800/50 px-2 py-0.5 rounded border border-indigo-700 shrink-0">
                    02
                  </span>
                  <div>
                    <h4 className="font-bold text-white">Enterprise Weighted Rubrics</h4>
                    <p className="text-[11px] text-indigo-200/80 mt-0.5">Automated 0-100 compatibility scores calibrated against specific company hiring parameters.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-800/50 px-2 py-0.5 rounded border border-indigo-700 shrink-0">
                    03
                  </span>
                  <div>
                    <h4 className="font-bold text-white">10-Day Targeted Remediation</h4>
                    <p className="text-[11px] text-indigo-200/80 mt-0.5">Precision micro-sprints triggered specifically for candidates failing core technical sub-competencies.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-indigo-800/60 flex items-center justify-between text-[11px] font-mono text-indigo-300">
                <span>CONVERSION LIFT: +34% DAY-0</span>
                <span>STATUS: PRODUCTION READY</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION: 5-Stage Pipeline (PRD 3.1)                           */}
      {/* ------------------------------------------------------------- */}
      <section id="pipeline" className="py-16 bg-[#f8f9ff] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 font-mono">
              End-to-End Methodology
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              The 5-Stage Continuous Placement Pipeline
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              A structured diagnostic journey turning campus preparation into a rigorous data science workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: "01",
                title: "Profile Ingestion",
                desc: "Unified synthesis of GitHub, LeetCode, HackerRank, CGPA, and resume data.",
                icon: FileCode
              },
              {
                step: "02",
                title: "Skill Intelligence",
                desc: "Multi-dimensional ontology mapping 22+ enterprise technical competencies.",
                icon: Target
              },
              {
                step: "03",
                title: "Readiness Analysis",
                desc: "Real-time 0-100 indexing calibrated against tier-1 enterprise rubrics.",
                icon: BarChart3
              },
              {
                step: "04",
                title: "Opportunity Match",
                desc: "Weighted algorithm matching students to marquee hiring requisitions.",
                icon: GitFork
              },
              {
                step: "05",
                title: "Targeted Growth",
                desc: "1-click 10-day remediation sprints closing identified individual gaps.",
                icon: TrendingUp
              }
            ].map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.step}
                  className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-black text-[#4338ca] bg-indigo-50 px-2 py-0.5 rounded">
                        STAGE {stage.step}
                      </span>
                      <Icon className="w-5 h-5 text-slate-400" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1.5">
                      {stage.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {stage.desc}
                    </p>
                  </div>
                  {idx < 4 && (
                    <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <ChevronRight className="w-5 h-5 text-indigo-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION: Continuous Intelligence Loop (PRD 3.1)               */}
      {/* ------------------------------------------------------------- */}
      <section id="loop" className="py-16 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Predictive Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                The Continuous Intelligence Loop
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Rather than evaluating candidates on the day recruiters arrive, SIPS enforces a closed-loop system:
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { phase: "Measure", desc: "Automated telemetry ingests coding velocities and audio-visual mock metrics.", color: "text-[#4338ca]" },
                  { phase: "Understand", desc: "Maps strengths and deficits against specific company rubric weights.", color: "text-indigo-600" },
                  { phase: "Intervene", desc: "Triggers targeted 10-day bootcamps and faculty mentor rebalancing.", color: "text-amber-600" },
                  { phase: "Improve", desc: "Validates score conversion and Day-0 offer clearance rates.", color: "text-emerald-600" }
                ].map((item, i) => (
                  <div key={item.phase} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className={`text-xs font-mono font-black ${item.color} px-2 py-0.5 bg-white rounded border border-slate-200`}>
                      0{i + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.phase}</h4>
                      <p className="text-[11px] text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Circular Representation */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full border-2 border-dashed border-indigo-200 flex items-center justify-center p-8 bg-[#f8f9ff]">
                
                {/* Center Core */}
                <div className="w-36 h-36 rounded-full bg-white border border-indigo-200 shadow-lg shadow-indigo-100 flex flex-col items-center justify-center text-center p-3">
                  <img
                    src="/branding/sips-mark.png"
                    alt="SIPS Mark"
                    className="w-7 h-7 object-contain"
                  />
                  <span className="font-extrabold text-slate-900 text-xs mt-1">SIPS Engine</span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">68.2% Day-0 Yield</span>
                </div>

                {/* Orbit Nodes */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-xs text-xs font-bold text-[#4338ca] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> 1. Measure
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-xs text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> 2. Understand
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-xs text-xs font-bold text-amber-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> 3. Intervene
                </div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> 4. Improve
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION: Audience-Specific Portals (PRD 3.1)                  */}
      {/* ------------------------------------------------------------- */}
      <section id="portals" className="py-16 bg-[#f8f9ff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4338ca] bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 font-mono">
              Role-Calibrated Experiences
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Tailored Portals for Every Placement Stakeholder
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Choose your access path to enter institutional command or student telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Institutional Placement Cell */}
            <div className="p-7 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-lg bg-indigo-50 text-[#4338ca] border border-indigo-200 flex items-center justify-center mb-5">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Institutional Placement Cell
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  For Deans, Placement Directors, and HODs. Monitor cohort readiness curves, triage at-risk candidates, simulate recruiter rubric matching, and export compliance reports.
                </p>
                <div className="mt-5 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-mono text-[10px] font-bold text-[#4338ca] bg-white px-1.5 py-0.5 rounded border border-indigo-200">01</span>
                    <span className="font-medium">Real-time Batch 2025 Command Center</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-mono text-[10px] font-bold text-[#4338ca] bg-white px-1.5 py-0.5 rounded border border-indigo-200">02</span>
                    <span className="font-medium">Multi-faceted Student Dossier Directory</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-mono text-[10px] font-bold text-[#4338ca] bg-white px-1.5 py-0.5 rounded border border-indigo-200">03</span>
                    <span className="font-medium">1-Click Statutory Audit Data Tables</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
                <Button
                  variant="primary"
                  className="w-full bg-[#4338ca] hover:bg-[#2a14b4] text-xs font-bold py-2.5"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => navigate("/login?tab=department")}
                >
                  Placement Cell Sign In
                </Button>
              </div>
            </div>

            {/* Candidate & Student Tier */}
            <div className="p-7 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mb-5">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Engineering Student Candidate
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  For final-year engineering students. Access your diagnostic feedback loop, verify coding handles, practice AI audio-visual mock interviews with STAR scoring, and track company matches.
                </p>
                <div className="mt-5 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-mono text-[10px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">01</span>
                    <span className="font-medium">Dual Telemetry (LeetCode + AI Mock Rubric)</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-mono text-[10px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">02</span>
                    <span className="font-medium">Enterprise Compatibility Percentile Breakdown</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-mono text-[10px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">03</span>
                    <span className="font-medium">Daily Behavioral STAR Task Streaks</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
                <Button
                  variant="outline"
                  className="w-full text-xs font-bold border-slate-300 text-slate-800 py-2.5"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => navigate("/login?tab=student")}
                >
                  Student Portal Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* Comprehensive Institutional Footer                            */}
      {/* ------------------------------------------------------------- */}
      <footer className="bg-white border-t border-slate-200/90 text-slate-600">
        {/* Main Footer Links */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
            
            {/* Column 1: Brand & Sovereign Value Prop */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/branding/sips-logo-compact.png"
                  alt="SIPS - Skill Intelligence Placement System"
                  className="h-9 w-auto object-contain cursor-pointer"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pr-4">
                Skill Intelligence Placement System (SIPS) is a predictive telemetry engine designed for higher education placement cells, transforming fragmented candidate metrics into deterministic Day-0 hiring outcomes.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 w-fit">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Sovereign Institutional Data Privacy</span>
              </div>
            </div>

            {/* Column 2: Intelligence Platform */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Platform Architecture
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#pipeline" className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    5-Stage Placement Pipeline
                  </a>
                </li>
                <li>
                  <a href="#loop" className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    Continuous Intelligence Loop
                  </a>
                </li>
                <li>
                  <a href="#problem" className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    Problem Diagnostic Triad
                  </a>
                </li>
                <li>
                  <a href="#portals" className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    Stakeholder Command Matrix
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Portals & Access */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Direct Access Portals
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/login?tab=department" className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    Placement Cell & TPO Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/login?tab=student" className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    Engineering Candidate Portal
                  </Link>
                </li>
                <li>
                  <Link to="/login?mode=onboard" className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    Institutional Self-Onboarding
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setDemoModalOpen(true)}
                    className="text-left text-[#4338ca] hover:text-[#2a14b4] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-[#4338ca]" />
                    Book Campus Readiness Briefing
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal & Policy */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Legal & Governance
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/privacy" className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/security" className="text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    Data Security
                  </Link>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Bar: Copyright, Version, & Live Sync */}
        <div className="border-t border-slate-200/80 bg-slate-50/60 py-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <img
                src="/branding/sips-mark.png"
                alt="SIPS Mark"
                className="w-4 h-4 object-contain"
              />
              <span>© {new Date().getFullYear()} SIPS Platform. All institutional rights reserved.</span>
            </div>

            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Node v4.8.2 Synced
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">PostgreSQL + Prisma Verified</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* Institutional Pilot & Briefing Lead Capture Modal              */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={demoModalOpen}
        onClose={() => {
          setDemoModalOpen(false);
          setDemoSubmitted(false);
        }}
        title="Institutional Pilot & Campus Briefing"
        subtitle="Schedule a customized readiness diagnostic demo for your university or college placement cell."
        maxWidth="max-w-lg"
      >
        {demoSubmitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Briefing Request Confirmed</h4>
              <p className="text-xs text-slate-600 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Thank you, <span className="font-semibold text-slate-800">{demoForm.name}</span>. Our university solutions team will contact <span className="font-semibold text-slate-800">{demoForm.collegeName || "your institution"}</span> at <span className="font-semibold text-slate-800">{demoForm.email}</span> within 24 business hours.
              </p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono text-left">
              <div><strong>Designation:</strong> {demoForm.designation}</div>
              <div><strong>Cohort Size:</strong> {demoForm.studentsCount} candidates</div>
              <div><strong>Contact:</strong> {demoForm.phone || "Provided via email"}</div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="w-full text-xs font-bold"
                onClick={() => {
                  setDemoModalOpen(false);
                  setDemoSubmitted(false);
                }}
              >
                Close
              </Button>
              <Button
                variant="primary"
                className="w-full text-xs font-bold bg-[#4338ca] hover:bg-[#2a14b4]"
                onClick={() => {
                  setDemoModalOpen(false);
                  navigate("/login?mode=onboard");
                }}
              >
                Direct Onboard Portal
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDemoSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Prof. / Dr. / Mr. Name"
                  value={demoForm.name}
                  onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Designation / Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={demoForm.designation}
                  onChange={(e) => setDemoForm({ ...demoForm, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Training & Placement Officer (TPO)">Training & Placement Officer (TPO)</option>
                  <option value="Head of Placement Cell">Head of Placement Cell</option>
                  <option value="Dean / Principal">Dean / Principal</option>
                  <option value="HOD (CSE / IT / Core)">HOD (CSE / IT / Core)</option>
                  <option value="Faculty Placement Coordinator">Faculty Placement Coordinator</option>
                  <option value="Other Administrator">Other Administrator</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                College / University Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., National Institute of Technology..."
                value={demoForm.collegeName}
                onChange={(e) => setDemoForm({ ...demoForm, collegeName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Email ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="tpo@institution.ac.in"
                  value={demoForm.email}
                  onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile / WhatsApp Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={demoForm.phone}
                  onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Eligible Student Cohort Size
              </label>
              <select
                value={demoForm.studentsCount}
                onChange={(e) => setDemoForm({ ...demoForm, studentsCount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Under 500">Under 500 candidates</option>
                <option value="500 - 1,500">500 - 1,500 candidates</option>
                <option value="1,500 - 3,500">1,500 - 3,500 candidates</option>
                <option value="3,500+">3,500+ candidates (Multi-campus)</option>
              </select>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                type="submit"
                className="w-full bg-[#4338ca] hover:bg-[#2a14b4] text-xs font-bold py-2.5 shadow-sm"
              >
                Submit Briefing Request
              </Button>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                100% Institution-Owned Data • NDA & Data Security Compliant
              </p>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
