import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldAlert, FileText, Scale } from "lucide-react";
import { Button } from "../../components/common/Button";

export function TermsOfServicePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-slate-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img
              src="/branding/sips-logo-compact.png"
              alt="SIPS Logo"
              className="h-9 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/login")}
              className="bg-[#4338ca] hover:bg-[#2a14b4] text-xs font-bold"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-white border-b border-slate-200/80 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-[#4338ca] border border-indigo-200 mb-4">
            <Scale className="w-3.5 h-3.5" />
            Terms of Service
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Institutional Terms of Service
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Last updated: October 2026 • Governing platform usage for institutional accounts, faculty officers, and enrolled candidates.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            1. Acceptance of Terms
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            By accessing or using the SIPS (Skill Intelligence Placement System) platform, whether as an institutional administrator, Training & Placement Officer (TPO), faculty coordinator, or student candidate, you agree to comply with and be bound by these Terms of Service.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            2. Institutional License & Use
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            SIPS grants the subscribing university or college a non-exclusive, non-transferable license to utilize the platform for evaluating candidate placement readiness, managing practice modules, conducting proctored assessments, and monitoring placement analytics.
          </p>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 pl-2">
            <li>Institutions are responsible for maintaining the confidentiality of administrator and coordinator credentials.</li>
            <li>Student batch enrollments must correspond to legitimately enrolled students of the institution.</li>
          </ul>
        </section>

        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            3. Academic Integrity & Assessment Rules
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            To ensure valid placement readiness scoring:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 pl-2">
            <li>Submissions to the Coding Arena and Proctored Mock Interviews must reflect the student's authentic work.</li>
            <li>Use of automated solver bots, plagiarism, or tampering with proctoring telemetry is strictly logged and reported to the institution's placement cell.</li>
            <li>SIPS reserves the right to invalidate assessment results flagged for academic dishonesty by the institution's criteria.</li>
          </ul>
        </section>

        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            4. Service Availability & SLA
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            SIPS commits to providing 99.9% uptime during active campus placement seasons. Scheduled maintenance windows are communicated to institutional administrators at least 48 hours in advance.
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            5. Termination & Data Export
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Institutions may export all candidate rubrics, placement logs, and accreditation compliance tables at any time in standard CSV or JSON formats. Upon contract conclusion, institutions retain complete ownership of all historical data.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono">
            <img src="/branding/sips-mark.png" alt="SIPS Mark" className="w-4 h-4 object-contain" />
            <span>SIPS Platform // Approved Baseline</span>
          </div>
          <div>© {new Date().getFullYear()} SIPS Institutional Placement Intelligence.</div>
        </div>
      </footer>
    </div>
  );
}
