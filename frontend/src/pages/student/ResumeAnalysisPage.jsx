import React, { useState } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  Eye
} from "lucide-react";
import { resumeService } from "../../services/resumeService";
import { resolveAssetUrl } from "../../services/api";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { useNotifications } from "../../context/NotificationContext";

export function ResumeAnalysisPage() {
  const { showSuccess, showError, showWarning } = useNotifications();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [error, setError] = useState(null);

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
      setUploadedResume({
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        uploadDate: new Date().toLocaleDateString(),
        resumeUrl
      });
      showSuccess("Resume uploaded successfully.");
    } catch (err) {
      console.error("Resume upload error:", err);
      const msg = err.message || "Failed to process the uploaded file.";
      setError(msg);
      showError(msg);
    } finally {
      setUploading(false);
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

      {/* Upload Zone Card */}
      <Card>
        <CardHeader
          title="Upload Verified Resume"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  View File
                </a>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Placement Drive Status:</p>
            <p>
              Your resume has been stored on the institutional placement server. TPO administrators and recruiter matching systems will reference this document during campus recruitment drives.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
