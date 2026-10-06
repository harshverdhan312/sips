import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Target,
  FileText,
  Mic,
  Award,
  ArrowRight,
  Activity,
  Code,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Briefcase,
  UploadCloud,
  Layers,
  RefreshCw
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { studentService } from "../../services/studentService";
import { StatCard } from "../../components/common/StatCard";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { ProbabilityGauge } from "../../components/charts/ProbabilityGauge";
import { RadarSkillChart } from "../../components/charts/RadarSkillChart";
import { DashboardSkeleton } from "../../components/common/LoadingSkeleton";
import { useNotifications } from "../../context/NotificationContext";

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const fileInputRef = useRef(null);
  const [student, setStudent] = useState(null);
  const [radarData, setRadarData] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [studentData, radar, jobList] = await Promise.all([
          studentService.getCurrentStudent().catch(() => null),
          studentService.getRadarData().catch(() => []),
          studentService.getStudentJobs().catch(() => [])
        ]);
        if (studentData) {
          setStudent(studentData);
        } else if (user) {
          setStudent({
            id: user.id,
            name: user.name || "Student Candidate",
            email: user.email || "",
            rollNo: user.rollNo || "",
            branch: user.branch || "Computer Science",
            semester: "Campus Student",
            cgpa: user.cgpa || 0.0,
            placementStatus: "Not Placed",
            status: "Active",
            readinessScore: 0,
            skills: user.skills || [],
            resumeUrl: user.resumeUrl || "",
            github: user.github || "",
            metrics: {
              placementProbability: 0,
              technicalScore: 0,
              softSkillScore: 0,
              resumeScore: 0,
              employabilityIndex: 0
            }
          });
        }
        setRadarData(Array.isArray(radar) ? radar : []);
        const activeRunningJobs = Array.isArray(jobList) ? jobList.filter((j) => j && j.isActive) : [];
        setJobs(activeRunningJobs.slice(0, 4));
      } catch (err) {
        console.error("Student dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const currentStudent = student || (user ? {
    id: user.id,
    name: user.name || "Student Candidate",
    email: user.email || "",
    rollNo: user.rollNo || "",
    branch: user.branch || "Computer Science",
    semester: "Campus Student",
    cgpa: 0.0,
    placementStatus: "Not Placed",
    status: "Active",
    readinessScore: 0,
    skills: [],
    resumeUrl: "",
    github: "",
    metrics: {
      placementProbability: 0,
      technicalScore: 0,
      softSkillScore: 0,
      resumeScore: 0,
      employabilityIndex: 0
    }
  } : null);

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showError("Please upload a valid PDF resume.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError("File size exceeds the allowed limit.");
      return;
    }

    setUploadingResume(true);
    try {
      await studentService.uploadResume(file);
      const updated = await studentService.getCurrentStudent();
      setStudent(updated);
      showSuccess("Resume uploaded successfully! Any detected skills have been added to your profile.");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to process the uploaded file.");
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading && !currentStudent) {
    return <DashboardSkeleton />;
  }

  if (!currentStudent) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Student Profile Not Available</h2>
        <p className="text-sm text-slate-500">
          Please log in again or check your network connection to access the placement portal.
        </p>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    );
  }

  const metrics = currentStudent.metrics || {
    placementProbability: 0,
    technicalScore: 0,
    softSkillScore: 0,
    resumeScore: 0,
    employabilityIndex: 0
  };

  const studentSkills = Array.isArray(currentStudent.skills) ? currentStudent.skills : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/10 font-mono">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Campus Placement Portal Active
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Welcome back, {currentStudent.name ? currentStudent.name.split(" ")[0] : "Student"}
            </h1>
            <p className="text-sm sm:text-base text-indigo-200 max-w-xl">
              {currentStudent.branch ? `${currentStudent.branch} • ${currentStudent.semester || "Candidate"}` : "Live student placement dashboard"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="md"
              icon={Briefcase}
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-900/40"
              onClick={() => navigate("/student/jobs")}
            >
              Explore Placement Drives
            </Button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 -bottom-10 w-96 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />

        {/* Hidden File Input for Resume Upload */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,application/pdf"
          onChange={handleResumeUpload}
        />
      </div>

      {/* Main Metric Cards - Enlarged and spacious layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
        <StatCard
          title="Readiness Score"
          value={currentStudent.resumeUrl ? `${currentStudent.readinessScore || 0}/100` : "Pending Resume"}
          icon={TrendingUp}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Placement Probability"
          value={currentStudent.resumeUrl ? `${metrics.placementProbability || 0}%` : "Not Evaluated"}
          icon={Target}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Technical Score"
          value={currentStudent.resumeUrl && (metrics.technicalScore || 0) > 0 ? `${metrics.technicalScore}/100` : "Not evaluated"}
          icon={Code}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Soft Skills Score"
          value={currentStudent.resumeUrl && (metrics.softSkillScore || 0) > 0 ? `${metrics.softSkillScore}/100` : "Not evaluated"}
          icon={Mic}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Resume Score"
          value={currentStudent.resumeUrl ? ((metrics.resumeScore || 0) > 0 ? `${metrics.resumeScore}/100` : "Uploaded") : "Pending Resume"}
          icon={FileText}
          iconBg="bg-sky-50 text-sky-600"
        />
        <StatCard
          title="Academic CGPA"
          value={typeof currentStudent.cgpa === "number" && currentStudent.cgpa > 0 ? currentStudent.cgpa.toFixed(2) : "Not Set"}
          icon={Award}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* 2-Column Row: Placement Probability Gauge & Radar Skill Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Placement Probability Breakdown Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader
            title="Placement Readiness Index"
            subtitle="Computed from your verified profile metrics"
            action={
              <Badge variant={(currentStudent.readinessScore || 0) >= 80 ? "success" : ((currentStudent.readinessScore || 0) >= 60 ? "primary" : "neutral")} size="sm">
                {currentStudent.status || "Active"}
              </Badge>
            }
          />
          <div className="py-2">
            <ProbabilityGauge probability={metrics.placementProbability || 0} />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Placement Status:</span>
              <span className="font-semibold text-slate-800">{currentStudent.placementStatus || "Not Placed"}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Resume Synchronization:</span>
              <span className="font-semibold text-slate-800">{currentStudent.resumeUrl ? "Synced" : "Upload required"}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Verified Technical Skills:</span>
              <span className="font-semibold text-slate-800">{studentSkills.length} skills</span>
            </div>
          </div>
        </Card>

        {/* Radar Skill Intelligence */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Readiness Dimension Telemetry"
            subtitle="Holistic performance metrics synced with backend profile"
            action={
              <Button
                variant="ghost"
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => navigate("/student/skills")}
              >
                View Skills
              </Button>
            }
          />
          <RadarSkillChart data={radarData} height={280} />
        </Card>
      </div>

      {/* Verified Skills & Profile Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verified Technical Skills */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-base">
                  Verified Technical Skills
                </h3>
                <p className="text-xs text-slate-500">Source: GET /api/student/profile</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => navigate("/student/profile")}
            >
              Edit Skills
            </Button>
          </div>

          {studentSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {studentSkills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
              <p className="text-xs text-slate-600 font-medium mb-3">
                {currentStudent.resumeUrl
                  ? "No verified technical skills added yet."
                  : "No verified strengths yet. Upload your resume to analyze your skills."}
              </p>
              <Button
                variant="primary"
                size="xs"
                onClick={() => {
                  if (currentStudent.resumeUrl) navigate("/student/profile");
                  else if (fileInputRef.current) fileInputRef.current.click();
                  else navigate("/student/profile");
                }}
                disabled={uploadingResume}
              >
                {uploadingResume ? "Uploading..." : currentStudent.resumeUrl ? "Add Skills in Profile" : "Upload Resume"}
              </Button>
            </div>
          )}
        </Card>

        {/* Profile Completion Checklist */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Placement Cell Profile Checklist
              </h3>
              <p className="text-xs text-slate-500">Required credentials for campus placement drives</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between border border-slate-100 text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${typeof currentStudent.cgpa === "number" && currentStudent.cgpa > 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span className="font-medium text-slate-700">Academic CGPA Verification</span>
              </div>
              <span className="font-semibold text-slate-900">{typeof currentStudent.cgpa === "number" && currentStudent.cgpa > 0 ? `${currentStudent.cgpa.toFixed(2)} CGPA` : "Pending"}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between border border-slate-100 text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${currentStudent.resumeUrl ? "bg-emerald-500" : "bg-rose-500"}`} />
                <span className="font-medium text-slate-700">Placement PDF Resume</span>
              </div>
              <span className="font-semibold text-slate-900">{currentStudent.resumeUrl ? "Uploaded & Synced" : "Not uploaded"}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between border border-slate-100 text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${currentStudent.github ? "bg-emerald-500" : "bg-slate-400"}`} />
                <span className="font-medium text-slate-700">GitHub Profile Handle</span>
              </div>
              <span className="font-semibold text-slate-900">{currentStudent.github || "Unlinked"}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between border border-slate-100 text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${studentSkills.length > 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span className="font-medium text-slate-700">Technical Skills Mapping</span>
              </div>
              <span className="font-semibold text-slate-900">{studentSkills.length > 0 ? `${studentSkills.length} skills verified` : "0 skills added"}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Upcoming Placement Drives */}
      <Card>
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Active Placement Opportunities</h3>
            <p className="text-xs text-slate-500">Live recruitment drives from GET /api/student/jobs</p>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() => navigate("/student/jobs")}
          >
            View All Drives
          </Button>
        </div>
        <div className="p-6 pt-2 space-y-3">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-base shrink-0">
                    {job.company.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{job.company}</h4>
                      <Badge
                        variant={
                          job.matchScore >= 80
                            ? "success"
                            : job.matchScore >= 60
                            ? "primary"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {job.matchScore}% Match
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{job.role}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                      <span className="font-semibold text-emerald-600">{job.ctc}</span>
                      <span>•</span>
                      <span>Min CGPA: {job.minCgpa}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5" /> Deadline: {job.deadline}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/student/jobs")}
                >
                  Explore Drive
                </Button>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No placement drives available right now.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
