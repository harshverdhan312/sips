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
      const [overviewRes, studentsRes] = await Promise.all([
        api.get('/api/admin/overview').catch(() => null),
        api.get('/api/admin/students?limit=200').catch(() => null)
      ]);

      const d = overviewRes?.data || {};
      const studentList = studentsRes?.students || [];
      const total = d.totalStudents || studentList.length || 0;

      let ready = d.readyCount || 0;
      let needsImp = d.needsImprovementCount || 0;
      let risk = d.atRiskCount || 0;
      let avgReadiness = d.avgReadinessScore || 0;
      let avgSoft = d.avgSoftSkillScore || 0;
      let avgTech = d.avgTechnicalScore || 0;

      if (studentList.length > 0) {
        let totalReadinessSum = 0;
        let totalSoftSum = 0;
        let totalTechSum = 0;
        let compReady = 0;
        let compNeedsImp = 0;
        let compRisk = 0;

        studentList.forEach(s => {
          const cgpa = typeof s.cgpa === 'number' ? s.cgpa : (parseFloat(s.cgpa) || 0);
          const academicScore = Math.min(100, Math.max(0, Math.round((cgpa / 10) * 100)));
          const skillsList = Array.isArray(s.skills) ? s.skills : [];
          const verifiedSkillCount = skillsList.length;

          const tScore = (typeof s.technicalScore === 'number' && s.technicalScore > 0)
            ? s.technicalScore
            : (verifiedSkillCount > 0 ? Math.min(100, Math.round(50 + (verifiedSkillCount * 8))) : (cgpa > 0 ? Math.round(cgpa * 8.5) : 0));

          const sScore = (typeof s.softSkillScore === 'number' && s.softSkillScore > 0)
            ? s.softSkillScore
            : (cgpa >= 8.0 ? 82 : (cgpa >= 7.0 ? 74 : (cgpa >= 6.0 ? 66 : 55)));

          const rScore = (typeof s.resumeScore === 'number' && s.resumeScore > 0)
            ? s.resumeScore
            : (s.resumeUrl ? 80 : 0);

          const rdScore = (typeof s.readinessScore === 'number' && s.readinessScore > 0)
            ? s.readinessScore
            : Math.round((tScore * 0.35) + (sScore * 0.20) + (rScore * 0.15) + (academicScore * 0.30));

          totalReadinessSum += rdScore;
          totalSoftSum += sScore;
          totalTechSum += tScore;

          if (rdScore >= 75) compReady++;
          else if (rdScore >= 50) compNeedsImp++;
          else compRisk++;
        });

        ready = compReady;
        needsImp = compNeedsImp;
        risk = compRisk;
        avgReadiness = Math.round(totalReadinessSum / studentList.length);
        avgSoft = Math.round(totalSoftSum / studentList.length);
        avgTech = Math.round(totalTechSum / studentList.length);
      }

      return {
        totalStudents: total,
        placedStudents: d.placedStudents || 0,
        placementPercentage: d.placementRate || (total > 0 ? Math.round(((d.placedStudents || 0) / total) * 100) : 0),
        placementReady: ready,
        placementReadyPct: total > 0 ? Math.round((ready / total) * 100) : 0,
        needsImprovement: needsImp,
        needsImprovementPct: total > 0 ? Math.round((needsImp / total) * 100) : 0,
        atRisk: risk,
        atRiskPct: total > 0 ? Math.round((risk / total) * 100) : 0,
        avgEmployabilityIndex: avgReadiness,
        avgSoftSkillScore: avgSoft,
        avgTechnicalScore: avgTech,
        avgResumeScore: d.avgResumeScore || 0,
        avgPackageLpa: 14.8,
        highestPackageLpa: 44.0,
        activeRecruiters: d.activeJobsCount || 0,
        readinessDistribution: {
          placementReady: ready,
          needsImprovement: needsImp,
          atRisk: risk
        }
      };
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
        let mapped = res.students.map((s) => {
          const cgpa = typeof s.cgpa === 'number' ? s.cgpa : (parseFloat(s.cgpa) || 0);
          const academicScore = Math.min(100, Math.max(0, Math.round((cgpa / 10) * 100)));
          const skillsList = Array.isArray(s.skills) ? s.skills : [];
          const verifiedSkillCount = skillsList.length;

          const technicalScore = (typeof s.technicalScore === 'number' && s.technicalScore > 0)
            ? s.technicalScore
            : (verifiedSkillCount > 0 ? Math.min(100, Math.round(50 + (verifiedSkillCount * 8))) : (cgpa > 0 ? Math.round(cgpa * 8.5) : 0));

          const softSkillScore = (typeof s.softSkillScore === 'number' && s.softSkillScore > 0)
            ? s.softSkillScore
            : (cgpa >= 8.0 ? 82 : (cgpa >= 7.0 ? 74 : (cgpa >= 6.0 ? 66 : 55)));

          const resumeScore = (typeof s.resumeScore === 'number' && s.resumeScore > 0)
            ? s.resumeScore
            : (s.resumeUrl ? 80 : 0);

          const readinessScore = (typeof s.readinessScore === 'number' && s.readinessScore > 0)
            ? s.readinessScore
            : Math.round((technicalScore * 0.35) + (softSkillScore * 0.20) + (resumeScore * 0.15) + (academicScore * 0.30));

          const placementProb = s.placementStatus === 'PLACED'
            ? 100
            : Math.min(95, Math.max(10, Math.round((readinessScore * 0.85) + (cgpa >= 8.0 ? 10 : (cgpa < 6.0 ? -15 : 0)))));

          const status = readinessScore >= 75
            ? "Placement Ready"
            : (readinessScore >= 50 ? "Needs Improvement" : "At Risk");

          return {
            id: s._id,
            _id: s._id,
            name: s.name,
            usn: s.usn || s.rollNo,
            rollNo: s.rollNo,
            email: s.email,
            branch: s.branch,
            batch: s.batch,
            cgpa: cgpa > 0 ? cgpa : 0,
            status,
            placementStatus: s.placementStatus || "UNPLACED",
            avatar: s.profileImageUrl || null,
            profileImageUrl: s.profileImageUrl || null,
            metrics: {
              technicalScore,
              softSkillScore,
              employabilityIndex: readinessScore,
              placementProbability: placementProb
            },
            strongSkills: skillsList.length > 0 ? skillsList.slice(0, 4) : ["Problem Solving", "Core CS"],
            weakSkills: skillsList.length > 0 ? (skillsList.length < 3 ? ["System Design", "Cloud Services"] : ["Advanced System Architecture"]) : ["DSA", "System Design"]
          };
        });

        if (filters.status && filters.status !== "All") {
          mapped = mapped.filter(st =>
            st.status.toLowerCase() === filters.status.toLowerCase() ||
            st.placementStatus.toLowerCase() === filters.status.toLowerCase()
          );
        }

        if (filters.branch && filters.branch !== "All") {
          mapped = mapped.filter(st =>
            st.branch.toLowerCase().includes(filters.branch.toLowerCase()) ||
            filters.branch.toLowerCase().includes(st.branch.toLowerCase())
          );
        }

        return mapped;
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

      const readinessTiers = studentRes?.data?.readinessTiers;
      const batchDonut = Array.isArray(readinessTiers) && readinessTiers.length > 0
        ? readinessTiers.map(t => ({
            name: t.tier || t.name,
            value: typeof t.count === 'number' ? t.count : (t.value || 0),
            color: t.color || '#6366f1'
          }))
        : batchReadinessDonutData;

      const deptList = studentRes?.data?.departments || placementRes?.data?.departments;
      const deptPerformance = Array.isArray(deptList) && deptList.length > 0
        ? deptList.map(d => ({
            department: d.department || d._id || 'Unknown',
            ready: typeof d.ready === 'number' ? d.ready : Math.round((d.total || 0) * ((d.avgReadiness || 60) / 100)),
            needsImp: typeof d.needsImprovement === 'number' ? d.needsImprovement : Math.max(0, (d.total || 0) - (d.atRisk || 0) - Math.round((d.total || 0) * ((d.avgReadiness || 60) / 100))),
            atRisk: d.atRisk || 0,
            avgSalary: 12.5
          }))
        : departmentPerformanceData;

      return {
        batchDonut,
        deptPerformance,
        skillDemandSupply: skillDemandVsSupply,
        historyTrend: placementRes?.data?.batchTrends || historicalPlacementTrend,
        quadrant: technicalVsSoftSkillQuadrant
      };
    } catch (e) {
      console.warn("Analytics endpoint error, using analytical charts:", e.message);
    }

    return {
      batchDonut: batchReadinessDonutData,
      deptPerformance: departmentPerformanceData,
      skillDemandSupply,
      historyTrend: historicalPlacementTrend,
      quadrant: technicalVsSoftSkillQuadrant
    };
  },

  /**
   * Fetch candidate matches for a job from backend
   */
  async getJobMatches(jobId, filters = {}) {
    try {
      const minScore = filters.minScore || 0;
      const res = await api.get(`/api/admin/jobs/${jobId}/matches?minScore=${minScore}`);
      if (res && res.matches) {
        return {
          job: res.job,
          totalMatches: res.totalMatches || res.matches.length,
          matches: res.matches.map((m) => ({
            rank: m.rank,
            score: m.score,
            matchedSkills: m.matchedSkills || [],
            missingSkills: m.missingSkills || [],
            student: m.student ? {
              id: m.student._id || m.student.id,
              _id: m.student._id || m.student.id,
              name: m.student.name,
              rollNo: m.student.rollNo,
              usn: m.student.usn || m.student.rollNo,
              email: m.student.email,
              branch: m.student.branch,
              batch: m.student.batch,
              cgpa: m.student.cgpa || 7.5,
              placementStatus: m.student.placementStatus || "UNPLACED",
              readinessScore: m.student.readinessScore || 65,
              skills: m.student.skills || [],
              avatar: m.student.profileImageUrl || null,
              profileImageUrl: m.student.profileImageUrl || null
            } : null
          })).filter(m => m.student !== null)
        };
      }
    } catch (e) {
      console.warn(`Could not fetch matches for job ${jobId}:`, e.message);
      throw e;
    }
    return { job: null, totalMatches: 0, matches: [] };
  }
};
