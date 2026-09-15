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
  Sparkles
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";

export function LoginPage() {
  const { login, demoLogin } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  const [email, setEmail] = useState("student@sips.demo");
  const [password, setPassword] = useState("password123");
  const [chosenRole, setChosenRole] = useState("student");
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(email, password, chosenRole);
      addToast(`Welcome back to SIPS! Logged in as ${chosenRole}`, "success");
      navigate(`/${chosenRole}/dashboard`);
    }, 500);
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
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background glow accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-4">
          <Zap className="w-8 h-8 fill-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          SIPS
        </h1>
        <p className="text-xs uppercase tracking-widest font-bold text-indigo-600 mt-0.5">
          Skill Intelligence Placement System
        </p>
        <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
          AI-powered career intelligence platform reducing Data Blindness in campus placements.
        </p>
      </div>

      {/* Quick Demo Sign-in Box */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 mb-6">
          <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Quick Demo Instant Access:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleDemoClick("student")}
              className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-indigo-50 rounded-xl border border-indigo-200/80 shadow-2xs text-center transition-all cursor-pointer group"
            >
              <GraduationCap className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900 mt-1">Student</span>
              <span className="text-[10px] text-slate-400">Khushi Sharma</span>
            </button>

            <button
              onClick={() => handleDemoClick("placement")}
              className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-indigo-50 rounded-xl border border-indigo-200/80 shadow-2xs text-center transition-all cursor-pointer group"
            >
              <Building2 className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900 mt-1">Placement</span>
              <span className="text-[10px] text-slate-400">Officer Portal</span>
            </button>

            <button
              onClick={() => handleDemoClick("admin")}
              className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-indigo-50 rounded-xl border border-indigo-200/80 shadow-2xs text-center transition-all cursor-pointer group"
            >
              <Shield className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900 mt-1">Admin</span>
              <span className="text-[10px] text-slate-400">System Admin</span>
            </button>
          </div>
        </div>

        {/* Regular Login Form Card */}
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Your Role
              </label>
              <select
                value={chosenRole}
                onChange={(e) => {
                  setChosenRole(e.target.value);
                  setEmail(`${e.target.value}@sips.demo`);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="student">Student Portal</option>
                <option value="placement">Placement Officer / Admin</option>
                <option value="admin">Platform Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@sips.demo"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                Remember this session
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
              className="w-full py-2.5 mt-2"
              icon={ArrowRight}
              iconPosition="right"
            >
              Sign In to SIPS
            </Button>
          </form>
        </div>

        {/* Feature badges footer */}
        <div className="mt-8 text-center">
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
              placeholder="e.g. khushi@institution.edu"
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
