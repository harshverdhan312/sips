import React, { useState, useEffect, useMemo } from "react";
import {
  Briefcase,
  Search,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Filter,
  Check,
  RefreshCw
} from "lucide-react";
import { studentService } from "../../services/studentService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { DashboardSkeleton } from "../../components/common/LoadingSkeleton";
import { useNotifications } from "../../context/NotificationContext";

export function StudentJobsPage() {
  const { addToast } = useNotifications();
  const [jobs, setJobs] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchFilter, setMatchFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState(null);
  const [analyzingMl, setAnalyzingMl] = useState(false);
  const [mlAnalysisResult, setMlAnalysisResult] = useState(null);
  const [appliedJobIds, setAppliedJobIds] = useState(() => {
    try {
      const saved = localStorage.getItem("sips_applied_job_ids");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setMlAnalysisResult(null);
  };

  const handleAnalyzeMatch = async (jobId) => {
    try {
      setAnalyzingMl(true);
      const res = await studentService.analyzeJobMatch(jobId);
      setMlAnalysisResult(res);
      addToast("AI Match Analysis computed successfully!", "success");
    } catch (e) {
      addToast(e.message || "Failed to analyze match", "error");
    } finally {
      setAnalyzingMl(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [jobList, studentData] = await Promise.all([
          studentService.getStudentJobs(),
          studentService.getCurrentStudent()
        ]);
        setJobs(jobList);
        setStudent(studentData);
      } catch (e) {
        console.error("Failed to load student jobs:", e);
        addToast("Failed to load recruitment drives", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [addToast]);

  const handleApply = (job) => {
    if (!appliedJobIds.includes(job.id)) {
      const updated = [...appliedJobIds, job.id];
      setAppliedJobIds(updated);
      try {
        localStorage.setItem("sips_applied_job_ids", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    addToast(`Application registered for ${job.company} (${job.role})!`, "success");
    setSelectedJob(null);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search matching
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        job.company.toLowerCase().includes(query) ||
        job.role.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query) ||
        job.requiredSkills.some((s) => s.toLowerCase().includes(query));

      // Match Score Tier filtering
      let matchesTier = true;
      if (matchFilter === "high") {
        matchesTier = job.matchScore >= 80;
      } else if (matchFilter === "moderate") {
        matchesTier = job.matchScore >= 60 && job.matchScore < 80;
      } else if (matchFilter === "low") {
        matchesTier = job.matchScore < 60;
      }

      // Job Type filtering
      let matchesType = true;
      if (typeFilter !== "all") {
        matchesType = job.type.toLowerCase().includes(typeFilter.toLowerCase());
      }

      return matchesSearch && matchesTier && matchesType;
    });
  }, [jobs, searchQuery, matchFilter, typeFilter]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const highMatchCount = jobs.filter((j) => j.matchScore >= 80).length;
  const appliedCount = appliedJobIds.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-8 h-8 text-indigo-600" />
            Campus Placement Drives & Opportunities
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Explore active campus recruitment drives calibrated with your verified technical skills and eligibility criteria.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="primary" size="lg">
            {jobs.length} Active Drives
          </Badge>
          <Badge variant="success" size="lg">
            {highMatchCount} High Matches (≥80%)
          </Badge>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company, role, location, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Match Tier Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-600">Match:</span>
              <select
                value={matchFilter}
                onChange={(e) => setMatchFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white text-slate-700 cursor-pointer"
              >
                <option value="all">All Match Scores</option>
                <option value="high">High Match (80%+)</option>
                <option value="moderate">Moderate Match (60-79%)</option>
                <option value="low">Developing (&lt;60%)</option>
              </select>
            </div>

            {/* Type Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-600">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white text-slate-700 cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="full-time">Full-time</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Jobs Listing Grid */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => {
            const hasApplied = appliedJobIds.includes(job.id);
            const isEligibleCgpa = student ? student.cgpa >= job.minCgpa : true;

            return (
              <Card
                key={job.id}
                className="flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-xs p-5"
              >
                <div className="space-y-4">
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-50 to-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-lg shrink-0">
                        {job.company.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug">
                          {job.company}
                        </h3>
                        <p className="text-xs font-semibold text-indigo-600">{job.role}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {job.location}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-slate-600">{job.type}</span>
                        </div>
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <div className="text-right shrink-0">
                      <Badge
                        variant={
                          job.matchScore >= 80
                            ? "success"
                            : job.matchScore >= 60
                            ? "primary"
                            : "neutral"
                        }
                        size="md"
                        className="font-black text-xs"
                      >
                        {job.matchScore}% Match
                      </Badge>
                      <p className="text-[10px] text-slate-400 mt-0.5">Calibrated</p>
                    </div>
                  </div>

                  {/* Compensation & Criteria Row */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Package</span>
                      <span className="font-bold text-emerald-700 text-sm">{job.ctc}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Min CGPA</span>
                      <span className={`font-semibold ${isEligibleCgpa ? 'text-slate-800' : 'text-rose-600'}`}>
                        {job.minCgpa} {isEligibleCgpa ? '✓ Eligible' : '⚠️ Below cutoff'}
                      </span>
                    </div>
                  </div>

                  {/* Skills Match Breakdown */}
                  <div className="space-y-2 text-xs">
                    {job.matchedSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mr-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Matched:
                        </span>
                        {job.matchedSkills.map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200/60"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {job.missingSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mr-1">
                          <AlertCircle className="w-3 h-3 text-slate-400" /> Gaps:
                        </span>
                        {job.missingSkills.map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Deadline: {job.deadline}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectJob(job)}
                    >
                      View Details
                    </Button>

                    <Button
                      variant={hasApplied ? "outline" : "primary"}
                      size="sm"
                      disabled={hasApplied}
                      onClick={() => handleApply(job)}
                      className={hasApplied ? "text-emerald-700 bg-emerald-50 border-emerald-200" : ""}
                    >
                      {hasApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1" /> Applied
                        </>
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching recruitment drives</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or filter criteria to discover more campus opportunities.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSearchQuery("");
              setMatchFilter("all");
              setTypeFilter("all");
            }}
          >
            Reset Filters
          </Button>
        </Card>
      )}

      {/* Detailed Job Modal */}
      {selectedJob && (
        <Modal
          isOpen={Boolean(selectedJob)}
          onClose={() => setSelectedJob(null)}
          title={selectedJob.company}
          subtitle={`${selectedJob.role} • ${selectedJob.location}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6 text-xs sm:text-sm">
            {/* Match & CTC Summary Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Calculated Match Score</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-indigo-700">
                    {mlAnalysisResult?.hybridMatch
                      ? `${Math.round(mlAnalysisResult.hybridMatch.hybrid_match_score)}%`
                      : `${selectedJob.matchScore}%`}
                  </span>
                  <Badge
                    variant={
                      (mlAnalysisResult?.hybridMatch
                        ? Math.round(mlAnalysisResult.hybridMatch.hybrid_match_score)
                        : selectedJob.matchScore) >= 80
                        ? "success"
                        : (mlAnalysisResult?.hybridMatch
                            ? Math.round(mlAnalysisResult.hybridMatch.hybrid_match_score)
                            : selectedJob.matchScore) >= 60
                        ? "primary"
                        : "neutral"
                    }
                    size="sm"
                  >
                    {mlAnalysisResult?.mlStatus === "completed"
                      ? "AI Hybrid Match"
                      : selectedJob.matchScore >= 80
                      ? "High Compatibility"
                      : selectedJob.matchScore >= 60
                      ? "Moderate Match"
                      : "Developing"}
                  </Badge>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 font-semibold block">Annual Compensation</span>
                <span className="text-xl font-black text-emerald-700">{selectedJob.ctc}</span>
              </div>
            </div>

            {/* AI Hybrid ML Breakdown & Trigger */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    AI Match Intelligence (FastAPI ML)
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  loading={analyzingMl}
                  disabled={analyzingMl}
                  onClick={() => handleAnalyzeMatch(selectedJob.id)}
                  icon={RefreshCw}
                >
                  {mlAnalysisResult ? "Re-analyze with AI" : "Run ML Hybrid Match"}
                </Button>
              </div>

              {mlAnalysisResult ? (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-500 font-medium block">Keyword Match Coverage</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {Math.round(mlAnalysisResult.hybridMatch?.skill_coverage_score || 0)}%
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Weight: 60%</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-500 font-medium block">Semantic Similarity</span>
                      <span className="font-bold text-indigo-600 text-sm">
                        {mlAnalysisResult.hybridMatch?.semantic_similarity != null
                          ? `${Math.round(mlAnalysisResult.hybridMatch.semantic_similarity * 100)}%`
                          : "N/A"}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Weight: 40%</span>
                    </div>
                  </div>
                  {mlAnalysisResult.mlStatus === "offline" && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      ML service currently offline. Displaying deterministic keyword compatibility.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Click "Run ML Hybrid Match" to compute multi-vector semantic and keyword alignment using our FastAPI ML model.
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">Role Overview & Responsibilities</h4>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {selectedJob.description}
              </p>
            </div>

            {/* Detailed Skills Breakdown */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">Technical Competency Analysis</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Matched Skills from your profile
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.matchedSkills.length > 0 ? (
                      selectedJob.matchedSkills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200"
                        >
                          ✓ {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No direct matching skills recorded yet.</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mb-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-500" /> Target Skills for this drive
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.missingSkills.length > 0 ? (
                      selectedJob.missingSkills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200"
                        >
                          + {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-emerald-600 font-semibold">
                        All required drive skills are present in your profile!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Academic & Branch Criteria */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" /> Institutional Eligibility Rules
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 font-medium block">Minimum CGPA Requirement</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedJob.minCgpa} CGPA{" "}
                    {student && student.cgpa >= selectedJob.minCgpa ? (
                      <span className="text-emerald-600 font-semibold">(Your CGPA: {student.cgpa} ✓)</span>
                    ) : (
                      <span className="text-rose-600 font-semibold">(Your CGPA: {student?.cgpa} ✕)</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Eligible Branches</span>
                  <span className="font-semibold text-slate-800">
                    {selectedJob.allowedBranches.join(", ")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Job Type</span>
                  <span className="font-semibold text-slate-800">{selectedJob.type}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Application Deadline</span>
                  <span className="font-semibold text-slate-800">{selectedJob.deadline}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="outline" size="md" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
              <Button
                variant={appliedJobIds.includes(selectedJob.id) ? "outline" : "primary"}
                size="md"
                disabled={appliedJobIds.includes(selectedJob.id)}
                onClick={() => handleApply(selectedJob)}
                className={appliedJobIds.includes(selectedJob.id) ? "text-emerald-700 bg-emerald-50 border-emerald-200" : ""}
              >
                {appliedJobIds.includes(selectedJob.id) ? "Application Submitted" : "Submit Application"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
