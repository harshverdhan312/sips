import { placementBatchMetrics, batchReadinessDonutData, departmentPerformanceData, skillDemandVsSupply, historicalPlacementTrend, technicalVsSoftSkillQuadrant } from "../data/mockAnalytics";
import { mockStudentsList } from "../data/mockStudents";
import { mockJobsList } from "../data/mockJobs";

export const placementService = {
  async getBatchMetrics() {
    await new Promise((res) => setTimeout(res, 200));
    return placementBatchMetrics;
  },

  async getStudents(filters = {}) {
    await new Promise((res) => setTimeout(res, 250));
    let students = [...mockStudentsList];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.usn.toLowerCase().includes(q) ||
          s.branch.toLowerCase().includes(q)
      );
    }
    if (filters.branch && filters.branch !== "All") {
      students = students.filter((s) => s.branch.includes(filters.branch));
    }
    if (filters.status && filters.status !== "All") {
      students = students.filter((s) => s.status === filters.status);
    }
    return students;
  },

  async getJobs() {
    await new Promise((res) => setTimeout(res, 200));
    const saved = localStorage.getItem("sips_placement_jobs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return mockJobsList;
  },

  async createJob(newJobData) {
    await new Promise((res) => setTimeout(res, 400));
    const currentJobs = await this.getJobs();
    const createdJob = {
      id: "job_" + Date.now(),
      company: newJobData.company || "Campus Recruiter",
      logo: "https://www.google.com/favicon.ico",
      role: newJobData.role || "Software Engineer",
      department: newJobData.department || "Engineering",
      location: newJobData.location || "Bengaluru, India",
      ctc: newJobData.ctc || "14 LPA - 18 LPA",
      type: newJobData.type || "Full-time",
      deadline: newJobData.deadline || "2025-05-30",
      postedDate: "Just now",
      minCgpa: parseFloat(newJobData.minCgpa) || 7.0,
      allowedBranches: newJobData.allowedBranches || ["CSE", "IT"],
      requiredSkills: newJobData.requiredSkills || ["Java", "SQL", "DSA"],
      description: newJobData.description || "Exciting engineering role on campus.",
      studentMatch: 88,
      batchEligibleCount: 165,
      batchMatchedCount: 94,
      status: "Active Drive"
    };
    const updated = [createdJob, ...currentJobs];
    localStorage.setItem("sips_placement_jobs", JSON.stringify(updated));
    return createdJob;
  },

  async getAnalyticsData() {
    await new Promise((res) => setTimeout(res, 250));
    return {
      batchDonut: batchReadinessDonutData,
      deptPerformance: departmentPerformanceData,
      skillDemandSupply: skillDemandVsSupply,
      historyTrend: historicalPlacementTrend,
      quadrant: technicalVsSoftSkillQuadrant
    };
  }
};
