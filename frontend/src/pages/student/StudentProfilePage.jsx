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
  Calendar,
  Star,
  GitFork,
  ExternalLink,
  FolderGit2,
  ArrowUp,
  ArrowDown,
  Search,
  Layers,
  Share2,
  Globe,
  Copy,
  Lock,
  ShieldCheck,
  BookOpen,
  Code
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

function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function formatTimeAgo(dateInput) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;
  const diffInSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffInSec < 60) return "just now";
  const minutes = Math.floor(diffInSec / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

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
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [changingPassword, setChangingPassword] = useState(false);
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

  // Featured Projects State
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [githubRepos, setGithubRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepoIds, setSelectedRepoIds] = useState([]);
  const [savingProjects, setSavingProjects] = useState(false);
  const [syncingProjects, setSyncingProjects] = useState(false);
  const [missingProjectsAlert, setMissingProjectsAlert] = useState([]);
  const [repoSearchFilter, setRepoSearchFilter] = useState("");

  // Public Career Profile State
  const [publicProfileConfig, setPublicProfileConfig] = useState({
    enabled: false,
    username: "",
    bio: "",
    showResume: false,
    showGithub: true,
    showLinkedIn: true,
    showSkills: true,
    showProjects: true
  });
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isPublicProfileModalOpen, setIsPublicProfileModalOpen] = useState(false);
  const [publicProfileForm, setPublicProfileForm] = useState({
    enabled: false,
    username: "",
    bio: "",
    showResume: false,
    showGithub: true,
    showLinkedIn: true,
    showSkills: true,
    showProjects: true,
    linkedin: ""
  });
  const [savingPublicProfile, setSavingPublicProfile] = useState(false);
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);
  const [publicProfileError, setPublicProfileError] = useState("");

  // Resume Skill Review State
  const [isResumeSkillReviewModalOpen, setIsResumeSkillReviewModalOpen] = useState(false);
  const [detectedSkillsList, setDetectedSkillsList] = useState([]);
  const [reviewNewSkill, setReviewNewSkill] = useState("");
  const [confirmingSkills, setConfirmingSkills] = useState(false);

  // Coding Profiles State
  const [codingProfiles, setCodingProfiles] = useState([]);
  const [loadingCodingProfiles, setLoadingCodingProfiles] = useState(true);
  const [codingProfilesLoadError, setCodingProfilesLoadError] = useState(false);
  const [isCodingProfileModalOpen, setIsCodingProfileModalOpen] = useState(false);
  const [codingProfileForm, setCodingProfileForm] = useState({
    platform: "LEETCODE",
    username: "",
    showOnPublicProfile: true
  });
  const [savingCodingProfile, setSavingCodingProfile] = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState("");
  const [codingProfileError, setCodingProfileError] = useState("");
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  const fetchCodingProfiles = async () => {
    setLoadingCodingProfiles(true);
    setCodingProfilesLoadError(false);
    try {
      const profiles = await studentService.getCodingProfiles();
      setCodingProfiles(profiles || []);
    } catch (err) {
      console.warn("Could not fetch coding profiles:", err?.message || err);
      setCodingProfilesLoadError(true);
    } finally {
      setLoadingCodingProfiles(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Primary Request: Core Student Profile (renders page shell & main cards immediately)
    studentService.getCurrentStudent()
      .then((data) => {
        if (!isMounted) return;
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
          setLinkedinUrl(data.linkedin || "");
          setAgeInput(data.age !== null && data.age !== undefined ? String(data.age) : "");
          setInternshipsInput(data.internships !== null && data.internships !== undefined ? String(data.internships) : "");
          setHostelInput(data.hostel === true ? "true" : (data.hostel === false ? "false" : ""));
          setBacklogsInput(data.historyOfBacklogs !== null && data.historyOfBacklogs !== undefined ? String(data.historyOfBacklogs) : "");
        }
      })
      .catch((err) => {
        console.warn("Could not fetch student profile:", err?.message || err);
      });

    // 2. Parallel Request: ML Placement Prediction
    setLoadingPrediction(true);
    studentService.getPlacementPrediction()
      .then((pred) => {
        if (isMounted && pred) {
          setPrediction(pred);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch placement prediction:", err?.message || err);
      })
      .finally(() => {
        if (isMounted) setLoadingPrediction(false);
      });

    // 3. Parallel Request: Public Profile Configuration
    studentService.getPublicProfileConfig()
      .then((pubRes) => {
        if (isMounted && pubRes && pubRes.success) {
          setPublicProfileConfig(pubRes.publicProfile || {});
          if (pubRes.linkedin) setLinkedinUrl(pubRes.linkedin);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch public profile config:", err?.message || err);
      });

    // 4. Parallel Request: Coding Profiles
    fetchCodingProfiles();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 4) {
      showError("Password must be at least 4 characters long.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError("Passwords do not match.");
      return;
    }
    
    setChangingPassword(true);
    try {
      await studentService.updateCurrentStudent({
        password: passwordForm.newPassword
      });
      setChangePasswordModalOpen(false);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      showSuccess("Password changed successfully.");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to change password.");
    } finally {
      setChangingPassword(false);
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

  const handleOpenProjectsModal = async () => {
    if (!student.github || !student.github.trim()) {
      showWarning("Please connect your GitHub profile handle first.");
      setIsEditingGithub(true);
      return;
    }

    setIsProjectsModalOpen(true);
    setSelectedRepoIds((student.projects || []).map(p => Number(p.repoId)));
    setLoadingRepos(true);
    setRepoSearchFilter("");

    try {
      const res = await studentService.fetchGithubRepositories();
      setGithubRepos(res?.repositories || []);
    } catch (e) {
      showError(e.message || "Could not fetch repositories from GitHub. Please try again.");
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleToggleProject = (repoId) => {
    const id = Number(repoId);
    if (selectedRepoIds.includes(id)) {
      setSelectedRepoIds(selectedRepoIds.filter(item => item !== id));
    } else {
      if (selectedRepoIds.length >= 3) {
        showWarning("You can select up to 3 featured projects.");
        return;
      }
      setSelectedRepoIds([...selectedRepoIds, id]);
    }
  };

  const handleMoveProject = (repoId, direction) => {
    const id = Number(repoId);
    const index = selectedRepoIds.indexOf(id);
    if (index === -1) return;

    const newIds = [...selectedRepoIds];
    if (direction === "up" && index > 0) {
      const temp = newIds[index - 1];
      newIds[index - 1] = newIds[index];
      newIds[index] = temp;
      setSelectedRepoIds(newIds);
    } else if (direction === "down" && index < newIds.length - 1) {
      const temp = newIds[index + 1];
      newIds[index + 1] = newIds[index];
      newIds[index] = temp;
      setSelectedRepoIds(newIds);
    }
  };

  const handleSaveProjects = async () => {
    setSavingProjects(true);
    try {
      const updatedProjects = await studentService.saveStudentProjects(selectedRepoIds);
      setStudent(prev => ({
        ...prev,
        projects: updatedProjects
      }));
      setIsProjectsModalOpen(false);
      setMissingProjectsAlert([]);
      showSuccess("Featured projects updated successfully!");
    } catch (e) {
      showError(e.message || "Failed to update featured projects. Please try again.");
    } finally {
      setSavingProjects(false);
    }
  };

  const handleSyncProjects = async () => {
    if (syncingProjects) return;
    setSyncingProjects(true);
    setMissingProjectsAlert([]);
    try {
      const res = await studentService.syncStudentProjects();
      if (res && res.projects) {
        setStudent(prev => ({
          ...prev,
          projects: res.projects
        }));
        if (res.missingProjects && res.missingProjects.length > 0) {
          setMissingProjectsAlert(res.missingProjects);
          showWarning(`Synced with ${res.missingProjects.length} repository(ies) unavailable on GitHub.`);
        } else {
          showSuccess(`Refreshed ${res.updatedCount ?? res.projects.length} project(s) from GitHub!`);
        }
      }
    } catch (e) {
      console.error("Failed to sync projects:", e);
      showError(e.message || "Failed to sync GitHub projects. Please try again.");
    } finally {
      setSyncingProjects(false);
    }
  };

  const handleOpenPublicProfileModal = () => {
    setPublicProfileForm({
      enabled: publicProfileConfig.enabled === true,
      username: publicProfileConfig.username || "",
      bio: publicProfileConfig.bio || "",
      showResume: publicProfileConfig.showResume === true,
      showGithub: publicProfileConfig.showGithub !== false,
      showLinkedIn: publicProfileConfig.showLinkedIn !== false,
      showSkills: publicProfileConfig.showSkills !== false,
      showProjects: publicProfileConfig.showProjects !== false,
      linkedin: linkedinUrl || ""
    });
    setPublicProfileError("");
    setIsPublicProfileModalOpen(true);
  };

  const handleSavePublicProfile = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPublicProfileError("");
    setSavingPublicProfile(true);
    try {
      const res = await studentService.updatePublicProfileConfig(publicProfileForm);
      if (res && res.success) {
        setPublicProfileConfig(res.publicProfile || {});
        if (res.linkedin !== undefined) {
          setLinkedinUrl(res.linkedin);
          setStudent(prev => ({ ...prev, linkedin: res.linkedin }));
        }
        setIsPublicProfileModalOpen(false);
        showSuccess("Public career profile settings updated successfully!");
      } else {
        setPublicProfileError(res?.message || "Failed to update public career profile settings.");
      }
    } catch (err) {
      setPublicProfileError(err.message || "Failed to update public career profile settings.");
    } finally {
      setSavingPublicProfile(false);
    }
  };

  const handleCopyPublicLink = () => {
    if (!publicProfileConfig.username) {
      showWarning("Please configure a username for your public profile first.");
      return;
    }
    const publicUrl = `${window.location.origin}/u/${publicProfileConfig.username}`;
    try {
      navigator.clipboard.writeText(publicUrl);
      setCopiedPublicUrl(true);
      showSuccess("Public profile URL copied to clipboard!");
      setTimeout(() => setCopiedPublicUrl(false), 2500);
    } catch (e) {
      showError("Could not copy link to clipboard.");
    }
  };

  const handleOpenConnectCodingModal = (platform = "LEETCODE") => {
    const existing = codingProfiles.find(p => p.platform === platform);
    setCodingProfileForm({
      platform,
      username: existing ? existing.username : "",
      showOnPublicProfile: existing ? existing.showOnPublicProfile !== false : true
    });
    setCodingProfileError("");
    setIsCodingProfileModalOpen(true);
  };

  const handleSaveCodingProfile = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!codingProfileForm.username.trim()) {
      setCodingProfileError("Username or profile URL is required.");
      return;
    }

    setCodingProfileError("");
    setSavingCodingProfile(true);

    try {
      const res = await studentService.connectCodingProfile({
        platform: codingProfileForm.platform,
        username: codingProfileForm.username.trim(),
        showOnPublicProfile: codingProfileForm.showOnPublicProfile
      });

      if (res && res.success) {
        setCodingProfiles(res.codingProfiles || []);
        setIsCodingProfileModalOpen(false);
        showSuccess(res.message || `Connected ${codingProfileForm.platform} profile successfully!`);
      } else {
        setCodingProfileError(res?.message || `Failed to connect ${codingProfileForm.platform} profile.`);
      }
    } catch (err) {
      setCodingProfileError(err.message || `Failed to connect ${codingProfileForm.platform} profile.`);
    } finally {
      setSavingCodingProfile(false);
    }
  };

  const handleSyncCodingProfile = async (platform) => {
    setSyncingPlatform(platform);
    try {
      const res = await studentService.syncCodingProfile(platform);
      if (res && res.codingProfiles) {
        setCodingProfiles(res.codingProfiles);
      }
      if (res && res.success) {
        showSuccess(res.message || `Synchronized ${platform} statistics successfully!`);
      } else {
        showWarning(res?.message || `Sync completed with notice: ${res?.codingProfile?.syncError || 'Check profile'}`);
      }
    } catch (err) {
      showError(err.message || `Failed to sync ${platform} profile.`);
    } finally {
      setSyncingPlatform("");
    }
  };

  const handleToggleCodingProfileVisibility = async (platform, currentVisibility) => {
    const nextVisibility = !currentVisibility;
    try {
      const res = await studentService.updateCodingProfileVisibility(platform, nextVisibility);
      if (res && res.codingProfiles) {
        setCodingProfiles(res.codingProfiles);
      }
      showSuccess(`${platform} visibility ${nextVisibility ? 'enabled' : 'hidden'} on public profile.`);
    } catch (err) {
      showError(err.message || `Failed to update ${platform} visibility.`);
    }
  };

  const handleDisconnectCodingProfile = async (platform) => {
    if (!window.confirm(`Are you sure you want to disconnect your ${platform} profile from SIPS?`)) {
      return;
    }

    try {
      const res = await studentService.disconnectCodingProfile(platform);
      if (res && res.codingProfiles) {
        setCodingProfiles(res.codingProfiles);
      } else {
        setCodingProfiles(prev => prev.filter(p => p.platform !== platform));
      }
      showSuccess(`Disconnected ${platform} profile.`);
    } catch (err) {
      showError(err.message || `Failed to disconnect ${platform} profile.`);
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
    if (!student) {
      showError("Profile data is still loading. Please try again in a moment.");
      return;
    }

    // Client-side validation: verify required placement attributes are present
    const missing = [];
    if (student.age === null || student.age === undefined) missing.push("Age");
    if (student.internships === null || student.internships === undefined) missing.push("Internships");
    if (student.hostel === null || student.hostel === undefined) missing.push("Hostel Status");
    if (student.historyOfBacklogs === null || student.historyOfBacklogs === undefined) missing.push("Backlog History");
    const cgpaVal = student.cgpa ?? student.academic?.cgpa;
    if (cgpaVal === null || cgpaVal === undefined || cgpaVal <= 0) missing.push("CGPA");

    if (missing.length > 0) {
      showError(`Please complete your Placement Profile Information first. Missing: ${missing.join(", ")}`);
      setIsEditingPlacement(true);
      return;
    }

    setCalculatingPrediction(true);
    try {
      const res = await studentService.requestPlacementPrediction();
      const pred = res?.prediction || res;
      if (pred && (pred.placementProbability !== undefined || pred.predictedClass !== undefined || pred._id)) {
        setPrediction(pred);
        showSuccess("Placement likelihood prediction computed successfully!");
      } else {
        showError("Could not retrieve prediction result.");
      }
    } catch (err) {
      console.error("Placement prediction error:", err);
      if (err?.data?.missingFields && Array.isArray(err.data.missingFields) && err.data.missingFields.length > 0) {
        showError(`Missing required fields: ${err.data.missingFields.join(", ")}. Please update your profile.`);
        setIsEditingPlacement(true);
      } else {
        const errMsg = err?.data?.message || err?.message || "Failed to calculate placement prediction.";
        showError(errMsg);
      }
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

      const detected = res.detectedSkills || [];
      if (detected.length > 0) {
        setDetectedSkillsList(detected);
        setIsResumeSkillReviewModalOpen(true);
        showSuccess("Resume uploaded. Please review the detected skills below.");
      } else {
        showSuccess("Resume uploaded successfully.");
      }
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to process the uploaded file.");
    } finally {
      setUploadingResume(false);
      // Reset input value so same file can be re-selected if needed
      e.target.value = "";
    }
  };

  const handleConfirmReviewSkills = async () => {
    setConfirmingSkills(true);
    try {
      await studentService.confirmResumeSkills(detectedSkillsList);
      const updated = await studentService.getCurrentStudent();
      setStudent(updated);
      setSkillsList(updated.skills || []);
      setIsResumeSkillReviewModalOpen(false);
      showSuccess(`Confirmed ${detectedSkillsList.length} skills! Your profile has been updated.`);
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to confirm resume skills.");
    } finally {
      setConfirmingSkills(false);
    }
  };

  const handleAddReviewSkill = (e) => {
    e?.preventDefault();
    const trimmed = reviewNewSkill.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (detectedSkillsList.some(s => s.toLowerCase() === lower)) {
      showWarning(`Skill "${trimmed}" is already in the list.`);
      return;
    }
    setDetectedSkillsList([...detectedSkillsList, trimmed]);
    setReviewNewSkill("");
  };

  const handleRemoveReviewSkill = (skillToRemove) => {
    setDetectedSkillsList(detectedSkillsList.filter(s => s !== skillToRemove));
  };

  const handleResumeDelete = async () => {
    if (!window.confirm("Are you sure you want to remove your resume? Your resume-derived skill evaluations will be reset.")) {
      return;
    }
    setUploadingResume(true);
    try {
      await studentService.deleteResume();
      const updated = await studentService.getCurrentStudent();
      setStudent(updated);
      setSkillsList(updated.skills || []);
      showSuccess("Resume removed and skill evaluations reset.");
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to remove resume.");
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

  if (!student) {
    return <DashboardSkeleton />;
  }

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

            <div className="flex gap-2">
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
              <Button
                variant="outline"
                size="xs"
                icon={Lock}
                onClick={() => setChangePasswordModalOpen(true)}
                className="bg-white hover:bg-slate-50 border-slate-200 shadow-xs"
              >
                Change Password
              </Button>
            </div>
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

      {/* Public Career Profile Management Card */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" /> Public Career Profile
              </h3>
              <Badge
                variant={publicProfileConfig.enabled ? "emerald" : "neutral"}
                size="sm"
              >
                {publicProfileConfig.enabled ? "Publicly Accessible" : "Disabled / Private"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Create a shareable, recruiter-facing portfolio link to showcase your verified skills, projects, and resume
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              icon={Edit2}
              onClick={handleOpenPublicProfileModal}
            >
              Configure Profile
            </Button>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 block">Your Shareable Public Link:</span>
              <div className="flex flex-wrap items-center gap-2">
                <code className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-indigo-700 font-semibold select-all">
                  {publicProfileConfig.username 
                    ? `${window.location.origin}/u/${publicProfileConfig.username}`
                    : `${window.location.origin}/u/<your-username>`
                  }
                </code>
                {publicProfileConfig.username && (
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={copiedPublicUrl ? Check : Copy}
                    onClick={handleCopyPublicLink}
                    className="text-slate-600 hover:text-indigo-600"
                  >
                    {copiedPublicUrl ? "Copied" : "Copy Link"}
                  </Button>
                )}
                {publicProfileConfig.enabled && publicProfileConfig.username && (
                  <a
                    href={`/u/${publicProfileConfig.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                  >
                    <span>View Public Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Visibility Settings Summary */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Visibility:</span>
              <span className={`px-2 py-0.5 rounded-md border ${publicProfileConfig.showSkills !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                Skills: {publicProfileConfig.showSkills !== false ? 'On' : 'Off'}
              </span>
              <span className={`px-2 py-0.5 rounded-md border ${publicProfileConfig.showProjects !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                Projects: {publicProfileConfig.showProjects !== false ? 'On' : 'Off'}
              </span>
              <span className={`px-2 py-0.5 rounded-md border ${publicProfileConfig.showResume ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                Resume: {publicProfileConfig.showResume ? 'On' : 'Off'}
              </span>
              <span className={`px-2 py-0.5 rounded-md border ${publicProfileConfig.showGithub !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                GitHub: {publicProfileConfig.showGithub !== false ? 'On' : 'Off'}
              </span>
              <span className={`px-2 py-0.5 rounded-md border ${publicProfileConfig.showLinkedIn !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                LinkedIn: {publicProfileConfig.showLinkedIn !== false ? 'On' : 'Off'}
              </span>
            </div>
          </div>
          {!publicProfileConfig.enabled && (
            <p className="text-[11px] text-amber-700 mt-2.5 flex items-center gap-1 font-medium">
              <Lock className="w-3 h-3" /> Profile is currently disabled. External visitors will receive a 404 response until you enable it.
            </p>
          )}
        </div>
      </Card>

      {/* Featured GitHub Projects Section */}
      {(() => {
        const latestSyncedAt = (student.projects || []).reduce((latest, p) => {
          if (!p.syncedAt) return latest;
          if (!latest) return p.syncedAt;
          return new Date(p.syncedAt) > new Date(latest) ? p.syncedAt : latest;
        }, null);

        return (
          <Card className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <FolderGit2 className="w-5 h-5 text-indigo-600" /> Featured GitHub Projects
                  </h3>
                  <Badge variant={student.projects && student.projects.length > 0 ? "indigo" : "neutral"} size="sm">
                    {student.projects?.length || 0} / 3 Selected
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>Showcase your top 3 public repositories to institutional placement cells and visiting enterprise recruiters</span>
                  {latestSyncedAt && (
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                      <RefreshCw className="w-3 h-3 text-slate-400" />
                      Last synced: {formatTimeAgo(latestSyncedAt)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {student.projects && student.projects.length > 0 && (
                  <Button
                    variant="outline"
                    size="xs"
                    icon={RefreshCw}
                    onClick={handleSyncProjects}
                    disabled={syncingProjects}
                    className={syncingProjects ? "opacity-75 cursor-not-allowed" : ""}
                  >
                    {syncingProjects ? (
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        Syncing...
                      </span>
                    ) : (
                      "Sync GitHub Projects"
                    )}
                  </Button>
                )}
                {student.github ? (
                  <Button
                    variant="outline"
                    size="xs"
                    icon={Edit2}
                    onClick={handleOpenProjectsModal}
                  >
                    {student.projects && student.projects.length > 0 ? "Manage Projects" : "Select Projects"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="xs"
                    icon={GitBranch}
                    onClick={() => setIsEditingGithub(true)}
                  >
                    Connect GitHub First
                  </Button>
                )}
              </div>
            </div>

            {/* Missing projects notice banner if sync detected unavailable repositories */}
            {missingProjectsAlert.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                <span className="font-semibold text-amber-900 shrink-0">Sync Notice:</span>
                <div className="space-y-1">
                  <p>
                    {missingProjectsAlert.length} repository(ies) could not be refreshed from GitHub (deleted, renamed, or made private).
                    Their existing snapshots are preserved in your profile. You can keep them or remove them via "Manage Projects".
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {missingProjectsAlert.map((mp, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-amber-100/80 text-amber-900 font-mono text-[10px]">
                        {mp.name || `Repo #${mp.repoId}`} ({mp.reason || 'NOT_FOUND'})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* State A: GitHub Not Linked */}
            {!student.github ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200">
                <GitBranch className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">GitHub Profile Not Linked</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-4">
                  Connect your GitHub account handle above to automatically fetch and showcase your best public repositories.
                </p>
                <Button
                  variant="primary"
                  size="xs"
                  icon={Plus}
                  onClick={() => setIsEditingGithub(true)}
                >
                  Add GitHub Handle
                </Button>
              </div>
            ) : !student.projects || student.projects.length === 0 ? (
              /* State B: GitHub Linked, No Projects Selected */
              <div className="p-8 text-center rounded-2xl bg-indigo-50/30 border border-dashed border-indigo-200/70">
                <FolderGit2 className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800">No Featured Projects Selected Yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-4">
                  Select up to 3 of your best public repositories from <span className="font-semibold text-indigo-600">@{student.github}</span> to highlight on your placement portfolio.
                </p>
                <Button
                  variant="primary"
                  size="xs"
                  icon={Plus}
                  onClick={handleOpenProjectsModal}
                >
                  Select Featured Projects
                </Button>
              </div>
            ) : (
              /* State C: 1–3 Featured Projects */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {student.projects.map((proj, idx) => {
                  const isMissing = missingProjectsAlert.some(m => String(m.repoId) === String(proj.repoId));

                  return (
                    <div
                      key={proj.repoId || idx}
                      className={`relative flex flex-col justify-between p-4 rounded-xl border bg-white hover:border-indigo-300 hover:shadow-sm transition-all group ${
                        isMissing ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/80'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                              #{idx + 1}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm truncate" title={proj.name}>
                              {proj.name}
                            </h4>
                            {isMissing && (
                              <span className="shrink-0 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-semibold">
                                Unavailable
                              </span>
                            )}
                          </div>
                          <a
                            href={proj.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors shrink-0"
                            title="View on GitHub"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 mb-3 min-h-[32px]">
                          {proj.description || "No description provided for this repository."}
                        </p>

                        {/* Tech stack / topics */}
                        {proj.topics && proj.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {proj.topics.slice(0, 3).map((topic, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600"
                              >
                                #{topic}
                              </span>
                            ))}
                            {proj.topics.length > 3 && (
                              <span className="text-[10px] text-slate-400 self-center">
                                +{proj.topics.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-500 mt-2">
                        <div className="flex items-center gap-1.5">
                          {proj.primaryLanguage && (
                            <span className="flex items-center gap-1 font-medium text-slate-700 text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                              {proj.primaryLanguage}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="flex items-center gap-1" title="Stars">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            {proj.stars || 0}
                          </span>
                          <span className="flex items-center gap-1" title="Forks">
                            <GitFork className="w-3 h-3 text-slate-400" />
                            {proj.forks || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })()}

      {/* Coding & Competitive Programming Profiles Section */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> Coding & Competitive Programming Profiles
              </h3>
              <Badge variant={codingProfiles.length > 0 ? "indigo" : "neutral"} size="sm">
                {codingProfiles.length} Connected
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Connect your LeetCode and Codeforces profiles to showcase problem-solving metrics and contest ratings
            </p>
          </div>
        </div>

        {loadingCodingProfiles ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-5 rounded-2xl border border-slate-200 bg-white animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-100 rounded w-28" />
                    <div className="h-3 bg-slate-100 rounded w-20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-14 bg-slate-50 rounded-xl border border-slate-100" />
                  <div className="h-14 bg-slate-50 rounded-xl border border-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : codingProfilesLoadError ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-800">
            <span className="font-medium">Unable to load coding profiles snapshot.</span>
            <Button
              variant="outline"
              size="xs"
              icon={RefreshCw}
              onClick={fetchCodingProfiles}
              className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['LEETCODE', 'CODEFORCES'].map((platformKey) => {
              const isLeetCode = platformKey === 'LEETCODE';
              const connected = codingProfiles.find(p => p.platform === platformKey);
              const isSyncing = syncingPlatform === platformKey;
              const stats = connected?.stats || {};

              return (
                <div
                  key={platformKey}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${
                          isLeetCode 
                            ? 'bg-amber-50 text-amber-600 border-amber-200' 
                            : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                          <Code className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">
                              {isLeetCode ? 'LeetCode' : 'Codeforces'}
                            </h4>
                            <Badge variant={connected ? "emerald" : "neutral"} size="xs">
                              {connected ? "Connected" : "Not Linked"}
                            </Badge>
                          </div>
                          {connected ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-mono text-indigo-600 font-semibold">@{connected.username}</span>
                              {connected.profileUrl && (
                                <a
                                  href={connected.profileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                                  title="Open Profile"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Public statistics & ratings</span>
                          )}
                        </div>
                      </div>

                      {connected && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={RefreshCw}
                            onClick={() => handleSyncCodingProfile(platformKey)}
                            disabled={isSyncing}
                            title="Sync Now"
                            className={isSyncing ? "animate-spin text-indigo-600" : "text-slate-500 hover:text-indigo-600"}
                          />
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={Trash2}
                            onClick={() => handleDisconnectCodingProfile(platformKey)}
                            title="Disconnect"
                            className="text-slate-400 hover:text-rose-600"
                          />
                        </div>
                      )}
                    </div>

                    {connected ? (
                      <div className="space-y-3 mt-4">
                        {/* Platform-Specific Metrics */}
                        {isLeetCode ? (
                          <>
                            {/* LeetCode Stats Grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {typeof stats.problemsSolved === 'number' && (
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                  <span className="text-[10px] text-slate-500 font-medium block">Problems Solved</span>
                                  <span className="font-extrabold text-slate-900 text-base">{stats.problemsSolved}</span>
                                </div>
                              )}
                              {typeof stats.globalRank === 'number' && stats.globalRank > 0 && (
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                  <span className="text-[10px] text-slate-500 font-medium block">Global Rank</span>
                                  <span className="font-bold text-slate-900 text-sm">#{stats.globalRank.toLocaleString()}</span>
                                </div>
                              )}
                              {typeof stats.currentRating === 'number' && stats.currentRating > 0 && (
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                  <span className="text-[10px] text-slate-500 font-medium block">Contest Rating</span>
                                  <span className="font-extrabold text-indigo-600 text-base">{stats.currentRating}</span>
                                </div>
                              )}
                              {stats.rankingTier && (
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                  <span className="text-[10px] text-slate-500 font-medium block">Badge Tier</span>
                                  <span className="font-bold text-amber-700 text-sm">{stats.rankingTier}</span>
                                </div>
                              )}
                              {typeof stats.contestParticipationCount === 'number' && stats.contestParticipationCount > 0 && (
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                  <span className="text-[10px] text-slate-500 font-medium block">Contests</span>
                                  <span className="font-bold text-slate-700 text-sm">{stats.contestParticipationCount}</span>
                                </div>
                              )}
                            </div>

                            {/* Difficulty Breakdown for LeetCode ONLY (only non-null counts rendered) */}
                            {stats.difficultyBreakdown && (
                              typeof stats.difficultyBreakdown.easy === 'number' ||
                              typeof stats.difficultyBreakdown.medium === 'number' ||
                              typeof stats.difficultyBreakdown.hard === 'number'
                            ) && (
                              <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                                {typeof stats.difficultyBreakdown.easy === 'number' && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                                    Easy: {stats.difficultyBreakdown.easy}
                                  </span>
                                )}
                                {typeof stats.difficultyBreakdown.medium === 'number' && (
                                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium border border-amber-100">
                                    Medium: {stats.difficultyBreakdown.medium}
                                  </span>
                                )}
                                {typeof stats.difficultyBreakdown.hard === 'number' && (
                                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-medium border border-rose-100">
                                    Hard: {stats.difficultyBreakdown.hard}
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          /* Codeforces Stats Grid */
                          (() => {
                            const hasRating = typeof stats.currentRating === 'number' && stats.currentRating > 0;
                            const hasMaxRating = typeof stats.maxRating === 'number' && stats.maxRating > 0;
                            const hasRank = stats.rank && stats.rank.toLowerCase() !== 'unrated';
                            const hasMaxRank = stats.maxRank && stats.maxRank.toLowerCase() !== 'unrated';
                            const hasContests = typeof stats.contestParticipationCount === 'number' && stats.contestParticipationCount > 0;
                            const hasActivity = hasRating || hasMaxRating || hasRank || hasMaxRank || hasContests;

                            if (!hasActivity) {
                              return (
                                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                                  No contest activity yet
                                </div>
                              );
                            }

                            return (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {hasRating && (
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-[10px] text-slate-500 font-medium block">Current Rating</span>
                                    <span className="font-extrabold text-indigo-600 text-base">{stats.currentRating}</span>
                                  </div>
                                )}
                                {hasMaxRating && (
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-[10px] text-slate-500 font-medium block">Max Rating</span>
                                    <span className="font-bold text-slate-700 text-sm">{stats.maxRating}</span>
                                  </div>
                                )}
                                {hasRank && (
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-[10px] text-slate-500 font-medium block">Current Rank</span>
                                    <span className="font-bold text-blue-700 text-sm capitalize">{stats.rank}</span>
                                  </div>
                                )}
                                {hasMaxRank && (
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-[10px] text-slate-500 font-medium block">Max Rank</span>
                                    <span className="font-bold text-slate-700 text-sm capitalize">{stats.maxRank}</span>
                                  </div>
                                )}
                                {hasContests && (
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-[10px] text-slate-500 font-medium block">Contests</span>
                                    <span className="font-bold text-slate-700 text-sm">{stats.contestParticipationCount}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        )}

                        {/* Sync notice / Last synced */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          <span>
                            {connected.lastSyncedAt ? `Synced ${formatTimeAgo(connected.lastSyncedAt)}` : 'Recently connected'}
                          </span>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={connected.showOnPublicProfile !== false}
                              onChange={() => handleToggleCodingProfileVisibility(platformKey, connected.showOnPublicProfile !== false)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                            />
                            <span className="text-slate-600 font-medium">Show on Public Profile</span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Not connected to your profile</span>
                        <Button
                          variant="outline"
                          size="xs"
                          icon={Plus}
                          onClick={() => handleOpenConnectCodingModal(platformKey)}
                        >
                          Connect {isLeetCode ? 'LeetCode' : 'Codeforces'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

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

        {loadingPrediction ? (
          <div className="p-6 rounded-xl border border-indigo-100 bg-indigo-50/20 text-center animate-pulse">
            <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Fetching institutional placement prediction...</p>
          </div>
        ) : prediction ? (
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
              <>
                <a
                  href={resolveAssetUrl(student.resumeUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  View Resume
                </a>
                <button
                  type="button"
                  disabled={uploadingResume}
                  onClick={handleResumeDelete}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  Remove Resume
                </button>
              </>
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
              disabled={true}
              value={academicForm.branch}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 cursor-not-allowed focus:outline-none"
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
                disabled={true}
                value={academicForm.batch}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 cursor-not-allowed focus:outline-none"
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

      {/* Featured Projects Selection & Reordering Modal */}
      <Modal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        maxWidth="max-w-2xl"
        title="Manage Featured GitHub Projects"
        subtitle={`Select and prioritize up to 3 repositories from @${student.github} for your placement profile`}
      >
        <div className="space-y-4">
          {/* Top Status & Limit Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Selection Limit:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                selectedRepoIds.length === 3
                  ? "bg-amber-100 text-amber-800"
                  : selectedRepoIds.length > 0
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-slate-200 text-slate-700"
              }`}>
                {selectedRepoIds.length} / 3 Selected
              </span>
            </div>
            {selectedRepoIds.length === 3 && (
              <span className="text-[11px] text-amber-700 font-medium">
                Limit reached. Deselect a repo to choose another.
              </span>
            )}
          </div>

          {/* Selected Projects Ordering Drawer (if any selected) */}
          {selectedRepoIds.length > 0 && (
            <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40">
              <h4 className="text-xs font-bold text-indigo-900 mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Featured Projects Priority (Display Order)
              </h4>
              <div className="space-y-1.5">
                {selectedRepoIds.map((id, index) => {
                  const repo = githubRepos.find(r => r.repoId === id) || (student.projects || []).find(p => p.repoId === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-indigo-200/60 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          #{index + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {repo ? repo.name : `Repo #${id}`}
                        </span>
                        {repo?.primaryLanguage && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {repo.primaryLanguage}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveProject(id, "up")}
                          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === selectedRepoIds.length - 1}
                          onClick={() => handleMoveProject(id, "down")}
                          className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleProject(id)}
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Remove from featured"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search repositories by name, language, or topic..."
              value={repoSearchFilter}
              onChange={(e) => setRepoSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Repository List */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {loadingRepos ? (
              <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                <span>Fetching public repositories from GitHub...</span>
              </div>
            ) : githubRepos.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 rounded-xl bg-slate-50 border border-slate-200">
                No public repositories found for @{student.github}.
              </div>
            ) : (
              githubRepos
                .filter(r => {
                  if (!repoSearchFilter.trim()) return true;
                  const q = repoSearchFilter.toLowerCase();
                  return (
                    r.name.toLowerCase().includes(q) ||
                    (r.description && r.description.toLowerCase().includes(q)) ||
                    (r.primaryLanguage && r.primaryLanguage.toLowerCase().includes(q)) ||
                    (r.topics && r.topics.some(t => t.toLowerCase().includes(q)))
                  );
                })
                .map((repo) => {
                  const isSelected = selectedRepoIds.includes(repo.repoId);
                  const canSelect = isSelected || selectedRepoIds.length < 3;

                  return (
                    <div
                      key={repo.repoId}
                      onClick={() => canSelect && handleToggleProject(repo.repoId)}
                      className={`flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/30"
                          : canSelect
                          ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                          : "border-slate-200 bg-slate-50/60 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!canSelect}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 pointer-events-none"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {repo.name}
                            </span>
                            {repo.isFork && (
                              <span className="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-amber-50 text-amber-700 border border-amber-200">
                                Fork
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {repo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                            {repo.primaryLanguage && (
                              <span className="flex items-center gap-1 font-medium text-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                                {repo.primaryLanguage}
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                              {repo.stars}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <GitFork className="w-2.5 h-2.5 text-slate-400" />
                              {repo.forks}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedRepoIds([])}
              className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer"
            >
              Clear selection
            </button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={savingProjects}
                onClick={() => setIsProjectsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={savingProjects}
                onClick={handleSaveProjects}
              >
                Save Featured Projects
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Configure Public Career Profile Modal */}
      <Modal
        isOpen={isPublicProfileModalOpen}
        onClose={() => setIsPublicProfileModalOpen(false)}
        title="Public Career Profile Settings"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSavePublicProfile} className="space-y-5">
          {publicProfileError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {publicProfileError}
            </div>
          )}

          {/* Enabled Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Enable Public Career Profile</span>
              <span className="text-[11px] text-slate-500">Allow recruiters to view your public portfolio at /u/:username</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={publicProfileForm.enabled}
                onChange={(e) => setPublicProfileForm(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Username Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Public Profile Username <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
              <span className="px-3 py-2 bg-slate-100 text-xs font-mono text-slate-500 border-r border-slate-200 select-none">
                /u/
              </span>
              <input
                type="text"
                placeholder="e.g. rahul-sharma"
                value={publicProfileForm.username}
                onChange={(e) => setPublicProfileForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                className="w-full px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              3–30 lowercase letters, numbers, and hyphens (e.g. rahul-sharma, arjun-2026).
            </p>
          </div>

          {/* Bio Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Professional Bio (Plain text)
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {publicProfileForm.bio.length} / 500
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="A brief summary of your career interests, skills, and technical goals..."
              value={publicProfileForm.bio}
              onChange={(e) => setPublicProfileForm(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* LinkedIn Profile URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              LinkedIn Profile URL
            </label>
            <div className="relative">
              <LinkedinIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="url"
                placeholder="https://www.linkedin.com/in/username"
                value={publicProfileForm.linkedin}
                onChange={(e) => setPublicProfileForm(prev => ({ ...prev, linkedin: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Visibility Controls */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-900 block">Public Visibility Controls</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={publicProfileForm.showResume}
                  onChange={(e) => setPublicProfileForm(prev => ({ ...prev, showResume: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="font-medium text-slate-700">Show Resume PDF</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={publicProfileForm.showSkills}
                  onChange={(e) => setPublicProfileForm(prev => ({ ...prev, showSkills: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="font-medium text-slate-700">Show Verified Skills</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={publicProfileForm.showProjects}
                  onChange={(e) => setPublicProfileForm(prev => ({ ...prev, showProjects: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="font-medium text-slate-700">Show Featured Projects</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={publicProfileForm.showGithub}
                  onChange={(e) => setPublicProfileForm(prev => ({ ...prev, showGithub: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="font-medium text-slate-700">Show GitHub Link</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={publicProfileForm.showLinkedIn}
                  onChange={(e) => setPublicProfileForm(prev => ({ ...prev, showLinkedIn: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="font-medium text-slate-700">Show LinkedIn Link</span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={savingPublicProfile}
              onClick={() => setIsPublicProfileModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingPublicProfile}
            >
              Save Public Settings
            </Button>
          </div>
        </form>
      </Modal>

      {/* Resume Skill Review Modal */}
      <Modal
        isOpen={isResumeSkillReviewModalOpen}
        onClose={() => setIsResumeSkillReviewModalOpen(false)}
        title="Skills Found in Your Resume"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            We found these skills in your resume. Please review them before adding them to your SIPS profile.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Detected Skills ({detectedSkillsList.length})
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[60px] items-center">
              {detectedSkillsList.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No skills selected. You can add skills below or confirm to proceed.</span>
              ) : (
                detectedSkillsList.map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-medium"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveReviewSkill(skill)}
                      className="text-indigo-400 hover:text-indigo-700 rounded-full focus:outline-none"
                      title="Remove skill"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Add Skill row */}
          <div className="flex gap-2">
            <input
              type="text"
              value={reviewNewSkill}
              onChange={(e) => setReviewNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddReviewSkill();
                }
              }}
              placeholder="Add missing skill (e.g. Docker, Python)..."
              className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddReviewSkill}
              className="shrink-0 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Skill
            </Button>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={confirmingSkills}
              onClick={() => setIsResumeSkillReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={confirmingSkills}
              onClick={handleConfirmReviewSkills}
            >
              Confirm Skills
            </Button>
          </div>
        </div>
      </Modal>

      {/* Coding Profile Connection Modal */}
      <Modal
        isOpen={isCodingProfileModalOpen}
        onClose={() => !savingCodingProfile && setIsCodingProfileModalOpen(false)}
        title={`${codingProfileForm.platform === 'LEETCODE' ? 'LeetCode' : 'Codeforces'} Profile`}
      >
        <form onSubmit={handleSaveCodingProfile} className="space-y-4 pt-2">
          {codingProfileError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {codingProfileError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Handle or Profile URL
            </label>
            <input
              type="text"
              value={codingProfileForm.username}
              onChange={(e) => setCodingProfileForm(prev => ({ ...prev, username: e.target.value }))}
              placeholder={codingProfileForm.platform === 'LEETCODE' ? 'e.g., username or https://leetcode.com/u/username' : 'e.g., handle or https://codeforces.com/profile/handle'}
              disabled={savingCodingProfile}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter your public username or profile link. We will verify and fetch your public stats.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="codingModalShowPublic"
              checked={codingProfileForm.showOnPublicProfile}
              onChange={(e) => setCodingProfileForm(prev => ({ ...prev, showOnPublicProfile: e.target.checked }))}
              disabled={savingCodingProfile}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="codingModalShowPublic" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
              Display on public career profile
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={savingCodingProfile}
              onClick={() => setIsCodingProfileModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingCodingProfile}
            >
              Save & Sync
            </Button>
          </div>
        </form>
      </Modal>
      {/* Change Password Modal */}
      <Modal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        title="Change Password"
        size="sm"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              disabled={changingPassword}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              disabled={changingPassword}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Confirm new password"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={changingPassword}
              onClick={() => setChangePasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={changingPassword}
            >
              Change Password
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
