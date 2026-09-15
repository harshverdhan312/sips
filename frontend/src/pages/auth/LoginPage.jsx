import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Building2,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
  UserPlus,
  Globe,
  Info
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";

export function LoginPage() {
  const { login, registerCollege } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  // Mode: Sign In vs Register
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Sign In states (blank by default - no demo credentials)
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // College Register states
  const [regCollegeName, setRegCollegeName] = useState("");
  const [regCollegeSlug, setRegCollegeSlug] = useState("");
  const [regAdminEmail, setRegAdminEmail] = useState("");
  const [regMasterPassword, setRegMasterPassword] = useState("");
  const [regConfirmMasterPassword, setRegConfirmMasterPassword] = useState("");
  const [regAcceptedDomains, setRegAcceptedDomains] = useState("");

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      addToast("Please enter your ID/Email and password", "warning");
      return;
    }

    setLoading(true);
    try {
      const result = await login(identifier.trim(), password);
      addToast(`Welcome back, ${result.user.name}!`, "success");
      navigate(`/${result.role}/dashboard`);
    } catch (err) {
      addToast(err.message || "Invalid credentials. Please verify your ID/Email and password.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setResetSent(true);
    setTimeout(() => {
      addToast("Password reset instructions sent to " + forgotEmail, "info");
      setForgotModalOpen(false);
      setResetSent(false);
      setForgotEmail("");
    }, 800);
  };

  const handleCollegeRegister = async (e) => {
    e.preventDefault();
    if (regMasterPassword !== regConfirmMasterPassword) {
      addToast("Master passwords do not match. Please re-enter.", "error");
      return;
    }

    const domains = regAcceptedDomains
      .split(",")
      .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
      .filter(Boolean);

    // Auto-include admin email domain so admin can always access their institution
    const emailParts = regAdminEmail.trim().split('@');
    if (emailParts.length === 2) {
      const adminDomain = emailParts[1].toLowerCase().trim();
      if (adminDomain && !domains.includes(adminDomain)) {
        domains.push(adminDomain);
      }
    }

    if (domains.length === 0) {
      addToast("Please provide at least one accepted email domain for students.", "warning");
      return;
    }

    setLoading(true);
    try {
      await registerCollege({
        name: regCollegeName,
        slug: regCollegeSlug.toLowerCase().trim(),
        adminEmail: regAdminEmail.toLowerCase().trim(),
        masterPassword: regMasterPassword,
        acceptedDomains: domains
      });

      addToast(`Institution ${regCollegeName} onboarded successfully! Welcome!`, "success");
      navigate("/placement/dashboard");
    } catch (err) {
      addToast(err.message || "Institution registration failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Background glow accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-3">
          <Zap className="w-8 h-8 fill-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          SIPS
        </h1>
        <p className="text-xs uppercase tracking-widest font-bold text-indigo-600 mt-0.5">
          Skill Intelligence Placement System
        </p>
        <p className="mt-1.5 text-xs text-slate-600 max-w-sm mx-auto">
          AI-powered career intelligence platform reducing Data Blindness in campus placements.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Main Auth Card */}
        <div className="bg-white py-6 px-6 sm:px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          {/* Sign In vs Register Toggle Header */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-5 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setIsRegisterMode(false)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isRegisterMode
                  ? "bg-white text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsRegisterMode(true)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                isRegisterMode
                  ? "bg-white text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register College
            </button>
          </div>

          {/* ================================================= */}
          {/* SIGN IN FORM                                     */}
          {/* ================================================= */}
          {!isRegisterMode && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              {/* Student Notice Pill */}
              <div className="flex items-start gap-2 p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100/80 text-xs text-indigo-900 leading-snug">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Students & Admins:</strong> Sign in using your registered Institutional Email or Roll No / USN and password.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Institutional Email or Roll No / USN
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 1RV21CS001 or student@rvce.edu"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  Remember session
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full py-2.5 mt-1"
                icon={ArrowRight}
                iconPosition="right"
              >
                Sign In to SIPS
              </Button>

              <div className="pt-2 text-center text-xs text-slate-500">
                Are you an institution or placement cell?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Onboard here
                </button>
              </div>
            </form>
          )}

          {/* ================================================= */}
          {/* INSTITUTION / COLLEGE REGISTRATION               */}
          {/* ================================================= */}
          {isRegisterMode && (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Register College / Placement Cell
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Onboard your college to provision student rosters and manage placement drives.
                </p>
              </div>

              <form onSubmit={handleCollegeRegister} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Institution Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regCollegeName}
                    onChange={(e) => setRegCollegeName(e.target.value)}
                    placeholder="e.g. RV College of Engineering"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Institution Slug *
                    </label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={regCollegeSlug}
                        onChange={(e) => setRegCollegeSlug(e.target.value)}
                        placeholder="rvce"
                        className="w-full pl-8 pr-2 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Placement Admin Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={regAdminEmail}
                      onChange={(e) => setRegAdminEmail(e.target.value)}
                      placeholder="placement@rvce.edu"
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Accepted Student Email Domains *
                  </label>
                  <input
                    type="text"
                    required
                    value={regAcceptedDomains}
                    onChange={(e) => setRegAcceptedDomains(e.target.value)}
                    placeholder="e.g. rvce.edu, student.rvce.edu"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Master Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regMasterPassword}
                      onChange={(e) => setRegMasterPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regConfirmMasterPassword}
                      onChange={(e) => setRegConfirmMasterPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full py-2.5 mt-2"
                  icon={Building2}
                  iconPosition="left"
                >
                  Register & Onboard Institution
                </Button>
              </form>

              <div className="pt-3 text-center text-xs text-slate-500">
                Already registered with SIPS?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Sign in here
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feature badges footer */}
        <div className="mt-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> ATS Resume Scanner
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> AI Mock Interviews
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> STAR Behavioral Engine
            </span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Account Password"
        subtitle="Enter your institutional email to receive a password reset link"
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="e.g. student@institution.edu"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setForgotModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={resetSent}>
              Send Reset Link
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
