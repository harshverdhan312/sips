import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  GraduationCap,
  Briefcase,
  Code2,
  Award,
  GitBranch,
  Edit2,
  Check,
  Plus,
  Trash2,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { studentService } from "../../services/studentService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { DashboardSkeleton } from "../../components/common/LoadingSkeleton";
import { useNotifications } from "../../context/NotificationContext";

export function StudentProfilePage() {
  const { showSuccess, showError, showWarning } = useNotifications();
  const [student, setStudent] = useState(null);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [isEditingGithub, setIsEditingGithub] = useState(false);
  const [skillsList, setSkillsList] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [githubHandle, setGithubHandle] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await studentService.getCurrentStudent();
      if (data) {
        setStudent(data);
        setSkillsList(data.skills || []);
        setGithubHandle(data.github || "");
      }
    }
    load();
  }, []);

  if (!student) return <DashboardSkeleton />;

  const handleSaveSkills = async () => {
    setSaving(true);
    try {
      await studentService.updateCurrentStudent({ skills: skillsList, github: githubHandle });
      const updated = await studentService.getCurrentStudent();
      setStudent(updated);
      setIsEditingSkills(false);
      showSuccess("Profile updated successfully.");
    } catch (e) {
      console.error(e);
      showError(e.message || "Failed to save skills. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGithub = async () => {
    setSaving(true);
    try {
      await studentService.updateCurrentStudent({ skills: skillsList, github: githubHandle });
      const updated = await studentService.getCurrentStudent();
      setStudent(updated);
      setIsEditingGithub(false);
      showSuccess("Profile updated successfully.");
    } catch (e) {
      console.error(e);
      showError(e.message || "Failed to save GitHub handle. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
      showSuccess("Resume uploaded successfully.");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to process the uploaded file.");
    } finally {
      setUploadingResume(false);
    }
  };

  const initials = (student.name || "ST")
    .trim()
    .split(/\s+/)
    .map((n) => n[0] || "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Profile Hero Card */}
      <Card className="overflow-hidden border-slate-200">
        <div className="h-28 sm:h-32 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 relative" />
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="-mt-12 sm:-mt-14 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-indigo-600 text-white text-xl sm:text-2xl font-extrabold flex items-center justify-center border-4 border-white shadow-md shrink-0 relative z-10">
                {initials}
              </div>
              <div className="pt-1 sm:pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900">{student.name}</h1>
                  <Badge variant={student.readinessScore >= 80 ? "success" : (student.readinessScore >= 60 ? "primary" : "neutral")} size="sm">
                    {student.status}
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  USN: {student.usn} • {student.branch} ({student.batch})
                </p>
              </div>
            </div>
          </div>

          {/* Quick Contact & Verification Badges */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {student.email}
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-indigo-700">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> CGPA: {student.cgpa > 0 ? student.cgpa.toFixed(2) : "N/A"}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Status: {student.placementStatus}
            </span>
          </div>
        </div>
      </Card>

      {/* 2-Column Grid: Skills Management & Connected Handles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verified Technical Skills */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Verified Technical Skills</h3>
              <p className="text-xs text-slate-500">Skills are used by the placement matching engine to compute drive match scores</p>
            </div>
            {!isEditingSkills ? (
              <Button
                variant="outline"
                size="xs"
                icon={Edit2}
                onClick={() => setIsEditingSkills(true)}
              >
                Edit Skills
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setSkillsList(student.skills || []);
                    setIsEditingSkills(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="xs"
                  icon={Check}
                  loading={saving}
                  onClick={handleSaveSkills}
                >
                  Save
                </Button>
              </div>
            )}
          </div>

          {isEditingSkills && (
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="Add skill (e.g. Flutter, Go, Python)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newSkill.trim()) {
                    e.preventDefault();
                    if (!skillsList.includes(newSkill.trim())) {
                      setSkillsList([...skillsList, newSkill.trim()]);
                    }
                    setNewSkill("");
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
              />
              <Button
                variant="primary"
                size="xs"
                icon={Plus}
                onClick={() => {
                  if (newSkill.trim() && !skillsList.includes(newSkill.trim())) {
                    setSkillsList([...skillsList, newSkill.trim()]);
                    setNewSkill("");
                  }
                }}
              >
                Add
              </Button>
            </div>
          )}

          {skillsList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skillsList.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {skill}
                  {isEditingSkills && (
                    <button
                      onClick={() => setSkillsList(skillsList.filter((_, i) => i !== index))}
                      className="ml-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
              No verified technical skills added yet. Click "Edit Skills" to add your programming languages and frameworks.
            </div>
          )}
        </Card>

        {/* GitHub & Connected Handles */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Connected Accounts</h3>
              <p className="text-xs text-slate-500">Repository and project handles connected to your student profile</p>
            </div>
            {!isEditingGithub ? (
              <Button
                variant="outline"
                size="xs"
                icon={Edit2}
                onClick={() => setIsEditingGithub(true)}
              >
                Edit GitHub
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setGithubHandle(student.github || "");
                    setIsEditingGithub(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="xs"
                  icon={Check}
                  loading={saving}
                  onClick={handleSaveGithub}
                >
                  Save
                </Button>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-indigo-600" /> GitHub Profile
              </span>
              <Badge variant={student.github ? "success" : "neutral"} size="sm">
                {student.github ? "Linked" : "Not Linked"}
              </Badge>
            </div>

            {isEditingGithub ? (
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="GitHub username (e.g. candidate-dev)..."
                  value={githubHandle}
                  onChange={(e) => setGithubHandle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-600">
                {student.github ? (
                  <span className="font-semibold text-slate-900">@{student.github}</span>
                ) : (
                  <span className="text-slate-400">No GitHub handle linked yet</span>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Resume Hub */}
      <Card>
        <CardHeader
          title="Placement Resume"
          subtitle="Upload your verified PDF resume for one-click campus drive applications"
        />

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                {student.resumeUrl ? student.resumeUrl.split("/").pop() : "No Resume Uploaded"}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {student.resumeUrl ? "Stored on placement server • Ready for campus drives" : "Upload PDF format (Max 5MB)"}
              </p>
            </div>
          </div>

          <div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleResumeUpload}
                disabled={uploadingResume}
              />
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                <Upload className="w-3.5 h-3.5" />
                {uploadingResume ? "Uploading..." : (student.resumeUrl ? "Replace PDF Resume" : "Upload PDF Resume")}
              </span>
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
}
