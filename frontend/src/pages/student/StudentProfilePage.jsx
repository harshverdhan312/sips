import React, { useState, useEffect } from "react";
import {
  Mail,
  GraduationCap,
  Briefcase,
  GitBranch,
  Edit2,
  Check,
  Plus,
  Trash2,
  FileText,
  Upload,
  CheckCircle2,
  History,
  Home,
  Sparkles,
  Cpu,
  RefreshCw,
  Camera,
  X,
  Eye,
  Calendar
} from "lucide-react";
import Avatar from "../../components/common/Avatar";
import { studentService } from "../../services/studentService";
import { resolveAssetUrl } from "../../services/api";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { DashboardSkeleton } from "../../components/common/LoadingSkeleton";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";

export function StudentProfilePage() {
  const { showSuccess, showError, showWarning } = useNotifications();
  const { updateUser } = useAuth();
  const [student, setStudent] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [isEditingGithub, setIsEditingGithub] = useState(false);
  const [isEditingPlacement, setIsEditingPlacement] = useState(false);
  const [editAcademicModalOpen, setEditAcademicModalOpen] = useState(false);
  const [academicForm, setAcademicForm] = useState({
    name: "",
    branch: "",
    batch: "",
    cgpa: ""
  });
  const [savingAcademic, setSavingAcademic] = useState(false);
  const [skillsList, setSkillsList] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [githubHandle, setGithubHandle] = useState("");
  const [ageInput, setAgeInput] = useState("");
  const [internshipsInput, setInternshipsInput] = useState("");
  const [hostelInput, setHostelInput] = useState("");
  const [backlogsInput, setBacklogsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [calculatingPrediction, setCalculatingPrediction] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await studentService.getCurrentStudent();
      if (data) {
        setStudent(data);
        setAcademicForm({
          name: data.name || "",
          branch: data.branch || "",
          batch: data.batch || "",
          cgpa: data.cgpa > 0 ? String(data.cgpa) : ""
        });
        setSkillsList(data.skills || []);
        setGithubHandle(data.github || "");
        setAgeInput(data.age !== null && data.age !== undefined ? String(data.age) : "");
        setInternshipsInput(data.internships !== null && data.internships !== undefined ? String(data.internships) : "");
        setHostelInput(data.hostel === true ? "true" : (data.hostel === false ? "false" : ""));
        setBacklogsInput(data.historyOfBacklogs !== null && data.historyOfBacklogs !== undefined ? String(data.historyOfBacklogs) : "");
      }
      const pred = await studentService.getPlacementPrediction();
      if (pred) {
        setPrediction(pred);
      }
    }
    load();
  }, []);

  if (!student) return <DashboardSkeleton />;

  const handleSaveAcademic = async (e) => {
    e.preventDefault();
    if (!academicForm.name.trim()) {
      showError("Full name is required.");
      return;
    }

    let parsedCgpa = 0;
    if (academicForm.cgpa.trim() !== "") {
      const c = parseFloat(academicForm.cgpa);
      if (isNaN(c) || c < 0 || c > 10) {
        showError("Invalid CGPA: Must be a number between 0 and 10.");
        return;
      }
      parsedCgpa = Math.round(c * 100) / 100;
    }

    setSavingAcademic(true);
    try {
      await studentService.updateCurrentStudent({
        name: academicForm.name.trim(),
        branch: academicForm.branch.trim(),
        batch: academicForm.batch.trim(),
        cgpa: parsedCgpa
      });
      const updated = await studentService.getCurrentStudent();
      setStudent(updated);
      updateUser({ name: updated.name });
      setEditAcademicModalOpen(false);
      showSuccess("Academic profile updated successfully.");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to update academic profile.");
    } finally {
      setSavingAcademic(false);
    }
  };

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

  const handleSavePlacement = async () => {
    // Client-side validations
    let parsedAge = null;
    if (ageInput.trim() !== "") {
      const a = parseInt(ageInput.trim(), 10);
      if (isNaN(a) || a < 16 || a > 100) {
        showError("Invalid age: Age must be an integer between 16 and 100.");
        return;
      }
      parsedAge = a;
    }

    let parsedInternships = null;
    if (internshipsInput.trim() !== "") {
      const i = parseInt(internshipsInput.trim(), 10);
      if (isNaN(i) || i < 0 || i > 20) {
        showError("Invalid internships: Must be a non-negative integer between 0 and 20.");
        return;
      }
      parsedInternships = i;
    }

    let parsedHostel = null;
    if (hostelInput === "true") parsedHostel = true;
    else if (hostelInput === "false") parsedHostel = false;

    let parsedBacklogs = null;
    if (backlogsInput.trim() !== "") {
      const b = parseInt(backlogsInput.trim(), 10);
      if (isNaN(b) || b < 0 || b > 50) {
        showError("Invalid backlogs: Must be a non-negative integer between 0 and 50.");
        return;
      }
      parsedBacklogs = b;
    }

    setSaving(true);
    try {
      await studentService.updateCurrentStudent({
        age: parsedAge,
        internships: parsedInternships,
        hostel: parsedHostel,
        historyOfBacklogs: parsedBacklogs
      });
      const updated = await studentService.getCurrentStudent();
      setStudent(updated);
      setIsEditingPlacement(false);
      showSuccess("Placement information updated successfully.");
    } catch (e) {
      console.error(e);
      showError(e.message || "Failed to save placement information.");
    } finally {
      setSaving(false);
    }
  };

  const handleCalculatePrediction = async () => {
    setCalculatingPrediction(true);
    try {
      const res = await studentService.requestPlacementPrediction();
      if (res && res.prediction) {
        setPrediction(res.prediction);
        showSuccess("Placement likelihood prediction computed successfully!");
      } else {
        showError("Could not retrieve prediction result.");
      }
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to calculate placement prediction.");
    } finally {
      setCalculatingPrediction(false);
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
      const res = await studentService.uploadResume(file);
      const updated = await studentService.getCurrentStudent();
      setStudent(updated);
      setAcademicForm({
        name: updated.name || "",
        branch: updated.branch || "",
        batch: updated.batch || "",
        cgpa: updated.cgpa > 0 ? String(updated.cgpa) : ""
      });

      let feedback = "Resume uploaded successfully.";
      if (res?.extractedCgpa || res?.extractedBatch) {
        const parts = [];
        if (res.extractedCgpa) parts.push(`CGPA: ${res.extractedCgpa.toFixed(2)}`);
        if (res.extractedBatch) parts.push(`Graduation Year: ${res.extractedBatch}`);
        feedback += ` Extracted ${parts.join(" and ")} from resume.`;
      }
      showSuccess(feedback);
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to process the uploaded file.");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      showError("Please upload a valid image (JPEG, PNG, WebP, or GIF).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Image size exceeds the 5MB limit.");
      return;
    }

    setUploadingImage(true);
    try {
      const res = await studentService.uploadProfileImage(file);
      const updated = await studentService.getCurrentStudent();
      setStudent(updated);
      updateUser({
        avatar: updated.avatar || res.profileImageUrl,
        profileImageUrl: updated.profileImageUrl || res.profileImageUrl
      });
      showSuccess("Profile photo updated successfully.");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to upload profile photo.");
    } finally {
      setUploadingImage(false);
      // Reset input value so same file can be re-selected if needed
      e.target.value = "";
    }
  };

  const handleImageDelete = async () => {
    setUploadingImage(true);
    try {
      await studentService.deleteProfileImage();
      const updated = await studentService.getCurrentStudent();
      setStudent(updated);
      updateUser({
        avatar: null,
        profileImageUrl: null
      });
      showSuccess("Profile photo removed.");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to remove profile photo.");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Profile Hero Card */}
      <Card className="overflow-hidden border-slate-200">
        <div className="h-28 sm:h-32 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 relative" />
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Interactive Avatar Container */}
              <div className="-mt-12 sm:-mt-14 relative group shrink-0 z-10">
                <Avatar
                  src={student.profileImageUrl || student.avatar}
                  name={student.name}
                  size="2xl"
                  variant="rounded"
                  className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-white shadow-md rounded-2xl sm:rounded-3xl"
                />
                
                {/* Upload Overlay / Trigger */}
                <label
                  htmlFor="profile-image-input"
                  className={`absolute inset-0 rounded-2xl sm:rounded-3xl bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity border-4 border-white ${
                    uploadingImage ? "opacity-100" : ""
                  }`}
                  title="Upload profile photo"
                >
                  {uploadingImage ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span className="text-[10px] font-bold">Change</span>
                    </>
                  )}
                </label>
                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />

                {/* Remove button badge if image is uploaded */}
                {(student.profileImageUrl || student.avatar) && !uploadingImage && (
                  <button
                    onClick={handleImageDelete}
                    className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors cursor-pointer border-2 border-white z-20"
                    title="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="pt-1 sm:pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900">{student.name}</h1>
                  <Badge variant={student.readinessScore >= 80 ? "success" : (student.readinessScore >= 60 ? "primary" : "neutral")} size="sm">
                    {student.status}
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  USN: {student.usn} • {student.branch || "General"} {student.batch ? `(${student.batch})` : "(Batch Not Set)"}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="xs"
              icon={Edit2}
              onClick={() => {
                setAcademicForm({
                  name: student.name || "",
                  branch: student.branch || "",
                  batch: student.batch || "",
                  cgpa: student.cgpa > 0 ? String(student.cgpa) : ""
                });
                setEditAcademicModalOpen(true);
              }}
              className="bg-white hover:bg-slate-50 border-slate-200 shadow-xs"
            >
              Edit Academic Profile
            </Button>
          </div>

          {/* Quick Contact & Verification Badges */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {student.email}
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-indigo-700">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> CGPA: {student.cgpa > 0 ? student.cgpa.toFixed(2) : "Not Set"}
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

      {/* Placement Profile Information */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Placement Profile Information</h3>
            <p className="text-xs text-slate-500">Candidate placement attributes used for predictive analysis and institutional campus eligibility</p>
          </div>
          {!isEditingPlacement ? (
            <Button
              variant="outline"
              size="xs"
              icon={Edit2}
              onClick={() => {
                setAgeInput(student.age !== null && student.age !== undefined ? String(student.age) : "");
                setInternshipsInput(student.internships !== null && student.internships !== undefined ? String(student.internships) : "");
                setHostelInput(student.hostel === true ? "true" : (student.hostel === false ? "false" : ""));
                setBacklogsInput(student.historyOfBacklogs !== null && student.historyOfBacklogs !== undefined ? String(student.historyOfBacklogs) : "");
                setIsEditingPlacement(true);
              }}
            >
              Edit Placement Info
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setAgeInput(student.age !== null && student.age !== undefined ? String(student.age) : "");
                  setInternshipsInput(student.internships !== null && student.internships !== undefined ? String(student.internships) : "");
                  setHostelInput(student.hostel === true ? "true" : (student.hostel === false ? "false" : ""));
                  setBacklogsInput(student.historyOfBacklogs !== null && student.historyOfBacklogs !== undefined ? String(student.historyOfBacklogs) : "");
                  setIsEditingPlacement(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="xs"
                icon={Check}
                loading={saving}
                onClick={handleSavePlacement}
              >
                Save
              </Button>
            </div>
          )}
        </div>

        {isEditingPlacement ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Years)</label>
              <input
                type="number"
                min="16"
                max="100"
                placeholder="e.g. 21"
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Internships Completed</label>
              <input
                type="number"
                min="0"
                max="20"
                placeholder="e.g. 1"
                value={internshipsInput}
                onChange={(e) => setInternshipsInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hostel Status</label>
              <select
                value={hostelInput}
                onChange={(e) => setHostelInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
              >
                <option value="">Unset / Not Specified</option>
                <option value="true">Yes - Hostel Resident</option>
                <option value="false">No - Day Scholar</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">History of Backlogs</label>
              <input
                type="number"
                min="0"
                max="50"
                placeholder="e.g. 0"
                value={backlogsInput}
                onChange={(e) => setBacklogsInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Age</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {student.age !== null && student.age !== undefined ? `${student.age} years` : <span className="text-slate-400 font-normal italic">Not set</span>}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Internships</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {student.internships !== null && student.internships !== undefined ? `${student.internships} completed` : <span className="text-slate-400 font-normal italic">Not set</span>}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 shrink-0">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Accommodation</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {student.hostel === true ? "Hostel Resident" : (student.hostel === false ? "Day Scholar" : <span className="text-slate-400 font-normal italic">Not set</span>)}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Backlog History</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {student.historyOfBacklogs !== null && student.historyOfBacklogs !== undefined ? (student.historyOfBacklogs === 0 ? "0 (Clean Record)" : `${student.historyOfBacklogs} backlog(s)`) : <span className="text-slate-400 font-normal italic">Not set</span>}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ML Placement Likelihood Prediction Hub */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">ML Placement Likelihood Prediction</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Trained institutional machine learning model prediction based on academic & demographic profile inputs
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCalculatePrediction}
            disabled={calculatingPrediction}
            className="shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${calculatingPrediction ? "animate-spin" : ""}`} />
            {calculatingPrediction ? "Predicting..." : (prediction ? "Recalculate Prediction" : "Run ML Prediction")}
          </Button>
        </div>

        {prediction ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Classification Outcome</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={prediction.predictedClass === 1 ? "success" : "neutral"} size="md">
                      {prediction.predictedLabel}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Placement Likelihood</p>
                  <p className="text-xl font-black text-indigo-700 mt-0.5">
                    {(prediction.placementProbability * 100).toFixed(1)}%
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Decision Threshold</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">
                    {(prediction.decisionThreshold * 100).toFixed(0)}% ({prediction.decisionThreshold})
                  </p>
                </div>
              </div>

              {/* Likelihood Progress Bar */}
              <div className="mt-4 pt-3 border-t border-indigo-100/80">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1.5">
                  <span>Confidence Gauge</span>
                  <span>{(prediction.placementProbability * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      prediction.placementProbability >= prediction.decisionThreshold
                        ? "bg-emerald-500"
                        : "bg-indigo-500"
                    }`}
                    style={{ width: `${Math.min(Math.max(prediction.placementProbability * 100, 0), 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 px-1">
              <span>
                <strong>Model Version:</strong> {prediction.modelVersion || "Standard"}
              </span>
              <span>
                <strong>Calculated:</strong>{" "}
                {prediction.createdAt ? new Date(prediction.createdAt).toLocaleString() : "Recently"}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 text-center">
            <Cpu className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No ML Placement Prediction Generated</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Ensure your Age, Internships, Accommodation status, and Backlog history above are configured, then click &quot;Run ML Prediction&quot; to compute placement likelihood.
            </p>
          </div>
        )}
      </Card>

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

          <div className="flex flex-wrap items-center gap-2">
            {student.resumeUrl && (
              <a
                href={resolveAssetUrl(student.resumeUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                View Resume
              </a>
            )}
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

      {/* Edit Academic & Student Profile Details Modal */}
      <Modal
        isOpen={editAcademicModalOpen}
        onClose={() => setEditAcademicModalOpen(false)}
        maxWidth="max-w-lg"
        title="Edit Academic Profile"
        subtitle="Update your name, degree specialization, graduation batch, and verified CGPA"
      >
        <form onSubmit={handleSaveAcademic} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              disabled={savingAcademic}
              value={academicForm.name}
              onChange={(e) => setAcademicForm({ ...academicForm, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="e.g. Harsh Verdhan Singh"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department / Branch
            </label>
            <input
              type="text"
              disabled={savingAcademic}
              value={academicForm.branch}
              onChange={(e) => setAcademicForm({ ...academicForm, branch: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="e.g. Computer Science & Engineering"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batch / Graduation Year
              </label>
              <input
                type="text"
                disabled={savingAcademic}
                value={academicForm.batch}
                onChange={(e) => setAcademicForm({ ...academicForm, batch: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="e.g. 2026 or 2022-2026"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic CGPA (0 - 10)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                disabled={savingAcademic}
                value={academicForm.cgpa}
                onChange={(e) => setAcademicForm({ ...academicForm, cgpa: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="e.g. 8.5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={savingAcademic}
              onClick={() => setEditAcademicModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingAcademic}
            >
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
