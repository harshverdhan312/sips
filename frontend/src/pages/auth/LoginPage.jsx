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
  Info,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";

export function LoginPage() {
  const { login, registerCollege } = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();
  const navigate = useNavigate();

  // Mode: Sign In vs Register
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Sign In states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // College Register states
  const [regCollegeName, setRegCollegeName] = useState("");
  const [regCollegeSlug, setRegCollegeSlug] = useState("");
  const [regAdminEmail, setRegAdminEmail] = useState("");
  const [regMasterPassword, setRegMasterPassword] = useState("");
  const [regConfirmMasterPassword, setRegConfirmMasterPassword] = useState("");
  const [regAcceptedDomains, setRegAcceptedDomains] = useState("");
  const [regErrors, setRegErrors] = useState({});

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const trimmedId = identifier.trim();

    if (!trimmedId) {
      newErrors.identifier = "Please enter your email or ID.";
    } else if (trimmedId.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedId)) {
        newErrors.identifier = "Please enter a valid email address.";
      }
    }

    if (!password) {
      newErrors.password = "Please enter your password.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.identifier === "Please enter a valid email address.") {
        showError("Invalid email format. Please check and try again.");
      } else {
        showWarning("Email/ID and password are required.");
      }
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const result = await login(trimmedId, password);
      showSuccess(`Login successful. Welcome back, ${result.user?.name || "User"}!`);
      navigate(`/${result.role}/dashboard`);
    } catch (err) {
      const msg = err.message || "Invalid credentials. Please verify your ID/Email and password.";
      setErrors({ general: msg });
      setPassword(""); // Clear password field for security and easy re-entry
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showWarning("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail.trim())) {
      showError("Please enter a valid email address.");
      return;
    }

    setResetSent(true);
    setTimeout(() => {
      showInfo("Password reset instructions sent to " + forgotEmail.trim());
      setForgotModalOpen(false);
      setResetSent(false);
      setForgotEmail("");
    }, 800);
  };

  const handleCollegeRegister = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!regCollegeName.trim()) {
      newErrors.name = "Institution name is required.";
    }
    if (!regCollegeSlug.trim()) {
      newErrors.slug = "Institution slug is required.";
    }
    if (!regAdminEmail.trim()) {
      newErrors.adminEmail = "Admin email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(regAdminEmail.trim())) {
        newErrors.adminEmail = "Please enter a valid email address.";
      }
    }

    if (!regMasterPassword) {
      newErrors.masterPassword = "Master password is required.";
    } else if (regMasterPassword.length < 6) {
      newErrors.masterPassword = "Password must be at least 6 characters long.";
    }

    if (!regConfirmMasterPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (regMasterPassword !== regConfirmMasterPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    const domains = regAcceptedDomains
      .split(",")
      .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
      .filter(Boolean);

    const emailParts = regAdminEmail.trim().split("@");
    if (emailParts.length === 2) {
      const adminDomain = emailParts[1].toLowerCase().trim();
      if (adminDomain && !domains.includes(adminDomain)) {
        domains.push(adminDomain);
      }
    }

    if (domains.length === 0) {
      newErrors.domains = "Please provide at least one accepted email domain.";
    }

    if (Object.keys(newErrors).length > 0) {
      setRegErrors(newErrors);
      if (newErrors.confirmPassword === "Passwords do not match.") {
        showError("Passwords do not match. Please re-enter.");
      } else {
        showWarning("Please fill in all required fields correctly.");
      }
      return;
    }

    setRegErrors({});
    setLoading(true);
    try {
      await registerCollege({
        name: regCollegeName.trim(),
        slug: regCollegeSlug.toLowerCase().trim(),
        adminEmail: regAdminEmail.toLowerCase().trim(),
        masterPassword: regMasterPassword,
        acceptedDomains: domains
      });

      showSuccess(`Account created successfully. Welcome to SIPS, ${regCollegeName.trim()}!`);
      navigate("/placement/dashboard");
    } catch (err) {
      const msg = err.message || "Institution registration failed.";
      setRegErrors({ general: msg });
      showError(msg);
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
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${!isRegisterMode
                  ? "bg-white text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsRegisterMode(true)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${isRegisterMode
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
            <form onSubmit={handleSignInSubmit} className="space-y-4" noValidate>
              {/* General Error Banner */}
              {errors.general && (
                <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errors.general}</span>
                </div>
              )}

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
                    disabled={loading}
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errors.identifier || errors.general) {
                        setErrors((prev) => ({ ...prev, identifier: "", general: "" }));
                      }
                    }}
                    placeholder="e.g. 1RV21CS001 or student@rvce.edu"
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      errors.identifier
                        ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                        : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                    } ${loading ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                  />
                </div>
                {errors.identifier && (
                  <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.identifier}
                  </p>
                )}
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
                    disabled={loading}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password || errors.general) {
                        setErrors((prev) => ({ ...prev, password: "", general: "" }));
                      }
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                      errors.password
                        ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                        : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                    } ${loading ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    disabled={loading}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  Remember session
                </label>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setForgotModalOpen(true)}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                loading={loading}
                disabled={loading}
                className="w-full py-2.5 mt-1"
                icon={ArrowRight}
                iconPosition="right"
              >
                {loading ? "Logging in..." : "Sign In to SIPS"}
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

              {/* General Error Banner */}
              {regErrors.general && (
                <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 animate-in fade-in duration-200 mb-3">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{regErrors.general}</span>
                </div>
              )}

              <form onSubmit={handleCollegeRegister} className="space-y-3" noValidate>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Institution Name *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={regCollegeName}
                    onChange={(e) => {
                      setRegCollegeName(e.target.value);
                      if (regErrors.name || regErrors.general) {
                        setRegErrors((prev) => ({ ...prev, name: "", general: "" }));
                      }
                    }}
                    placeholder="e.g. RV College of Engineering"
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                      regErrors.name
                        ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                        : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                    } ${loading ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                  />
                  {regErrors.name && (
                    <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {regErrors.name}
                    </p>
                  )}
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
                        disabled={loading}
                        value={regCollegeSlug}
                        onChange={(e) => {
                          setRegCollegeSlug(e.target.value);
                          if (regErrors.slug || regErrors.general) {
                            setRegErrors((prev) => ({ ...prev, slug: "", general: "" }));
                          }
                        }}
                        placeholder="rvce"
                        className={`w-full pl-8 pr-2 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                          regErrors.slug
                            ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                            : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                        } ${loading ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    {regErrors.slug && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {regErrors.slug}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Placement Admin Email *
                    </label>
                    <input
                      type="email"
                      required
                      disabled={loading}
                      value={regAdminEmail}
                      onChange={(e) => {
                        setRegAdminEmail(e.target.value);
                        if (regErrors.adminEmail || regErrors.general) {
                          setRegErrors((prev) => ({ ...prev, adminEmail: "", general: "" }));
                        }
                      }}
                      placeholder="placement@rvce.edu"
                      className={`w-full px-2.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                        regErrors.adminEmail
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                      } ${loading ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                    />
                    {regErrors.adminEmail && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {regErrors.adminEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Accepted Student Email Domains *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={regAcceptedDomains}
                    onChange={(e) => {
                      setRegAcceptedDomains(e.target.value);
                      if (regErrors.domains || regErrors.general) {
                        setRegErrors((prev) => ({ ...prev, domains: "", general: "" }));
                      }
                    }}
                    placeholder="e.g. rvce.edu, student.rvce.edu"
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                      regErrors.domains
                        ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                        : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                    } ${loading ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                  />
                  {regErrors.domains && (
                    <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {regErrors.domains}
                    </p>
                  )}
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
                      disabled={loading}
                      value={regMasterPassword}
                      onChange={(e) => {
                        setRegMasterPassword(e.target.value);
                        if (regErrors.masterPassword || regErrors.general) {
                          setRegErrors((prev) => ({ ...prev, masterPassword: "", general: "" }));
                        }
                      }}
                      placeholder="••••••••"
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                        regErrors.masterPassword
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                      } ${loading ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                    />
                    {regErrors.masterPassword && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {regErrors.masterPassword}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      disabled={loading}
                      value={regConfirmMasterPassword}
                      onChange={(e) => {
                        setRegConfirmMasterPassword(e.target.value);
                        if (regErrors.confirmPassword || regErrors.general) {
                          setRegErrors((prev) => ({ ...prev, confirmPassword: "", general: "" }));
                        }
                      }}
                      placeholder="••••••••"
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                        regErrors.confirmPassword
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                      } ${loading ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                    />
                    {regErrors.confirmPassword && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {regErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  className="w-full py-2.5 mt-2"
                  icon={Building2}
                  iconPosition="left"
                >
                  {loading ? "Creating account..." : "Register & Onboard Institution"}
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
