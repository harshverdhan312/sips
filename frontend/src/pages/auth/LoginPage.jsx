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
  AlertCircle,
  Plus,
  Trash2,
  GraduationCap,
  Layers,
  ChevronLeft,
  ChevronRight,
  BookOpen
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
  const [regStep, setRegStep] = useState(1); // Step 1: Details, Step 2: Academic Structure
  const [regCollegeName, setRegCollegeName] = useState("");
  const [regCollegeSlug, setRegCollegeSlug] = useState("");
  const [regAdminEmail, setRegAdminEmail] = useState("");
  const [regMasterPassword, setRegMasterPassword] = useState("");
  const [regConfirmMasterPassword, setRegConfirmMasterPassword] = useState("");
  const [regAcceptedDomains, setRegAcceptedDomains] = useState("");
  const [regErrors, setRegErrors] = useState({});

  // Academic Structure State for Step 2
  const [regCourses, setRegCourses] = useState([
    {
      courseName: "B.Tech",
      branches: [
        {
          branchName: "Computer Science & Engineering",
          sections: ["A", "B"]
        },
        {
          branchName: "Information Technology",
          sections: ["A"]
        }
      ]
    }
  ]);
  const [customSecInput, setCustomSecInput] = useState({});

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

  // Course, Branch & Section Management Helpers
  const addCourse = () => {
    setRegCourses((prev) => [
      ...prev,
      {
        courseName: "",
        branches: [{ branchName: "", sections: ["A", "B"] }]
      }
    ]);
  };

  const removeCourse = (courseIndex) => {
    if (regCourses.length <= 1) return;
    setRegCourses((prev) => prev.filter((_, i) => i !== courseIndex));
  };

  const updateCourseName = (courseIndex, name) => {
    setRegCourses((prev) =>
      prev.map((c, i) => (i === courseIndex ? { ...c, courseName: name } : c))
    );
  };

  const addBranch = (courseIndex) => {
    setRegCourses((prev) =>
      prev.map((c, i) => {
        if (i !== courseIndex) return c;
        return {
          ...c,
          branches: [...c.branches, { branchName: "", sections: ["A", "B"] }]
        };
      })
    );
  };

  const removeBranch = (courseIndex, branchIndex) => {
    setRegCourses((prev) =>
      prev.map((c, i) => {
        if (i !== courseIndex) return c;
        if (c.branches.length <= 1) return c;
        return {
          ...c,
          branches: c.branches.filter((_, bi) => bi !== branchIndex)
        };
      })
    );
  };

  const updateBranchName = (courseIndex, branchIndex, name) => {
    setRegCourses((prev) =>
      prev.map((c, i) => {
        if (i !== courseIndex) return c;
        return {
          ...c,
          branches: c.branches.map((b, bi) => (bi === branchIndex ? { ...b, branchName: name } : b))
        };
      })
    );
  };

  const updateBranchSectionCount = (courseIndex, branchIndex, count) => {
    const num = Math.max(1, Math.min(10, parseInt(count, 10) || 1));
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const newSections = Array.from({ length: num }, (_, idx) => alphabet[idx] || `S${idx + 1}`);
    setRegCourses((prev) =>
      prev.map((c, i) => {
        if (i !== courseIndex) return c;
        return {
          ...c,
          branches: c.branches.map((b, bi) => (bi === branchIndex ? { ...b, sections: newSections } : b))
        };
      })
    );
  };

  const addCustomSection = (courseIndex, branchIndex) => {
    const key = `${courseIndex}_${branchIndex}`;
    const val = (customSecInput[key] || "").trim();
    if (!val) return;
    setRegCourses((prev) =>
      prev.map((c, i) => {
        if (i !== courseIndex) return c;
        return {
          ...c,
          branches: c.branches.map((b, bi) => {
            if (bi !== branchIndex) return b;
            if (b.sections.includes(val)) return b;
            return { ...b, sections: [...b.sections, val] };
          })
        };
      })
    );
    setCustomSecInput((prev) => ({ ...prev, [key]: "" }));
  };

  const removeSection = (courseIndex, branchIndex, secIndex) => {
    setRegCourses((prev) =>
      prev.map((c, i) => {
        if (i !== courseIndex) return c;
        return {
          ...c,
          branches: c.branches.map((b, bi) => {
            if (bi !== branchIndex) return b;
            if (b.sections.length <= 1) return b;
            return { ...b, sections: b.sections.filter((_, si) => si !== secIndex) };
          })
        };
      })
    );
  };

  const handleProceedToAcademicSetup = (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
        showWarning("Please complete institution details before continuing.");
      }
      return;
    }

    setRegErrors({});
    setRegStep(2);
  };

  const handleCollegeRegister = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Validate academic structure
    if (!regCourses || regCourses.length === 0) {
      showError("Please define at least one degree program / course.");
      return;
    }

    for (let cIdx = 0; cIdx < regCourses.length; cIdx++) {
      const c = regCourses[cIdx];
      if (!c.courseName.trim()) {
        showError(`Degree Program #${cIdx + 1} is missing a course/program name.`);
        return;
      }
      if (!c.branches || c.branches.length === 0) {
        showError(`Course "${c.courseName}" must have at least one branch.`);
        return;
      }
      for (let bIdx = 0; bIdx < c.branches.length; bIdx++) {
        const b = c.branches[bIdx];
        if (!b.branchName.trim()) {
          showError(`Branch #${bIdx + 1} in course "${c.courseName}" is missing a name.`);
          return;
        }
        if (!b.sections || b.sections.length === 0) {
          showError(`Branch "${b.branchName}" must have at least one section.`);
          return;
        }
      }
    }

    const cleanAcademicStructure = regCourses.map((c) => ({
      courseName: c.courseName.trim(),
      branches: c.branches.map((b) => ({
        branchName: b.branchName.trim(),
        sections: b.sections.map((s) => String(s).trim()).filter(Boolean)
      })).filter((b) => b.branchName)
    })).filter((c) => c.courseName);

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

    setRegErrors({});
    setLoading(true);
    try {
      await registerCollege({
        name: regCollegeName.trim(),
        slug: regCollegeSlug.toLowerCase().trim(),
        adminEmail: regAdminEmail.toLowerCase().trim(),
        masterPassword: regMasterPassword,
        acceptedDomains: domains,
        academicStructure: cleanAcademicStructure
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
        <div className="flex justify-center mb-3">
          <img
            src="/branding/sips-logo-full.png"
            alt="SIPS - Skill Intelligence Placement System"
            className="h-16 w-auto max-w-[280px] sm:max-w-[320px] object-contain"
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-600 max-w-sm mx-auto">
          AI-powered career intelligence platform reducing Data Blindness in campus placements.
        </p>
      </div>

      <div className={`mt-6 sm:mx-auto sm:w-full transition-all duration-300 ${isRegisterMode && regStep === 2 ? "sm:max-w-2xl" : "sm:max-w-md"}`}>
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
          {/* INSTITUTION / COLLEGE REGISTRATION WIZARD        */}
          {/* ================================================= */}
          {isRegisterMode && (
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    College Onboarding Portal
                  </h3>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    Step {regStep} of 2
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {regStep === 1
                    ? "Step 1: Enter institutional credentials & official email domain authorization."
                    : "Step 2: Define your college's dynamic academic structure (Programs, Branches, Sections)."}
                </p>
              </div>

              {/* Wizard Step Progress Tracker */}
              <div className="flex items-center justify-between mb-4 px-1">
                <button
                  type="button"
                  onClick={() => setRegStep(1)}
                  className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                    regStep === 1 ? "text-indigo-600 font-bold" : "text-emerald-600"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    regStep === 1 ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
                  }`}>
                    {regStep > 1 ? "✓" : "1"}
                  </span>
                  Institution Info
                </button>

                <div className="h-0.5 flex-1 mx-3 bg-slate-200">
                  <div
                    className={`h-full bg-indigo-600 transition-all duration-300 ${
                      regStep === 2 ? "w-full" : "w-0"
                    }`}
                  />
                </div>

                <div
                  className={`flex items-center gap-1.5 text-xs font-semibold ${
                    regStep === 2 ? "text-indigo-600 font-bold" : "text-slate-400"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    regStep === 2 ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
                  }`}>
                    2
                  </span>
                  Academic Structure
                </div>
              </div>

              {/* General Error Banner */}
              {regErrors.general && (
                <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 animate-in fade-in duration-200 mb-3">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{regErrors.general}</span>
                </div>
              )}

              {/* STEP 1: INSTITUTION DETAILS */}
              {regStep === 1 && (
                <form onSubmit={handleProceedToAcademicSetup} className="space-y-3" noValidate>
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
                    className="w-full py-2.5 mt-2"
                    icon={ChevronRight}
                    iconPosition="right"
                  >
                    Continue to Academic Setup (Step 2)
                  </Button>
                </form>
              )}

              {/* STEP 2: DYNAMIC ACADEMIC STRUCTURE SETUP */}
              {regStep === 2 && (
                <form onSubmit={handleCollegeRegister} className="space-y-4" noValidate>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <GraduationCap className="w-4 h-4 text-indigo-600" />
                        Degree Programs Offered
                      </div>
                      <button
                        type="button"
                        onClick={addCourse}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                        Add Degree / Course
                      </button>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Specify the degree programs (e.g. B.Tech, BCA, MBA), their respective branches/specializations, and active section divisions.
                    </p>
                  </div>

                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {regCourses.map((course, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3"
                      >
                        {/* Course Header */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex-1 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                              {cIdx + 1}
                            </span>
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                                Program / Course Name
                              </label>
                              <input
                                type="text"
                                required
                                value={course.courseName}
                                onChange={(e) => updateCourseName(cIdx, e.target.value)}
                                placeholder="e.g. B.Tech, BCA, M.Tech, MBA"
                                className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                              />
                            </div>
                          </div>

                          {regCourses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCourse(cIdx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer mt-3"
                              title="Delete Course"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Branches Container */}
                        <div className="space-y-2.5 pl-2 border-l-2 border-indigo-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                              <Layers className="w-3 h-3 text-indigo-500" />
                              Branches in {course.courseName || `Program #${cIdx + 1}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => addBranch(cIdx)}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              Add Branch
                            </button>
                          </div>

                          {course.branches.map((branch, bIdx) => {
                            const key = `${cIdx}_${bIdx}`;
                            return (
                              <div
                                key={bIdx}
                                className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-lg space-y-2"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      required
                                      value={branch.branchName}
                                      onChange={(e) => updateBranchName(cIdx, bIdx, e.target.value)}
                                      placeholder="Branch Name (e.g. Computer Science, AI & DS, ECE)"
                                      className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                                    />
                                  </div>

                                  <div className="w-28 shrink-0 flex items-center gap-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">
                                      Secs:
                                    </label>
                                    <select
                                      value={branch.sections.length}
                                      onChange={(e) => updateBranchSectionCount(cIdx, bIdx, e.target.value)}
                                      className="w-full px-2 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                      {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                                        <option key={num} value={num}>
                                          {num} {num === 1 ? "Sec" : "Secs"}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {course.branches.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeBranch(cIdx, bIdx)}
                                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                                      title="Remove Branch"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                {/* Active Section Badges & Custom Section Input */}
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                  <span className="text-[10px] text-slate-400 font-semibold mr-1">
                                    Sections:
                                  </span>
                                  {branch.sections.map((sec, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-[11px] font-bold"
                                    >
                                      {sec}
                                      {branch.sections.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeSection(cIdx, bIdx, sIdx)}
                                          className="text-indigo-400 hover:text-rose-600 cursor-pointer ml-0.5 font-bold"
                                          title="Remove Section"
                                        >
                                          ×
                                        </button>
                                      )}
                                    </span>
                                  ))}

                                  <div className="inline-flex items-center gap-1">
                                    <input
                                      type="text"
                                      placeholder="+ Section"
                                      value={customSecInput[key] || ""}
                                      onChange={(e) =>
                                        setCustomSecInput((prev) => ({
                                          ...prev,
                                          [key]: e.target.value
                                        }))
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          addCustomSection(cIdx, bIdx);
                                        }
                                      }}
                                      className="w-16 px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    {Boolean(customSecInput[key]) && (
                                      <button
                                        type="button"
                                        onClick={() => addCustomSection(cIdx, bIdx)}
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 px-1"
                                      >
                                        Add
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading}
                      onClick={() => setRegStep(1)}
                      icon={ChevronLeft}
                      iconPosition="left"
                    >
                      Back
                    </Button>

                    <Button
                      type="submit"
                      loading={loading}
                      disabled={loading}
                      className="flex-1 py-2.5"
                      icon={Building2}
                      iconPosition="left"
                    >
                      {loading ? "Registering Institution..." : "Complete Registration & Launch"}
                    </Button>
                  </div>
                </form>
              )}

              <div className="pt-3 text-center text-xs text-slate-500">
                Already registered with SIPS?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setRegStep(1);
                  }}
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
