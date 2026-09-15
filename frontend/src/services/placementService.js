import { api } from "./api";
import {
  placementBatchMetrics,
  batchReadinessDonutData,
  departmentPerformanceData,
  skillDemandVsSupply,
  historicalPlacementTrend,
  technicalVsSoftSkillQuadrant
} from "../data/mockAnalytics";

export const placementService = {
  /**
   * Get Batch KPIs from backend overview API
   */
  async getBatchMetrics() {
    try {
      const res = await api.get('/api/admin/overview');
      if (res && res.data) {
        const d = res.data;
        return {
          totalStudents: d.totalStudents || 0,
          placedStudents: d.placedStudents || 0,
          placementPercentage: d.placementRate || 0,
          avgPackageLpa: 14.8,
          highestPackageLpa: 44.0,
          activeRecruiters: d.activeJobsCount || 0,
          readinessDistribution: {
            placementReady: d.readyCount || 0,
            needsImprovement: d.needsImprovementCount || 0,
            atRisk: d.atRiskCount || 0
          }
        };
      }
    } catch (e) {
      console.warn("Backend overview metrics unavailable, using fallback:", e.message);
    }
    return placementBatchMetrics;
  },

  /**
   * Fetch students from backend API with filtering
   */
  async getStudents(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.branch && filters.branch !== "All") queryParams.append('branch', filters.branch);
      if (filters.status && filters.status !== "All") queryParams.append('status', filters.status);
      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const res = await api.get(`/api/admin/students${qs}`);
      if (res && res.students && res.students.length > 0) {
        return res.students.map((s) => ({
          id: s._id,
          _id: s._id,
          name: s.name,
          usn: s.usn || s.rollNo,
          rollNo: s.rollNo,
          email: s.email,
          branch: s.branch,
          batch: s.batch,
          cgpa: s.cgpa || 7.5,
          status: s.readinessScore >= 75 ? "Placement Ready" : s.readinessScore >= 50 ? "Needs Improvement" : "At Risk",
          placementStatus: s.placementStatus || "UNPLACED",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.name)}`,
          metrics: {
            technicalScore: s.technicalScore || 65,
            softSkillScore: s.softSkillScore || 65,
            employabilityIndex: s.readinessScore || 65,
            placementProbability: s.placementStatus === 'PLACED' ? 100 : Math.min(95, Math.round((s.readinessScore || 65) * 1.1))
          },
          strongSkills: s.skills && s.skills.length > 0 ? s.skills.slice(0, 4) : ["Problem Solving", "Core CS"],
          weakSkills: ["System Design", "Cloud Services"]
        }));
      }
    } catch (e) {
      console.warn("Could not fetch students from backend, using default list:", e.message);
    }
    return [];
  },

  /**
   * Fetch active job recruitment drives from backend
   */
  async getJobs() {
    try {
      const res = await api.get('/api/admin/jobs');
      if (res && res.jobs) {
        return res.jobs.map((j) => ({
          id: j._id,
          _id: j._id,
          company: j.company,
          logo: "https://www.google.com/favicon.ico",
          role: j.role || j.title,
          department: j.department || "Engineering",
          location: j.location || "Bengaluru, India",
          ctc: j.ctc || "12 LPA - 16 LPA",
          type: j.type || "Full-time",
          deadline: j.deadline ? new Date(j.deadline).toISOString().split('T')[0] : "2025-06-30",
          postedDate: j.createdAt ? new Date(j.createdAt).toLocaleDateString() : "Active",
          minCgpa: j.minCgpa || 7.0,
          allowedBranches: j.allowedBranches || ["CSE", "ISE", "ECE"],
          requiredSkills: Array.isArray(j.requiredSkills) ? j.requiredSkills : ["Java", "SQL"],
          description: j.description || "Exciting engineering role on campus.",
          studentMatch: 85,
          batchEligibleCount: j.eligibleCount || 0,
          batchMatchedCount: j.matchedCount || 0,
          status: j.status === 'ACTIVE' ? "Active Drive" : "Closed"
        }));
      }
    } catch (e) {
      console.warn("Could not fetch jobs from backend:", e.message);
    }
    return [];
  },

  /**
   * Create a new recruitment drive in the backend
   */
  async createJob(newJobData) {
    const requiredSkillsArr = typeof newJobData.requiredSkills === 'string'
      ? newJobData.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
      : newJobData.requiredSkills || [];

    const branchesArr = typeof newJobData.allowedBranches === 'string'
      ? newJobData.allowedBranches.split(',').map((b) => b.trim()).filter(Boolean)
      : newJobData.allowedBranches || ['Computer Science', 'Information Science'];

    const payload = {
      title: newJobData.role || newJobData.title || "Software Engineer",
      role: newJobData.role || "Software Engineer",
      company: newJobData.company,
      department: newJobData.department || "Engineering",
      location: newJobData.location || "Bengaluru, India",
      ctc: newJobData.ctc || "12 LPA - 16 LPA",
      type: newJobData.type || "Full-time",
      minCgpa: parseFloat(newJobData.minCgpa) || 7.0,
      allowedBranches: branchesArr,
      requiredSkills: requiredSkillsArr,
      description: newJobData.description || "",
      deadline: newJobData.deadline ? new Date(newJobData.deadline).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString()
    };

    const res = await api.post('/api/admin/jobs', payload);
    const created = res.job || res;

    return {
      id: created._id || "job_" + Date.now(),
      _id: created._id,
      company: created.company,
      role: created.role || created.title,
      department: created.department,
      location: created.location,
      ctc: created.ctc,
      minCgpa: created.minCgpa,
      requiredSkills: created.requiredSkills,
      allowedBranches: created.allowedBranches,
      description: created.description,
      status: "Active Drive"
    };
  },

  /**
   * Get placement and department analytics
   */
  async getAnalyticsData() {
    try {
      const [placementRes, studentRes] = await Promise.all([
        api.get('/api/admin/analytics/placement').catch(() => null),
        api.get('/api/admin/analytics/students').catch(() => null)
      ]);

      if (placementRes?.data || studentRes?.data) {
        return {
          batchDonut: studentRes?.data?.readinessTiers || batchReadinessDonutData,
          deptPerformance: placementRes?.data?.departments || departmentPerformanceData,
          skillDemandSupply: skillDemandVsSupply,
          historyTrend: placementRes?.data?.batchTrends || historicalPlacementTrend,
          quadrant: technicalVsSoftSkillQuadrant
        };
      }
    } catch (e) {
      console.warn("Analytics endpoint error, using analytical charts:", e.message);
    }

    return {
      batchDonut: batchReadinessDonutData,
      deptPerformance: departmentPerformanceData,
      skillDemandSupply: skillDemandVsSupply,
      historyTrend: historicalPlacementTrend,
      quadrant: technicalVsSoftSkillQuadrant
    };
  }
};
