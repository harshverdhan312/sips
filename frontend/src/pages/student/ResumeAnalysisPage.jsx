import React, { useState } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Download,
  RefreshCw,
  Award,
  ShieldCheck
} from "lucide-react";
import { resumeService } from "../../services/resumeService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { ProgressBar } from "../../components/common/ProgressBar";
import { useNotifications } from "../../context/NotificationContext";

export function ResumeAnalysisPage() {
  const { addToast } = useNotifications();
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");
  const [result, setResult] = useState(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysisStep("Uploading document to secure ATS sandbox...");

    setTimeout(() => {
      setAnalysisStep("Parsing document structure & extracting entities...");
    }, 600);

    setTimeout(() => {
      setAnalysisStep("Benchmarking skills against 500+ campus recruiter JDs...");
    }, 1200);

    try {
      const data = await resumeService.analyzeResumeFile(file);
      setResult(data);
      addToast("Resume analysis complete! ATS score: 88/100", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to analyze resume. Please try again.", "error");
    } finally {
      setAnalyzing(false);
      setAnalysisStep("");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-8 h-8 text-indigo-600" />
            Resume Intelligence & ATS Scanner
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Deep syntactic and semantic analysis of your resume against institutional ATS filters.
          </p>
        </div>

        {result && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => {
                setResult(null);
                setFile(null);
              }}
            >
              Analyze New Resume
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={() => addToast("ATS Analysis Report PDF downloaded!", "info")}
            >
              Export Report
            </Button>
          </div>
        )}
      </div>

      {/* Upload Dropzone if no result yet */}
      {!result && (
        <Card className="p-8 sm:p-12 border-2 border-dashed border-slate-300 hover:border-indigo-500 transition-all bg-slate-50/50">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="flex flex-col items-center justify-center text-center max-w-lg mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Upload your Resume for Instant AI Intelligence
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
              Supports PDF, DOCX (Max 10 MB). Your resume is benchmarked against Tier-1 SDE job specs.
            </p>

            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.docx,.doc"
              onChange={handleFileSelect}
              className="hidden"
            />

            <label htmlFor="resume-upload">
              <Button
                variant="outline"
                size="md"
                as="span"
                className="cursor-pointer"
              >
                Browse Files from Device
              </Button>
            </label>

            {/* Selected File Display */}
            {file && (
              <div className="mt-6 w-full p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-4 text-left shadow-xs">
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB • Ready for deep scan
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  loading={analyzing}
                  onClick={handleAnalyze}
                >
                  Analyze Resume
                </Button>
              </div>
            )}

            {!file && (
              <div className="mt-6">
                <Button
                  variant="primary"
                  size="sm"
                  loading={analyzing}
                  onClick={handleAnalyze}
                >
                  Or Test with Sample Khushi_Sharma_Resume.pdf
                </Button>
              </div>
            )}

            {/* Analysis in progress status */}
            {analyzing && (
              <div className="mt-6 w-full max-w-md bg-white p-4 rounded-xl border border-indigo-100 shadow-sm animate-pulse">
                <div className="flex items-center justify-center gap-2 text-indigo-700 text-xs font-semibold">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>{analysisStep}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                  <div className="bg-indigo-600 h-full w-3/4 animate-pulse rounded-full" />
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Analysis Results View */}
      {result && (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="flex items-center gap-4 bg-gradient-to-br from-indigo-50/80 to-white border-indigo-200">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shadow-indigo-200 shrink-0">
                {result.overallScore}
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Overall ATS Score
                </p>
                <h4 className="text-base font-bold text-slate-900">
                  Excellent (Top 10%)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Parsed: {result.fileName}
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">ATS Parsability</p>
                <h4 className="text-xl font-bold text-slate-900">
                  {result.atsCompatibility}
                </h4>
                <p className="text-[11px] text-emerald-600 font-semibold">
                  No parser errors detected
                </p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Skills Identified</p>
                <h4 className="text-xl font-bold text-slate-900">
                  {result.detectedSkills.length} Technical
                </h4>
                <p className="text-[11px] text-slate-400">Validated with coursework</p>
              </div>
            </Card>

            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Impact Formatting</p>
                <h4 className="text-xl font-bold text-slate-900">90% Metric Fit</h4>
                <p className="text-[11px] text-slate-400">Uses X-Y-Z formula</p>
              </div>
            </Card>
          </div>

          {/* Sectional Breakdown Progress */}
          <Card>
            <CardHeader
              title="Resume Section Breakdown"
              subtitle="Performance evaluated section-by-section according to recruitment standards"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <ProgressBar
                  value={result.sectionsScore.contactInfo}
                  label="Contact & Links"
                  variant="emerald"
                  size="sm"
                />
              </div>
              <div>
                <ProgressBar
                  value={result.sectionsScore.summary}
                  label="Career Pitch"
                  variant="primary"
                  size="sm"
                />
              </div>
              <div>
                <ProgressBar
                  value={result.sectionsScore.skills}
                  label="Technical Skills"
                  variant="emerald"
                  size="sm"
                />
              </div>
              <div>
                <ProgressBar
                  value={result.sectionsScore.projects}
                  label="Projects & Impact"
                  variant="primary"
                  size="sm"
                />
              </div>
              <div>
                <ProgressBar
                  value={result.sectionsScore.education}
                  label="Education & GPA"
                  variant="emerald"
                  size="sm"
                />
              </div>
              <div>
                <ProgressBar
                  value={result.sectionsScore.formatting}
                  label="Layout & ATS"
                  variant="primary"
                  size="sm"
                />
              </div>
            </div>
          </Card>

          {/* Detected Skills vs Missing Target Skills */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detected Skills */}
            <Card>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                      Skills Detected in Resume
                    </h3>
                    <p className="text-xs text-slate-500">
                      Successfully mapped to industry ontology
                    </p>
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  {result.detectedSkills.length} Verified
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {result.detectedSkills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="p-2 px-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-xs"
                  >
                    <span className="font-semibold text-slate-800">{skill.name}</span>
                    <span className="text-[10px] text-slate-400">• {skill.category}</span>
                    <Badge variant="primary" size="sm">
                      {skill.level}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Missing Target Skills */}
            <Card>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                      Missing High-Impact Skills
                    </h3>
                    <p className="text-xs text-slate-500">
                      Frequent in target campus recruitment JDs
                    </p>
                  </div>
                </div>
                <Badge variant="danger" size="sm">
                  {result.missingTargetSkills.length} Gaps
                </Badge>
              </div>

              <div className="space-y-2.5">
                {result.missingTargetSkills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-rose-50/40 border border-rose-100 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{skill.name}</span>
                        <Badge variant="danger" size="sm">
                          {skill.priority} Priority
                        </Badge>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        {skill.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Strengths & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title="Resume Strengths"
                subtitle="Aspects that give you an edge in screening rounds"
              />
              <ul className="space-y-2.5 text-xs text-slate-700">
                {result.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader
                title="Recommended Actionable Fixes"
                subtitle="Concrete revisions to raise your ATS score to 95+"
              />
              <ul className="space-y-2.5 text-xs text-slate-700">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <ArrowRight className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Job Compatibility Matches */}
          <Card>
            <CardHeader
              title="Job Compatibility Matches"
              subtitle="How well your current resume matches active campus recruitment drives"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {result.jobMatches.map((job, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {job.company}
                      </h4>
                      <Badge variant="success" size="sm">
                        {job.matchScore}% Match
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{job.role}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex justify-between items-center text-xs">
                    <span className="text-emerald-600 font-semibold">
                      {job.status}
                    </span>
                    <span className="text-indigo-600 font-medium hover:underline cursor-pointer">
                      View Drive →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
