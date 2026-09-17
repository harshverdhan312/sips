import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Award,
  Sparkles,
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
  Compass
} from "lucide-react";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";

export function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("telemetry");

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* ------------------------------------------------------------- */}
      {/* Sovereign Top Navigation Bar                                  */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2a14b4] to-[#4338ca] flex items-center justify-center text-white shadow-sm shadow-indigo-300">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 tracking-tight text-lg leading-tight flex items-center gap-1.5">
                SIPS
                <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  v4.8.2 Synced
                </span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Skill Intelligence Placement System
              </span>
            </div>
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
              onClick={() => navigate("/login")}
              className="bg-[#4338ca] hover:bg-[#2a14b4] shadow-sm text-xs font-bold"
            >
              Onboard College
            </Button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION: Product-Led Telemetry Hero                      */}
      {/* ------------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-200/60 bg-gradient-to-b from-white to-[#f8f9ff]">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10" />

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
                  onClick={() => navigate("/login")}
                  className="bg-[#4338ca] hover:bg-[#2a14b4] font-bold shadow-md shadow-indigo-200"
                >
                  Access Institutional Command
                </Button>
                <Link
                  to="/login"
                  className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
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
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 relative">
                {/* Header Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
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
      {/* SECTION: Problem Diagnostic Triad (PRD 3.1)                   */}
      {/* ------------------------------------------------------------- */}
      <section id="problem" className="py-16 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              Institutional Blind Spots
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              The Placement Preparation Crisis
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Why traditional spreadsheet tracking and generic training models result in catastrophic Day-0 rejection rates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Blindspot 1 */}
            <div className="p-6 rounded-2xl bg-[#f8f9ff] border border-slate-200/80 hover:border-indigo-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mb-4">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                1. Scattered Student Data
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Technical assessments across LeetCode, HackerRank, GitHub repos, academic CGPA, and soft-skill reports reside in disconnected silos with zero synthesis.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200 text-[11px] font-mono text-rose-700">
                Result: Unpredictable Day-0 failures
              </div>
            </div>

            {/* Blindspot 2 */}
            <div className="p-6 rounded-2xl bg-[#f8f9ff] border border-slate-200/80 hover:border-indigo-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                2. Unclear Placement Readiness
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Students clear college exams without knowing if their code quality, concurrency handling, or behavioral STAR articulation meets Tier-1 hiring rubrics.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200 text-[11px] font-mono text-amber-700">
                Result: False confidence pre-interview
              </div>
            </div>

            {/* Blindspot 3 */}
            <div className="p-6 rounded-2xl bg-[#f8f9ff] border border-slate-200/80 hover:border-indigo-300 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#4338ca] border border-indigo-200 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                3. Generic, Inefficient Prep
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Colleges deliver identical, monolithic training to 1,000+ candidates rather than isolating and closing specific student skill deficits.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200 text-[11px] font-mono text-indigo-700">
                Result: High budget, low conversion
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
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              End-to-End Methodology
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
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
                icon: Sparkles
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
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs relative flex flex-col justify-between"
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
                  <Zap className="w-6 h-6 text-[#4338ca] fill-[#4338ca]" />
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
            <span className="text-xs font-bold uppercase tracking-wider text-[#4338ca] bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              Role-Calibrated Experiences
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Tailored Portals for Every Placement Stakeholder
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Choose your access path to enter institutional command or student telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Institutional Placement Cell */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#4338ca] border border-indigo-200 flex items-center justify-center mb-5">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Institutional Placement Cell
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  For Deans, Placement Directors, and HODs. Monitor cohort readiness curves, triage at-risk candidates, simulate recruiter rubric matching, and export NBA/NIRF compliance reports.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Real-time Batch 2025 Command Center
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Multi-faceted Student Dossier Directory
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1-Click NIRF / NBA Statutory Audit Tables
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
                <Button
                  variant="primary"
                  className="w-full bg-[#4338ca] hover:bg-[#2a14b4] text-xs font-bold"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => navigate("/login")}
                >
                  Placement Cell Sign In
                </Button>
              </div>
            </div>

            {/* Candidate & Student Tier */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mb-5">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Engineering Student Candidate
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  For final-year engineering students. Access your diagnostic feedback loop, verify coding handles, practice AI audio-visual mock interviews with STAR scoring, and track company matches.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dual Telemetry (LeetCode + AI Mock Rubric)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Enterprise Compatibility Percentile Breakdown
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Daily Behavioral STAR Task Streaks
                  </li>
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
                <Button
                  variant="outline"
                  className="w-full text-xs font-bold border-slate-300 text-slate-800"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => navigate("/login")}
                >
                  Student Portal Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* Footer                                                        */}
      {/* ------------------------------------------------------------- */}
      <footer className="bg-white border-t border-slate-200 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono font-medium">
            <Zap className="w-4 h-4 text-[#4338ca] fill-[#4338ca]" />
            <span>SIPS Platform // Approved Baseline v1.0.0</span>
          </div>
          <div>
            Built for Institutional Accreditation Compliance: NBA Criterion 5 • NAAC 5.2.1 • NIRF GO
          </div>
          <div>
            © 2026 SIPS Institutional Placement Intelligence
          </div>
        </div>
      </footer>
    </div>
  );
}
