import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Lock, Server, KeyRound, FileCheck, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/common/Button";

export function DataSecurityPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Security & Data Sovereignty
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Institutional Data Ownership & Architecture Security
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Overview of technical controls, role-based access isolation, and zero-compromise encryption.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <Lock className="w-5 h-5 text-[#4338ca]" />
            <h3 className="text-sm font-bold text-slate-900">End-to-End Encryption</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              All communications utilize TLS 1.3 encryption. Passwords are salted and hashed with bcrypt, and all assessment telemetry is securely stored in isolated PostgreSQL instances.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <Server className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Multi-Tenant Tenant Isolation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Strict row-level and institutional ID scoping prevents any cross-institutional data leakage between different colleges or universities.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Role-Based Access Control (RBAC)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fine-grained access tiers differentiate between Super Admins, College Admins, TPOs, Faculty Coordinators, and Students.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <FileCheck className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Audit Logging & Telemetry</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Placement officer actions, evaluation changes, and mock interview scores generate immutable audit logs for statutory compliance.
            </p>
          </div>
        </div>

        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            Self-Hosted & Private Cloud Deployment Options
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            For institutions with strict intranet or on-premise mandate regulations, SIPS can be deployed within an institution's private virtual cloud (VPC) or local campus server farm with complete containerized autonomy.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Docker & Docker Compose
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> PostgreSQL & Prisma
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Node.js & React Core
            </div>
          </div>
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
