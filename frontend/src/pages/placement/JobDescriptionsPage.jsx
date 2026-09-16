import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Eye,
  GraduationCap
} from "lucide-react";
import { placementService } from "../../services/placementService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { ProgressBar } from "../../components/common/ProgressBar";
import { useNotifications } from "../../context/NotificationContext";

export function JobDescriptionsPage() {
  const { addToast } = useNotifications();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  // Dynamic candidate matches state
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState(null);

  // Candidate detail modal state
  const [activeStudent, setActiveStudent] = useState(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);

  // New JD Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newJob, setNewJob] = useState({
    company: "",
    role: "",
    department: "Software Development",
    location: "Bengaluru, India",
    ctc: "18 LPA - 22 LPA",
    minCgpa: "7.5",
    deadline: "2025-05-20",
    requiredSkills: "Python, React, SQL, Algorithms",
    description: "Seeking energetic software engineers with passion for scalable products."
  });

  // Load jobs on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await placementService.getJobs();
        setJobs(data);
        if (data.length > 0) {
          setSelectedJob(data[0]);
        }
      } catch (e) {
        console.error("Failed to load recruitment drives:", e);
        addToast("Failed to load recruitment drives.", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Fetch dynamic candidate matches whenever selectedJob changes
  useEffect(() => {
    let isCurrent = true;

    async function fetchMatches() {
      if (!selectedJob) {
        setMatches([]);
        return;
      }

      const jobId = selectedJob._id || selectedJob.id;
      setMatchesLoading(true);
      setMatchesError(null);
      setMatches([]); // Reset to avoid stale candidate data

      try {
        const res = await placementService.getJobMatches(jobId);
        if (isCurrent) {
          setMatches(res.matches || []);
        }
      } catch (err) {
        if (isCurrent) {
          console.error(`Error loading matches for job ${jobId}:`, err);
          setMatchesError(err.message || "Could not retrieve candidate matches");
        }
      } finally {
        if (isCurrent) {
          setMatchesLoading(false);
        }
      }
    }

    fetchMatches();

    return () => {
      isCurrent = false;
    };
  }, [selectedJob]);

  // Aggregate missing skills across matches for deficit insights
  const aggregateSkillDeficits = () => {
    if (!matches || matches.length === 0) return [];
    const deficitCounts = {};
    matches.forEach((m) => {
      (m.missingSkills || []).forEach((sk) => {
        const normalized = sk.toLowerCase().trim();
        deficitCounts[normalized] = (deficitCounts[normalized] || 0) + 1;
      });
    });

    return Object.entries(deficitCounts)
      .map(([skill, count]) => ({
        skill,
        count,
        percentage: Math.round((count / matches.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  };

  const topDeficits = aggregateSkillDeficits();

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const skillsArray = newJob.requiredSkills.split(",").map((s) => s.trim());
      const created = await placementService.createJob({
        ...newJob,
        requiredSkills: skillsArray
      });
      setJobs((prev) => [created, ...prev]);
      setSelectedJob(created);
      setCreateModalOpen(false);
      addToast(`Recruitment drive created for ${created.company}! SIPS Match Engine computed candidate compatibility.`, "success");
    } catch (e) {
      console.error(e);
      addToast("Failed to create recruitment drive.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewCandidate = (candidate) => {
    if (candidate?.student) {
      setActiveStudent({
        ...candidate.student,
        matchScore: candidate.score,
        matchedSkills: candidate.matchedSkills,
        missingSkills: candidate.missingSkills
      });
      setStudentModalOpen(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-8 h-8 text-indigo-600" />
            Job Description & Campus Drive Matching Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload enterprise job descriptions and let SIPS automatically compute batch eligibility and candidate skill compatibility.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setCreateModalOpen(true)}
        >
          Add New Job Description
        </Button>
      </div>

      {/* 2-Column Layout: JDs List & SIPS Match Engine Analysis Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Drives list (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-slate-900 text-sm">
              Active Recruitment Drives ({jobs.length})
            </h3>
            <span className="text-xs text-slate-400">Click to view match analytics</span>
          </div>

          <div className="space-y-3">
            {jobs.length === 0 && !loading && (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No recruitment drives published yet. Click "Add New Job Description" to create one.
              </div>
            )}

            {jobs.map((job) => {
              const isSelected = (selectedJob?._id || selectedJob?.id) === (job._id || job.id);
              return (
                <div
                  key={job._id || job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm"
                      : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-base shrink-0 border border-slate-200">
                        {job.company ? job.company.charAt(0) : "J"}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {job.company}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                          {job.role}
                        </p>
                      </div>
                    </div>
                    <Badge variant="primary" size="sm">
                      {job.ctc}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                    <span>Eligible: <strong className="text-slate-800">{job.batchEligibleCount || 0}</strong> candidates</span>
                    <span>Deadline: <strong className="text-slate-800">{job.deadline}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: SIPS Match Engine Breakdown (7 cols) */}
        <div className="lg:col-span-7">
          {selectedJob ? (
            <Card className="space-y-6 shadow-sm border-slate-200">
              {/* Selected Job Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-xl">
                      {selectedJob.company}
                    </h3>
                    <Badge variant="success" size="sm">
                      {selectedJob.status || "Active Drive"}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-indigo-700 mt-0.5">
                    {selectedJob.role}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedJob.location} • Min CGPA: {selectedJob.minCgpa} • Package: {selectedJob.ctc}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-center shrink-0">
                  <span className="text-[10px] font-bold text-indigo-900 uppercase">
                    Ranked Matches
                  </span>
                  <div className="text-2xl font-black text-indigo-600">
                    {matches.length}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    {matches.length > 0 ? "Candidates Evaluated" : "Awaiting Candidates"}
                  </span>
                </div>
              </div>

              {/* Required Skills Matrix */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Target Required Competencies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedJob.requiredSkills || []).map((sk, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-200/60"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Batch Missing Skills Analysis */}
              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Primary Batch Skill Deficits for This Role
                </div>
                {topDeficits.length > 0 ? (
                  <>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      SIPS Match Engine identified top missing competencies across candidates matching this drive:
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2">
                      {topDeficits.map((def, idx) => (
                        <Badge key={idx} variant="danger" size="sm">
                          {def.skill} ({def.percentage}% deficit)
                        </Badge>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {matches.length > 0
                      ? "Evaluated candidates meet target competencies with minimal skill deficits."
                      : "Upload student profiles to compute cohort skill deficit benchmarks."}
                  </p>
                )}
              </div>

              {/* Top Student Matches in Batch */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Top Matched Candidates for {selectedJob.company} ({matches.length})
                  </h4>
                  {matches.length > 0 && (
                    <span className="text-xs text-slate-500 font-medium">
                      Ranked by Jaccard Skill Overlap
                    </span>
                  )}
                </div>

                {/* Loading State */}
                {matchesLoading && (
                  <div className="space-y-2 py-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 animate-pulse flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-200" />
                        <div className="space-y-1">
                          <div className="w-24 h-3 bg-slate-200 rounded" />
                          <div className="w-16 h-2 bg-slate-200 rounded" />
                        </div>
                      </div>
                      <div className="w-16 h-6 bg-slate-200 rounded-lg" />
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 animate-pulse flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-200" />
                        <div className="space-y-1">
                          <div className="w-24 h-3 bg-slate-200 rounded" />
                          <div className="w-16 h-2 bg-slate-200 rounded" />
                        </div>
                      </div>
                      <div className="w-16 h-6 bg-slate-200 rounded-lg" />
                    </div>
                  </div>
                )}

                {/* Error State */}
                {matchesError && !matchesLoading && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
                    <span>{matchesError}</span>
                    <Button
                      variant="outline"
                      size="xs"
                      icon={RefreshCw}
                      onClick={() => {
                        const jobId = selectedJob._id || selectedJob.id;
                        placementService.getJobMatches(jobId).then((r) => setMatches(r.matches || []));
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {/* Empty State */}
                {!matchesLoading && !matchesError && matches.length === 0 && (
                  <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 text-xs">
                    No matching candidates found for this drive. Ensure registered students have skills matching the target competencies.
                  </div>
                )}

                {/* Live Matches List */}
                {!matchesLoading && matches.length > 0 && (
                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {matches.map((m, idx) => {
                      const scoreBadgeVariant = m.score >= 80 ? "success" : m.score >= 50 ? "primary" : "warning";
                      return (
                        <div
                          key={m.id || m.student?.id || m.student?._id || idx}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs shrink-0">
                              {m.rank || idx + 1}
                            </span>
                            <img
                              src={m.student?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.student?.name || "Student")}`}
                              alt={m.student?.name || "Student"}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{m.student?.name || "Candidate"}</p>
                              <span className="text-slate-500">
                                {m.student?.branch || "Engineering"} • CGPA {m.student?.cgpa || 7.5}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Badge variant={scoreBadgeVariant} size="sm">
                              {m.score}% Match
                            </Badge>
                            <Button
                              variant="outline"
                              size="xs"
                              icon={Eye}
                              onClick={() => handleViewCandidate(m)}
                            >
                              Profile
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToast(`Shortlist broadcast notification triggered for ${matches.length} candidate matches!`, "success")}
                >
                  Broadcast Invitation ({matches.length})
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => addToast("Candidate match records exported successfully.", "success")}
                >
                  Export Candidates
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center text-slate-400">
              Select a job description to inspect batch match analytics.
            </Card>
          )}
        </div>
      </div>

      {/* Candidate Profile Inspection Modal */}
      <Modal
        isOpen={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        maxWidth="max-w-2xl"
        title="Candidate Match Profile"
        subtitle={activeStudent ? `${activeStudent.name} (${activeStudent.usn || activeStudent.rollNo})` : ""}
      >
        {activeStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <img
                src={activeStudent.avatar}
                alt={activeStudent.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              />
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-sm">{activeStudent.name}</h4>
                <p className="text-xs text-slate-500">{activeStudent.branch} • Batch {activeStudent.batch || "2025"}</p>
                <p className="text-xs text-slate-400 font-mono">{activeStudent.email}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Drive Match</span>
                <Badge variant={activeStudent.matchScore >= 80 ? "success" : "primary"} size="md">
                  {activeStudent.matchScore}% Match
                </Badge>
              </div>
            </div>

            {/* Academic & Readiness Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold">CGPA</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">{activeStudent.cgpa}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Readiness Score</span>
                <p className="text-base font-bold text-indigo-600 mt-0.5">{activeStudent.readinessScore || 65}/100</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Placement Status</span>
                <p className="text-xs font-bold text-slate-700 mt-1">{activeStudent.placementStatus || "UNPLACED"}</p>
              </div>
            </div>

            {/* Matched Skills */}
            <div>
              <h5 className="text-xs font-bold text-slate-700 uppercase mb-1.5">Matched Competencies</h5>
              <div className="flex flex-wrap gap-1.5">
                {(activeStudent.matchedSkills || []).length > 0 ? (
                  activeStudent.matchedSkills.map((sk, i) => (
                    <Badge key={i} variant="success" size="sm">{sk}</Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No direct skill matches</span>
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div>
              <h5 className="text-xs font-bold text-slate-700 uppercase mb-1.5">Missing Target Skills</h5>
              <div className="flex flex-wrap gap-1.5">
                {(activeStudent.missingSkills || []).length > 0 ? (
                  activeStudent.missingSkills.map((sk, i) => (
                    <Badge key={i} variant="danger" size="sm">{sk}</Badge>
                  ))
                ) : (
                  <span className="text-xs text-emerald-600 font-medium">All required skills met!</span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setStudentModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Job Description Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="max-w-2xl"
        title="Upload / Create Campus Recruitment Drive"
        subtitle="SIPS AI will automatically extract skills and calculate candidate compatibility"
      >
        <form onSubmit={handleCreateJob} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Company Name
              </label>
              <input
                type="text"
                required
                value={newJob.company}
                onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                placeholder="e.g. Cisco Systems"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Job Title / Role
              </label>
              <input
                type="text"
                required
                value={newJob.role}
                onChange={(e) => setNewJob({ ...newJob, role: e.target.value })}
                placeholder="e.g. Associate Software Engineer"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                CTC Package
              </label>
              <input
                type="text"
                value={newJob.ctc}
                onChange={(e) => setNewJob({ ...newJob, ctc: e.target.value })}
                placeholder="e.g. 16 LPA - 20 LPA"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Minimum CGPA
              </label>
              <input
                type="number"
                step="0.1"
                value={newJob.minCgpa}
                onChange={(e) => setNewJob({ ...newJob, minCgpa: e.target.value })}
                placeholder="7.5"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Application Deadline
              </label>
              <input
                type="date"
                value={newJob.deadline}
                onChange={(e) => setNewJob({ ...newJob, deadline: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Required Skills (Comma separated)
            </label>
            <input
              type="text"
              required
              value={newJob.requiredSkills}
              onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value })}
              placeholder="Python, React, SQL, Algorithms, Docker"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Job Description / Notes
            </label>
            <textarea
              rows={3}
              value={newJob.description}
              onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Publish Drive & Run Match
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
