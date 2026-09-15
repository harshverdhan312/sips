import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  GraduationCap,
  Building2,
  Shield,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
  Sparkles,
  UserPlus,
  User,
  Hash,
  Globe
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";

export function LoginPage() {
  const { login, demoLogin, register, registerCollege } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  // Mode: Sign In vs Register
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Sign In states
  const [email, setEmail] = useState("student@sips.demo");
  const [password, setPassword] = useState("password123");
  const [chosenRole, setChosenRole] = useState("student");
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Register states
  const [registerRole, setRegisterRole] = useState("student"); // "student" | "college"
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRollNo, setRegRollNo] = useState("");
  const [regBranch, setRegBranch] = useState("Computer Science & Engineering");
  const [regBatch, setRegBatch] = useState("2025");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // College Register states
  const [regCollegeName, setRegCollegeName] = useState("");
  const [regCollegeSlug, setRegCollegeSlug] = useState("");
  const [regAdminEmail, setRegAdminEmail] = useState("");
  const [regMasterPassword, setRegMasterPassword] = useState("");
  const [regConfirmMasterPassword, setRegConfirmMasterPassword] = useState("");
  const [regAcceptedDomains, setRegAcceptedDomains] = useState("");

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(email, password, chosenRole);
      addToast(`Welcome back to SIPS! Logged in as ${chosenRole}`, "success");
      navigate(`/${chosenRole}/dashboard`);
    }, 400);
  };

  const handleDemoClick = (role) => {
    demoLogin(role);
    addToast(`Signed in as demo ${role}`, "success");
    navigate(`/${role}/dashboard`);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setResetSent(true);
    setTimeout(() => {
      addToast("Password reset link sent to " + forgotEmail, "info");
      setForgotModalOpen(false);
      setResetSent(false);
      setForgotEmail("");
    }, 1000);
  };

  const handleStudentRegister = async (e) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      addToast("Passwords do not match. Please re-enter.", "error");
      return;
    }
    if (regPassword.length < 6) {
      addToast("Password must be at least 6 characters long.", "warning");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: regName,
        email: regEmail,
        rollNo: regRollNo,
        usn: regRollNo,
        branch: regBranch,
        batch: regBatch,
        password: regPassword
      });

      addToast(`Account created successfully! Welcome to SIPS, ${regName}!`, "success");
      navigate("/student/dashboard");
    } catch (err) {
      addToast(err.message || "Registration failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCollegeRegister = async (e) => {
    e.preventDefault();
    if (regMasterPassword !== regConfirmMasterPassword) {
      addToast("Master passwords do not match. Please re-enter.", "error");
      return;
    }

    const domains = regAcceptedDomains
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

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

      addToast(`College ${regCollegeName} registered successfully! Welcome!`, "success");
      navigate("/placement/dashboard");
    } catch (err) {
      addToast(err.message || "College registration failed.", "error");
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
        {/* Quick Demo Sign-in Box */}
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3.5 mb-5">
          <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Quick Demo Instant Access:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoClick("student")}
              className="flex flex-col items-center justify-center p-2 bg-white hover:bg-indigo-50 rounded-xl border border-indigo-200/80 shadow-2xs text-center transition-all cursor-pointer group"
            >
              <GraduationCap className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900 mt-1">Student</span>
              <span className="text-[9px] text-slate-400">Khushi Sharma</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoClick("placement")}
              className="flex flex-col items-center justify-center p-2 bg-white hover:bg-indigo-50 rounded-xl border border-indigo-200/80 shadow-2xs text-center transition-all cursor-pointer group"
            >
              <Building2 className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900 mt-1">Placement</span>
              <span className="text-[9px] text-slate-400">Officer Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoClick("admin")}
              className="flex flex-col items-center justify-center p-2 bg-white hover:bg-indigo-50 rounded-xl border border-indigo-200/80 shadow-2xs text-center transition-all cursor-pointer group"
            >
              <Shield className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900 mt-1">Admin</span>
              <span className="text-[9px] text-slate-400">System Admin</span>
            </button>
          </div>
        </div>

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
              Register Account
            </button>
          </div>

          {/* ================================================= */}
          {/* SIGN IN FORM                                     */}
          {/* ================================================= */}
          {!isRegisterMode && (
            <form onSubmit={handleSignInSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select Your Portal Role
                </label>
                <select
                  value={chosenRole}
                  onChange={(e) => {
                    setChosenRole(e.target.value);
                    setEmail(`${e.target.value}@sips.demo`);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="student">Student Portal</option>
                  <option value="placement">Placement Officer / Admin</option>
                  <option value="admin">Platform Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@sips.demo"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
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
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
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
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Register here
                </button>
              </div>
            </form>
          )}

          {/* ================================================= */}
          {/* REGISTRATION FORM                                */}
          {/* ================================================= */}
          {isRegisterMode && (
            <div>
              {/* Role selector for registration */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setRegisterRole("student")}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    registerRole === "student"
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Student Account
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterRole("college")}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    registerRole === "college"
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  College / Placement
                </button>
              </div>

              {/* Student Registration Form */}
              {registerRole === "student" && (
                <form onSubmit={handleStudentRegister} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Aarav Sharma"
                        className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Institutional Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="aarav@rvce.edu"
                        className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Roll No / USN *
                      </label>
                      <div className="relative">
                        <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={regRollNo}
                          onChange={(e) => setRegRollNo(e.target.value)}
                          placeholder="1RV21CS001"
                          className="w-full pl-9 pr-2 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Batch *
                      </label>
                      <select
                        value={regBatch}
                        onChange={(e) => setRegBatch(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      >
                        <option value="2025">Batch 2025</option>
                        <option value="2026">Batch 2026</option>
                        <option value="2027">Batch 2027</option>
                        <option value="2024">Batch 2024</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Department / Branch *
                    </label>
                    <select
                      value={regBranch}
                      onChange={(e) => setRegBranch(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Information Science & Engineering">Information Science & Engineering</option>
                      <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                      <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
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
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    loading={loading}
                    className="w-full py-2 mt-1"
                    icon={UserPlus}
                    iconPosition="left"
                  >
                    Create Student Account
                  </Button>
                </form>
              )}

              {/* College Registration Form */}
              {registerRole === "college" && (
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
                      className="w-full px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
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
                          className="w-full pl-8 pr-2 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Placement Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={regAdminEmail}
                        onChange={(e) => setRegAdminEmail(e.target.value)}
                        placeholder="placement@rvce.edu"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Accepted Domains (comma-separated) *
                    </label>
                    <input
                      type="text"
                      required
                      value={regAcceptedDomains}
                      onChange={(e) => setRegAcceptedDomains(e.target.value)}
                      placeholder="e.g. rvce.edu, student.rvce.edu"
                      className="w-full px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
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
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
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
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    loading={loading}
                    className="w-full py-2 mt-1"
                    icon={Building2}
                    iconPosition="left"
                  >
                    Register Institution
                  </Button>
                </form>
              )}

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
