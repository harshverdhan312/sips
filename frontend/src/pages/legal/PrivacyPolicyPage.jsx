import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Lock, Eye, Server, FileText } from "lucide-react";
import { Button } from "../../components/common/Button";

export function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-3.5 h-3.5" />
            Institutional Privacy Charter
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy & Data Sovereign Governance
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Last updated: October 2026 • Effective for all SIPS-connected higher education institutions and student candidates.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <Lock className="w-5 h-5 text-[#4338ca]" />
            <h3 className="text-sm font-bold text-slate-900">100% Institution-Owned</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              All student profiles, coding submissions, and assessment rubrics belong exclusively to your college or university.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <Eye className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Zero Data Monetization</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We never sell, rent, or trade student records or placement records to third-party ad networks or brokers.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <Server className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Encrypted Infrastructure</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Candidate credentials, resumes, and interview telemetry are encrypted in-transit (TLS 1.3) and at-rest (AES-256).
            </p>
          </div>
        </div>

        {/* Section 1 */}
        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            1. Information We Collect
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            SIPS collects information necessary to evaluate placement readiness and provide rubric telemetry:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 pl-2">
            <li><strong>Institutional Information:</strong> College name, department, official administrator/TPO contact credentials.</li>
            <li><strong>Student Academic Records:</strong> Roll number, branch, semester, CGPA, graduation year, and verified email.</li>
            <li><strong>Skill Telemetry Data:</strong> Coding problem submissions, execution time, test case pass rates, and practice activity logs.</li>
            <li><strong>Mock Interview Metrics:</strong> Proctored audio-visual STAR metrics, speech pace (WPM), filler frequency, and behavioral scores.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            2. How We Use Collected Data
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Data processed within SIPS is strictly utilized to:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 pl-2">
            <li>Generate real-time Placement Readiness Index (0–100) scores for students.</li>
            <li>Enable Training & Placement Officers (TPOs) and faculty mentors to identify students requiring targeted intervention.</li>
            <li>Compute company rubric compatibility matches for enterprise hiring drives.</li>
            <li>Generate statutory accreditation analytics (e.g. NBA, NAAC, NIRF) for the college.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            3. Student Rights & Control
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Students have full control over their public portfolio URL (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">/u/:username</code>). Public sharing can be toggled on or off at any time from the Student Profile Settings. Students may request complete account data deletion through their institution's authorized placement cell administrator.
          </p>
        </section>

        {/* Section 4 */}
        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            4. Contact & Compliance Inquiries
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            For questions regarding privacy, data protection agreements (DPAs), or institutional compliance, contact your institution's SIPS Administrator or email <span className="font-mono text-indigo-600">privacy@sips.dev</span>.
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
