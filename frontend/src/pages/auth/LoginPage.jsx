import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2,
  ArrowRight,
  Lock,
  Mail,
  User,
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
  ShieldCheck,
  Phone,
  MapPin,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";

export function LoginPage({ initialRegisterMode = false }) {
  const { login, studentLogin, institutionLogin, onboardUniversity, registerCollege } = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Mode: Sign In vs Onboard / Register
  const [isRegisterMode, setIsRegisterMode] = useState(() => {
    return initialRegisterMode || searchParams?.get("mode") === "onboard";
  });
  const [onboardType, setOnboardType] = useState("university"); // "university" | "legacy_college"

  // TWO CLEAR SIGN-IN OPTIONS: "student" | "institution"
  const [signInTab, setSignInTab] = useState("student");

  // Student Sign In states
  const [studentId, setStudentId] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentRemember, setStudentRemember] = useState(true);
  const [studentErrors, setStudentErrors] = useState({});

  // University / Department Sign In states
  const [deptUsername, setDeptUsername] = useState("");
  const [deptPassword, setDeptPassword] = useState("");
  const [showDeptPassword, setShowDeptPassword] = useState(false);
  const [deptRemember, setDeptRemember] = useState(true);
  const [deptErrors, setDeptErrors] = useState({});

  // Forgot Password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // STEP 1: UNIVERSITY / INSTITUTE ONBOARDING STATES
  const [univForm, setUnivForm] = useState({
    name: "",
    code: "",
    officialEmail: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    website: "",
    phone: "",
    adminName: "",
    adminUsername: "",
    adminPassword: "",
    confirmPassword: ""
  });
  const [univErrors, setUnivErrors] = useState({});
  const [showUnivPassword, setShowUnivPassword] = useState(false);
  const [showUnivConfirmPassword, setShowUnivConfirmPassword] = useState(false);

  // Legacy College Register states (preserved for backward compatibility)
  const [regStep, setRegStep] = useState(1);
  const [regCollegeName, setRegCollegeName] = useState("");
  const [regCollegeSlug, setRegCollegeSlug] = useState("");
  const [regAdminEmail, setRegAdminEmail] = useState("");
  const [regMasterPassword, setRegMasterPassword] = useState("");
  const [regConfirmMasterPassword, setRegConfirmMasterPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regAcceptedDomains, setRegAcceptedDomains] = useState("");
  const [regErrors, setRegErrors] = useState({});
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

  // =========================================================================
  // STUDENT SIGN IN SUBMIT
  // =========================================================================
  const handleStudentSignInSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const trimmedId = studentId.trim();

    if (!trimmedId) {
      newErrors.identifier = "Please enter your institutional email or Roll No / USN.";
    } else if (trimmedId.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedId)) {
        newErrors.identifier = "Please enter a valid email address.";
      }
    }

    if (!studentPassword) {
      newErrors.password = "Please enter your password.";
    }

    if (Object.keys(newErrors).length > 0) {
      setStudentErrors(newErrors);
      showWarning("Email/ID and password are required.");
      return;
    }

    setStudentErrors({});
    setLoading(true);
    try {
      const result = await studentLogin(trimmedId, studentPassword);
      showSuccess(`Login successful. Welcome back, ${result.user?.name || "Student"}!`);
      navigate("/student/dashboard");
    } catch (err) {
      const msg = err.message || "Invalid email or password.";
      setStudentErrors({ general: msg });
      setStudentPassword("");
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // UNIVERSITY / DEPARTMENT SIGN IN SUBMIT
  // =========================================================================
  const handleDepartmentSignInSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const trimmedUser = deptUsername.trim();

    if (!trimmedUser) {
      newErrors.username = "Please enter your username.";
    }
    if (!deptPassword) {
      newErrors.password = "Please enter your password.";
    }

    if (Object.keys(newErrors).length > 0) {
      setDeptErrors(newErrors);
      showWarning("Username and password are required.");
      return;
    }

    setDeptErrors({});
    setLoading(true);
    try {
      const result = await institutionLogin(trimmedUser, deptPassword);
      showSuccess(`Login successful. Welcome back, ${result.user?.name || trimmedUser}!`);

      if (result.role === "university_admin" || result.user?.backendRole === "MAIN_UNIVERSITY_ADMIN" || result.user?.backendRole === "UNIVERSITY_ADMIN") {
        // Main University Admin logged in -> University Admin Dashboard
        navigate("/institution/dashboard");
      } else {
        // Department Admin logged in -> existing SIPS department dashboard
        navigate("/placement/dashboard");
      }
    } catch (err) {
      const msg = err.message || "Invalid email or password.";
      setDeptErrors({ general: msg });
      setDeptPassword("");
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // UNIVERSITY ONBOARDING SUBMIT (STEP 1)
  // =========================================================================
  const handleUniversityOnboardSubmit = async (e) => {
    e.preventDefault();
    const errs = {};

    if (!univForm.name.trim()) errs.name = "University / Institute name is required.";
    if (!univForm.officialEmail.trim()) {
      errs.officialEmail = "Official institutional email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(univForm.officialEmail.trim())) {
        errs.officialEmail = "Please enter a valid email address.";
      }
    }
    if (!univForm.address.trim()) errs.address = "Address is required.";
    if (!univForm.city.trim()) errs.city = "City is required.";
    if (!univForm.state.trim()) errs.state = "State is required.";
    if (!univForm.adminName.trim()) errs.adminName = "Main administrator name is required.";
    if (!univForm.adminUsername.trim()) {
      errs.adminUsername = "Main administrator username is required.";
    } else if (univForm.adminUsername.trim().length < 3) {
      errs.adminUsername = "Username must be at least 3 characters.";
    }
    if (!univForm.adminPassword) {
      errs.adminPassword = "Password is required.";
    } else if (univForm.adminPassword.length < 4) {
      errs.adminPassword = "Password must be at least 4 characters.";
    }
    if (univForm.adminPassword !== univForm.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errs).length > 0) {
      setUnivErrors(errs);
      showWarning("Please resolve all required fields before continuing.");
      return;
    }

    setUnivErrors({});
    setLoading(true);
    try {
      await onboardUniversity({
        name: univForm.name.trim(),
        officialEmail: univForm.officialEmail.toLowerCase().trim(),
        address: univForm.address.trim(),
        city: univForm.city.trim(),
        state: univForm.state.trim(),
        country: univForm.country.trim() || "India",
        website: univForm.website.trim(),
        phone: univForm.phone.trim(),
        code: univForm.code.trim().toUpperCase(),
        adminName: univForm.adminName.trim(),
        adminUsername: univForm.adminUsername.toLowerCase().trim(),
        adminPassword: univForm.adminPassword
      });

      showSuccess(`University "${univForm.name.trim()}" onboarded successfully! Welcome to the University Admin Dashboard.`);
      // Step 1 target requirement: Open UNIVERSITY ADMIN DASHBOARD directly
      navigate("/institution/dashboard");
    } catch (err) {
      const msg = err.message || "University onboarding failed.";
      setUnivErrors({ general: msg });
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handler
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

  // Legacy single college register helpers
  const handleProceedToAcademicSetup = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const newErrors = {};
    if (!regCollegeName.trim()) newErrors.name = "Institution name is required.";
    if (!regCollegeSlug.trim()) newErrors.slug = "Institution slug is required.";
    if (!regAdminEmail.trim()) newErrors.adminEmail = "Admin email is required.";
    if (!regMasterPassword) newErrors.masterPassword = "Password is required.";
    if (regMasterPassword !== regConfirmMasterPassword) newErrors.confirmPassword = "Passwords do not match.";

    const domains = regAcceptedDomains.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
    if (domains.length === 0) newErrors.domains = "Provide at least one domain.";

    if (Object.keys(newErrors).length > 0) {
      setRegErrors(newErrors);
      showWarning("Please complete details before continuing.");
      return;
    }
    setRegErrors({});
    setRegStep(2);
  };

  const handleCollegeRegister = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    try {
      const cleanAcademicStructure = regCourses.map((c) => ({
        courseName: c.courseName.trim(),
        branches: c.branches.map((b) => ({
          branchName: b.branchName.trim(),
          sections: b.sections.map((s) => String(s).trim()).filter(Boolean)
        })).filter((b) => b.branchName)
      })).filter((c) => c.courseName);

      const domains = regAcceptedDomains.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);

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
      const msg = err.message || "Registration failed.";
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
            className="h-16 w-auto max-w-[280px] sm:max-w-[320px] object-contain cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-600 max-w-sm mx-auto">
          AI-powered career intelligence platform reducing Data Blindness in campus placements.
        </p>
      </div>

      <div
        className={`mt-6 sm:mx-auto sm:w-full transition-all duration-300 ${
          isRegisterMode ? "sm:max-w-xl" : "sm:max-w-md"
        }`}
      >
        {/* Main Auth Card */}
        <div className="bg-white py-6 px-6 sm:px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          {/* Top Toggle: Sign In vs University Onboarding */}
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
              onClick={() => {
                setIsRegisterMode(true);
                setOnboardType("university");
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isRegisterMode
                  ? "bg-white text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              University Onboarding
            </button>
          </div>

          {/* ========================================================================= */}
          {/* STEP 5: TWO CLEAR SIGN-IN OPTIONS (STUDENT vs DEPARTMENT)                 */}
          {/* ========================================================================= */}
          {!isRegisterMode && (
            <div>
              {/* Distinct Sign-In Selector Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setSignInTab("student")}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    signInTab === "student"
                      ? "bg-white text-indigo-700 shadow-xs border border-indigo-100"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Student Sign In
                </button>

                <button
                  type="button"
                  onClick={() => setSignInTab("department")}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    signInTab === "department"
                      ? "bg-white text-indigo-700 shadow-xs border border-indigo-100"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  University / Department Sign In
                </button>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* OPTION 1: STUDENT SIGN IN FORM                                    */}
              {/* ----------------------------------------------------------------- */}
              {signInTab === "student" && (
                <form onSubmit={handleStudentSignInSubmit} className="space-y-4" noValidate>
                  {studentErrors.general && (
                    <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{studentErrors.general}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2 p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100/80 text-xs text-indigo-900 leading-snug">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Student Candidates:</strong> Sign in with your registered student email or institutional Roll No / USN.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Student Email or Roll No / USN *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        disabled={loading}
                        value={studentId}
                        onChange={(e) => {
                          setStudentId(e.target.value);
                          if (studentErrors.identifier || studentErrors.general) {
                            setStudentErrors((prev) => ({ ...prev, identifier: "", general: "" }));
                          }
                        }}
                        placeholder="e.g. 1RV21CS001 or student@rvce.edu"
                        className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                          studentErrors.identifier
                            ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                            : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                        } ${loading ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    {studentErrors.identifier && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {studentErrors.identifier}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showStudentPassword ? "text" : "password"}
                        required
                        disabled={loading}
                        value={studentPassword}
                        onChange={(e) => {
                          setStudentPassword(e.target.value);
                          if (studentErrors.password || studentErrors.general) {
                            setStudentErrors((prev) => ({ ...prev, password: "", general: "" }));
                          }
                        }}
                        placeholder="••••••••"
                        className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                          studentErrors.password
                            ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                            : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                        } ${loading ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowStudentPassword(!showStudentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        tabIndex={-1}
                        aria-label={showStudentPassword ? "Hide password" : "Show password"}
                      >
                        {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {studentErrors.password && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {studentErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={studentRemember}
                        disabled={loading}
                        onChange={(e) => setStudentRemember(e.target.checked)}
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
                    {loading ? "Signing In..." : "Student Sign In"}
                  </Button>
                </form>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* OPTION 2: DEPARTMENT SIGN IN FORM                                 */}
              {/* ----------------------------------------------------------------- */}
              {signInTab === "department" && (
                <form onSubmit={handleDepartmentSignInSubmit} className="space-y-4" noValidate>
                  {deptErrors.general && (
                    <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{deptErrors.general}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2 p-2.5 bg-purple-50/70 rounded-xl border border-purple-100/80 text-xs text-purple-900 leading-snug">
                    <Building2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>University & Department Admins:</strong> Sign in with your university administrator username or provisioned department username.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Username or ID *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        disabled={loading}
                        value={deptUsername}
                        onChange={(e) => {
                          setDeptUsername(e.target.value);
                          if (deptErrors.username || deptErrors.general) {
                            setDeptErrors((prev) => ({ ...prev, username: "", general: "" }));
                          }
                        }}
                        placeholder="e.g. abc_admin (University) or abc_bca (Department)"
                        className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 ${
                          deptErrors.username
                            ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                            : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                        } ${loading ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    {deptErrors.username && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {deptErrors.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showDeptPassword ? "text" : "password"}
                        required
                        disabled={loading}
                        value={deptPassword}
                        onChange={(e) => {
                          setDeptPassword(e.target.value);
                          if (deptErrors.password || deptErrors.general) {
                            setDeptErrors((prev) => ({ ...prev, password: "", general: "" }));
                          }
                        }}
                        placeholder="••••••••"
                        className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                          deptErrors.password
                            ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                            : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                        } ${loading ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeptPassword(!showDeptPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        tabIndex={-1}
                        aria-label={showDeptPassword ? "Hide password" : "Show password"}
                      >
                        {showDeptPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {deptErrors.password && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {deptErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deptRemember}
                        disabled={loading}
                        onChange={(e) => setDeptRemember(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      Remember session
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Credentials managed by University Admin
                    </span>
                  </div>

                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                    className="w-full py-2.5 mt-1 bg-indigo-600 hover:bg-indigo-700"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    {loading ? "Authenticating..." : "University / Department Sign In"}
                  </Button>
                </form>
              )}

              <div className="pt-4 border-t border-slate-100 mt-4 text-center text-xs text-slate-500">
                Need to register your university or institute?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setOnboardType("university");
                  }}
                  className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Onboard University here
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: UNIVERSITY / INSTITUTE ONBOARDING FORM                            */}
          {/* ========================================================================= */}
          {isRegisterMode && onboardType === "university" && (
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    University / Institute Onboarding
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Institutional Tier
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Register your institution and main administrator credentials to manage academic units.
                </p>
              </div>

              {univErrors.general && (
                <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 animate-in fade-in duration-200 mb-3">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{univErrors.general}</span>
                </div>
              )}

              <form onSubmit={handleUniversityOnboardSubmit} className="space-y-3" noValidate>
                {/* Institutional Information Header */}
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-1 border-t border-slate-100 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-indigo-500" />
                  Institutional Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      University / Institute Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ABC University"
                      value={univForm.name}
                      onChange={(e) => setUnivForm({ ...univForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                    {univErrors.name && (
                      <p className="text-[11px] font-medium text-rose-600 mt-0.5">{univErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Code (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ABCU"
                      value={univForm.code}
                      onChange={(e) => setUnivForm({ ...univForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Official Institutional Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="registrar@abc.edu"
                        value={univForm.officialEmail}
                        onChange={(e) => setUnivForm({ ...univForm, officialEmail: e.target.value })}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                    {univErrors.officialEmail && (
                      <p className="text-[11px] font-medium text-rose-600 mt-0.5">{univErrors.officialEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Official Website (Optional)
                    </label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="https://abc.edu"
                        value={univForm.website}
                        onChange={(e) => setUnivForm({ ...univForm, website: e.target.value })}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Campus Address *
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. University Hills, Ring Road"
                      value={univForm.address}
                      onChange={(e) => setUnivForm({ ...univForm, address: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                  {univErrors.address && (
                    <p className="text-[11px] font-medium text-rose-600 mt-0.5">{univErrors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bengaluru"
                      value={univForm.city}
                      onChange={(e) => setUnivForm({ ...univForm, city: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                    {univErrors.city && (
                      <p className="text-[11px] font-medium text-rose-600 mt-0.5">{univErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Karnataka"
                      value={univForm.state}
                      onChange={(e) => setUnivForm({ ...univForm, state: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                    {univErrors.state && (
                      <p className="text-[11px] font-medium text-rose-600 mt-0.5">{univErrors.state}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      placeholder="India"
                      value={univForm.country}
                      onChange={(e) => setUnivForm({ ...univForm, country: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Main Administrator Credentials Section */}
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2 border-t border-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-indigo-500" />
                  Main University Administrator Account
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Admin Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. John Doe"
                      value={univForm.adminName}
                      onChange={(e) => setUnivForm({ ...univForm, adminName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                    {univErrors.adminName && (
                      <p className="text-[11px] font-medium text-rose-600 mt-0.5">{univErrors.adminName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Admin Username *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. abc_admin"
                      value={univForm.adminUsername}
                      onChange={(e) =>
                        setUnivForm({
                          ...univForm,
                          adminUsername: e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, "")
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                    {univErrors.adminUsername && (
                      <p className="text-[11px] font-medium text-rose-600 mt-0.5">{univErrors.adminUsername}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showUnivPassword ? "text" : "password"}
                        required
                        minLength={4}
                        placeholder="••••••••"
                        value={univForm.adminPassword}
                        onChange={(e) => setUnivForm({ ...univForm, adminPassword: e.target.value })}
                        className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUnivPassword(!showUnivPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        tabIndex={-1}
                        aria-label={showUnivPassword ? "Hide password" : "Show password"}
                      >
                        {showUnivPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {univErrors.adminPassword && (
                      <p className="text-[11px] font-medium text-rose-600 mt-0.5">{univErrors.adminPassword}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showUnivConfirmPassword ? "text" : "password"}
                        required
                        minLength={4}
                        placeholder="••••••••"
                        value={univForm.confirmPassword}
                        onChange={(e) => setUnivForm({ ...univForm, confirmPassword: e.target.value })}
                        className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUnivConfirmPassword(!showUnivConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        tabIndex={-1}
                        aria-label={showUnivConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showUnivConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {univErrors.confirmPassword && (
                      <p className="text-[11px] font-medium text-rose-600 mt-0.5">{univErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 leading-snug">
                  After onboarding, you will access the <strong>University Admin Dashboard</strong> to create and manage independent accounts for your departments (BBA, BCA, MBA, etc.).
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 font-bold"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  {loading ? "Onboarding University..." : "Complete Onboarding & Open Dashboard"}
                </Button>

                <div className="pt-2 text-center text-xs text-slate-500 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(false)}
                    className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnboardType("legacy_college")}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer text-[11px]"
                  >
                    Single-college wizard
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* LEGACY SINGLE COLLEGE REGISTRATION (PRESERVED)                            */}
          {/* ========================================================================= */}
          {isRegisterMode && onboardType === "legacy_college" && (
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    College Onboarding Portal
                  </h3>
                  <button
                    type="button"
                    onClick={() => setOnboardType("university")}
                    className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Switch to University Onboarding
                  </button>
                </div>
              </div>

              {regStep === 1 && (
                <form onSubmit={handleProceedToAcademicSetup} className="space-y-3">
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Slug *
                      </label>
                      <input
                        type="text"
                        required
                        value={regCollegeSlug}
                        onChange={(e) => setRegCollegeSlug(e.target.value)}
                        placeholder="rvce"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
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
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Accepted Domains *
                    </label>
                    <input
                      type="text"
                      required
                      value={regAcceptedDomains}
                      onChange={(e) => setRegAcceptedDomains(e.target.value)}
                      placeholder="rvce.edu"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? "text" : "password"}
                          required
                          value={regMasterPassword}
                          onChange={(e) => setRegMasterPassword(e.target.value)}
                          className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                          tabIndex={-1}
                          aria-label={showRegPassword ? "Hide password" : "Show password"}
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Confirm *
                      </label>
                      <div className="relative">
                        <input
                          type={showRegConfirmPassword ? "text" : "password"}
                          required
                          value={regConfirmMasterPassword}
                          onChange={(e) => setRegConfirmMasterPassword(e.target.value)}
                          className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                          tabIndex={-1}
                          aria-label={showRegConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full py-2.5 mt-2">
                    Continue to Academic Setup
                  </Button>
                </form>
              )}

              {regStep === 2 && (
                <form onSubmit={handleCollegeRegister} className="space-y-4">
                  <p className="text-xs text-slate-600">Dynamic academic structure ready.</p>
                  <Button type="submit" loading={loading} className="w-full py-2.5">
                    Complete Registration
                  </Button>
                </form>
              )}

              <div className="pt-3 text-center text-xs">
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
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Multi-Unit Hierarchy
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Isolated Placement Drives
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
