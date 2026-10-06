import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  Eye,
  Code2,
  Trash2,
  Plus,
  X
} from "lucide-react";
import { resumeService } from "../../services/resumeService";
import { studentService } from "../../services/studentService";
import { resolveAssetUrl } from "../../services/api";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { useNotifications } from "../../context/NotificationContext";

export function ResumeAnalysisPage() {
  const { showSuccess, showError, showWarning } = useNotifications();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [error, setError] = useState(null);

  // Resume skill review state
  const [isResumeSkillReviewModalOpen, setIsResumeSkillReviewModalOpen] = useState(false);
  const [detectedSkillsList, setDetectedSkillsList] = useState([]);
  const [reviewNewSkill, setReviewNewSkill] = useState("");
  const [confirmingSkills, setConfirmingSkills] = useState(false);

  useEffect(() => {
    async function loadInitialResume() {
      try {
        const student = await studentService.getCurrentStudent();
        if (student && student.resumeUrl) {
          setUploadedResume({
            fileName: student.resumeUrl.split("/").pop() || "Resume.pdf",
            fileSize: "PDF Document",
            uploadDate: "Active",
            resumeUrl: student.resumeUrl,
            mlAnalysis: student.skills?.length > 0 ? {
              extracted_skills: student.skills,
              status: "active"
            } : null
          });
        }
      } catch (err) {
        console.warn("Could not load initial resume:", err);
      }
    }
    loadInitialResume();
  }, []);

  const handleDeleteResume = async () => {
    if (!window.confirm("Are you sure you want to remove your resume? Your skill evaluations and scores will be reset.")) {
      return;
    }
    setUploading(true);
    try {
      await resumeService.deleteResume();
      setUploadedResume(null);
      setFile(null);
      showSuccess("Resume removed successfully. Skill evaluations and scores have been reset.");
    } catch (err) {
      console.error("Failed to remove resume:", err);
      showError(err.message || "Failed to remove resume.");
    } finally {
      setUploading(false);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    if (!selectedFile) return;

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      const msg = "Please upload a valid PDF resume.";
      setError(msg);
      showError(msg);
      setFile(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      const msg = "File size exceeds the allowed limit.";
      setError(msg);
      showError(msg);
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      const msg = "Please select a PDF resume to upload.";
      setError(msg);
      showWarning(msg);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await resumeService.uploadResume(file);
      const resumeUrl = res.resumeUrl || res.data?.resumeUrl || "";
      const mlAnalysis = res.mlAnalysis || res.data?.mlAnalysis || null;
      setUploadedResume({
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        uploadDate: new Date().toLocaleDateString(),
        resumeUrl,
        mlAnalysis
      });
      showSuccess("Resume uploaded successfully.");
      if (res.reviewRequired && Array.isArray(res.detectedSkills)) {
        setDetectedSkillsList(res.detectedSkills);
        setIsResumeSkillReviewModalOpen(true);
      }
    } catch (err) {
      console.error("Resume upload error:", err);
      const msg = err.message || "Failed to process the uploaded file.";
      setError(msg);
      showError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveReviewSkill = (skillToRemove) => {
    setDetectedSkillsList(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleAddReviewSkill = () => {
    const trimmed = reviewNewSkill.trim();
    if (!trimmed) return;
    const exists = detectedSkillsList.some(s => s.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      showWarning(`"${trimmed}" is already in the list.`);
      return;
    }
    setDetectedSkillsList(prev => [...prev, trimmed]);
    setReviewNewSkill("");
  };

  const handleConfirmReviewSkills = async () => {
    setConfirmingSkills(true);
    try {
      const res = await studentService.confirmResumeSkills(detectedSkillsList);
      setIsResumeSkillReviewModalOpen(false);
      showSuccess("Resume skills confirmed and added to your profile!");
      if (res?.data?.skills) {
        setUploadedResume(prev => prev ? {
          ...prev,
          mlAnalysis: {
            extracted_skills: res.data.skills,
            status: "active"
          }
        } : prev);
      }
    } catch (err) {
      console.error("Failed to confirm skills:", err);
      showError(err.message || "Failed to confirm skills.");
    } finally {
      setConfirmingSkills(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-8 h-8 text-indigo-600" />
            Resume Upload & Placement Profile
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload your verified PDF resume for campus placement recruitment drives and company applications.
          </p>
        </div>

        {uploadedResume && (
          <Badge variant="success" size="lg">
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Active Resume Linked
          </Badge>
        )}
      </div>

      {/* Empty State Banner if no resume */}
      {!uploadedResume && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <p className="font-bold">No active resume linked to your student profile</p>
            <p className="text-amber-700">
              Please upload your verified PDF resume below. Once uploaded, technical skills, verified strengths, and skill gaps will be automatically evaluated for placement drives.
            </p>
          </div>
        </div>
      )}

      {/* Upload Zone Card */}
      <Card>
        <CardHeader
          title={uploadedResume ? "Upload Replacement Resume" : "Upload Verified Resume"}
          subtitle="Supports PDF documents up to 5MB. This file will be shared with recruiters for eligible campus drives."
        />

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className={`mt-4 border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
            file
              ? "border-indigo-500 bg-indigo-50/20"
              : "border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
          }`}
        >
          <div className="max-w-md mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>

            {file ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    {file.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Size: {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                </p>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium underline cursor-pointer"
                >
                  Choose a different file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm sm:text-base font-semibold text-slate-800">
                  Drag and drop your resume PDF here, or{" "}
                  <label className="text-indigo-600 hover:text-indigo-700 cursor-pointer underline font-bold">
                    browse files
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-xs text-slate-400">
                  Only PDF format is accepted. Maximum file size: 5 MB.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                disabled={!file || uploading}
                loading={uploading}
                onClick={handleUpload}
                icon={UploadCloud}
              >
                {uploading ? "Uploading resume..." : "Upload & Link to Profile"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Uploaded Resume Status Card */}
      {uploadedResume && (
        <Card className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {uploadedResume.fileName}
                </h3>
                <p className="text-xs text-slate-500">
                  Uploaded on {uploadedResume.uploadDate} • Size: {uploadedResume.fileSize}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {uploadedResume.resumeUrl && (
                <a
                  href={resolveAssetUrl(uploadedResume.resumeUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  View File
                </a>
              )}
              <button
                type="button"
                disabled={uploading}
                onClick={handleDeleteResume}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                Remove Resume
              </button>
            </div>
          </div>

          {uploadedResume.mlAnalysis?.extracted_skills?.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-indigo-600" />
                  Extracted Technical Skills ({uploadedResume.mlAnalysis.extracted_skills.length})
                </span>
                <Badge variant="primary" size="sm">
                  FastAPI ML Verified
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {uploadedResume.mlAnalysis.extracted_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {uploadedResume.mlAnalysis?.status === "offline" && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Resume stored securely. ML skill extraction service is currently offline.
              </span>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Placement Drive Status:</p>
            <p>
              Your resume has been stored on the institutional placement server. TPO administrators and recruiter matching systems will reference this document during campus recruitment drives.
            </p>
          </div>
        </Card>
      )}

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
    </div>
  );
}
