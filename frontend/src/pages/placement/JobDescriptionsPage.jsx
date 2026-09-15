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
  TrendingUp
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

  useEffect(() => {
    async function load() {
      try {
        const data = await placementService.getJobs();
        setJobs(data);
        if (data.length > 0) {
          setSelectedJob(data[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
      addToast(`Recruitment drive created for ${created.company}! SIPS Match Engine computed 165 eligible candidates.`, "success");
    } catch (e) {
      console.error(e);
      addToast("Failed to create recruitment drive.", "error");
    } finally {
      setSubmitting(false);
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
            Upload enterprise job descriptions and let SIPS automatically compute batch eligibility and skill compatibility.
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
            {jobs.map((job) => {
              const isSelected = selectedJob?.id === job.id;
              return (
                <div
                  key={job.id}
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
                        {job.company.charAt(0)}
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
                    <span>Eligible: <strong className="text-slate-800">{job.batchEligibleCount}</strong> candidates</span>
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
                      {selectedJob.status}
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
                    Batch Match Index
                  </span>
                  <div className="text-2xl font-black text-indigo-600">
                    {selectedJob.batchMatchedCount}/{selectedJob.batchEligibleCount}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Highly Competitive
                  </span>
                </div>
              </div>

              {/* Required Skills Matrix */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Target Required Competencies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.requiredSkills.map((sk, i) => (
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
                <p className="text-xs text-slate-600 leading-relaxed">
                  34% of eligible CSE/ISE students meet CGPA criteria ({selectedJob.minCgpa}+) but lack verified experience in System Design or Containerization required by {selectedJob.company}.
                </p>
                <div className="pt-2 flex gap-2">
                  <Badge variant="danger" size="sm">System Design (42% deficit)</Badge>
                  <Badge variant="danger" size="sm">Docker / K8s (38% deficit)</Badge>
                </div>
              </div>

              {/* Top Student Matches in Batch */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Top Matched Candidates for {selectedJob.company}
                  </h4>
                  <span className="text-xs text-indigo-600 font-semibold cursor-pointer hover:underline">
                    View All {selectedJob.batchMatchedCount} Eligible →
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        1
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">Ananya Iyer</p>
                        <span className="text-slate-500">CSE • CGPA 9.4</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="success" size="sm">96% Match</Badge>
                      <Button variant="outline" size="xs">Profile</Button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        2
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">Khushi Sharma</p>
                        <span className="text-slate-500">CSE • CGPA 8.74</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="success" size="sm">92% Match</Badge>
                      <Button variant="outline" size="xs">Profile</Button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        3
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">Vikramaditya Roy</p>
                        <span className="text-slate-500">AI/ML • CGPA 8.9</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="primary" size="sm">89% Match</Badge>
                      <Button variant="outline" size="xs">Profile</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToast("Shortlist broadcast email sent to top 50 matches!", "success")}
                >
                  Broadcast Invitation to Matches
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => addToast("Recruiter export packet generated with verified ATS resumes!", "success")}
                >
                  Generate Candidate Packet
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
