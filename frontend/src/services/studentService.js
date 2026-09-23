import { api } from "./api";

export const studentService = {
  /**
   * Fetch logged-in student profile from backend
   */
  async getCurrentStudent() {
    try {
      const student = await api.get('/api/student/profile');
      if (student) {
        const skillsList = Array.isArray(student.skills) ? student.skills : [];
        const technicalScore = typeof student.technicalScore === 'number' && student.technicalScore > 0
          ? student.technicalScore
          : (skillsList.length > 0 ? Math.min(95, Math.max(50, skillsList.length * 20)) : 0);
        const resumeScore = typeof student.resumeScore === 'number' && student.resumeScore > 0
          ? student.resumeScore
          : (student.resumeUrl ? 85 : 0);
        const softSkillScore = typeof student.softSkillScore === 'number' && student.softSkillScore > 0
          ? student.softSkillScore
          : (skillsList.length > 0 ? 70 : 0);
        const academicScore = Math.round((student.cgpa || 0) * 10);
        
        const readiness = typeof student.readinessScore === 'number' && student.readinessScore > 0
          ? student.readinessScore
          : Math.round((technicalScore * 0.3) + (softSkillScore * 0.2) + (resumeScore * 0.2) + (academicScore * 0.3));

        const status = readiness >= 75
          ? "Tier-1 Contender • Placement Ready"
          : (readiness >= 50 ? "Tier-2 Candidate • Developing" : "Tier-3 • Needs Preparation");

        // Fetch latest real ML placement prediction if available
        let placementProbability = student.placementStatus === 'PLACED' ? 100 : readiness;
        try {
          const predRes = await api.get('/api/student/analytics/placement/prediction').catch(() => null);
          if (predRes?.prediction?.placement_probability !== undefined && predRes.prediction.placement_probability !== null) {
            placementProbability = Math.round(predRes.prediction.placement_probability * 100);
          }
        } catch (_) {}

        return {
          id: student._id,
          _id: student._id,
          name: student.name || "",
          usn: student.usn || student.rollNo || "Not assigned",
          rollNo: student.rollNo || "",
          email: student.email || "",
          branch: student.branch || "",
          batch: student.batch || "",
          semester: student.batch ? `${student.batch} Batch` : "Campus Student",
          cgpa: typeof student.cgpa === 'number' ? student.cgpa : 0.0,
          placementStatus: student.placementStatus || "Not Placed",
          avatar: student.profileImageUrl || student.avatarUrl || null,
          profileImageUrl: student.profileImageUrl || null,
          phone: "Not available",
          location: "Not available",
          headline: student.branch ? `Candidate | ${student.branch}` : "Engineering Student",
          bio: "Student profile synchronized with university campus placement portal.",
          status,
          readinessScore: readiness,
          github: student.github || "",
          resumeUrl: student.resumeUrl || "",
          skills: skillsList,
          age: typeof student.age === 'number' ? student.age : null,
          internships: typeof student.internships === 'number' ? student.internships : null,
          hostel: typeof student.hostel === 'boolean' ? student.hostel : null,
          historyOfBacklogs: typeof student.historyOfBacklogs === 'number' ? student.historyOfBacklogs : null,
          metrics: {
            employabilityIndex: readiness,
            placementProbability,
            technicalScore,
            softSkillScore,
            resumeScore,
            interviewReadiness: readiness,
            codingScore: technicalScore,
            academicScore
          },
          codingProfiles: {
            github: { handle: student.github || "Not linked", verified: Boolean(student.github) }
          },
          projects: []
        };
      }
    } catch (e) {
      console.warn("Could not fetch student profile from backend:", e.message);
    }

    return null;
  },

  /**
   * Update student profile fields in backend
   */
  async updateCurrentStudent(updatedFields) {
    try {
      const res = await api.put('/api/student/profile', updatedFields);
      return res.student || res;
    } catch (e) {
      console.error("Failed to update student profile:", e);
      throw e;
    }
  },

  /**
   * Fetch current/latest placement prediction from backend
   */
  async getPlacementPrediction() {
    try {
      const res = await api.get('/api/student/analytics/placement/prediction');
      return res?.prediction || null;
    } catch (e) {
      console.warn("Could not fetch placement prediction:", e.message);
      return null;
    }
  },

  /**
   * Request/calculate placement prediction via ML pipeline
   */
  async requestPlacementPrediction() {
    try {
      const res = await api.post('/api/student/analytics/placement/predict');
      return res?.prediction || res;
    } catch (e) {
      console.error("Failed to calculate placement prediction:", e);
      throw e;
    }
  },

  /**
   * Upload profile image to backend
   */
  async uploadProfileImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    return await api.postMultipart('/api/student/profile/image', formData);
  },

  /**
   * Delete profile image from backend
   */
  async deleteProfileImage() {
    return await api.delete('/api/student/profile/image');
  },

  /**
   * Upload PDF resume to backend
   */
  async uploadResume(file) {
    const formData = new FormData();
    formData.append('resume', file);
    return await api.postMultipart('/api/student/resume', formData);
  },

  /**
   * Fetch active recruitment drives with student-specific match scores from backend
   */
  async getStudentJobs() {
    try {
      const res = await api.get('/api/student/jobs');
      if (Array.isArray(res)) {
        return res.map((j) => ({
          id: j._id || j.id,
          _id: j._id,
          company: j.company,
          role: j.role || j.title || "Software Engineer",
          department: j.department || "Engineering",
          location: j.location || "Bengaluru, India",
          ctc: j.ctc || "Competitive",
          type: j.type || "Full-time",
          deadline: j.deadline ? new Date(j.deadline).toISOString().split('T')[0] : "Active Drive",
          minCgpa: j.minCgpa ?? 0,
          allowedBranches: Array.isArray(j.allowedBranches) ? j.allowedBranches : [],
          requiredSkills: Array.isArray(j.requiredSkills) ? j.requiredSkills : [],
          description: j.description || "",
          matchScore: typeof j.matchScore === 'number' ? j.matchScore : 0,
          matchedSkills: Array.isArray(j.matchedSkills) ? j.matchedSkills : [],
          missingSkills: Array.isArray(j.missingSkills) ? j.missingSkills : [],
          status: j.status || 'ACTIVE'
        }));
      }
    } catch (e) {
      console.warn("Could not fetch student jobs:", e.message);
    }
    return [];
  },

  /**
   * Run ML Hybrid Match Analysis for a specific job
   */
  async analyzeJobMatch(jobId) {
    try {
      const res = await api.post(`/api/student/jobs/${jobId}/analyze-match`);
      return res;
    } catch (e) {
      console.error("Could not analyze job match:", e);
      throw e;
    }
  },

  async getSkillsData(category = "All") {
    const student = await this.getCurrentStudent();
    if (!student || !Array.isArray(student.skills) || student.skills.length === 0) {
      return [];
    }
    return student.skills.map((name, idx) => ({
      id: `skill_${idx}`,
      name,
      category: "Technical Skills",
      level: "Verified",
      score: student.metrics?.technicalScore || 80,
      verified: true
    }));
  },

  async getRadarData() {
    const student = await this.getCurrentStudent();
    if (!student) return [];
    const metrics = student.metrics || {};
    return [
      {
        subject: "Technical Depth",
        A: metrics.technicalScore || 0,
        B: 75,
        score: metrics.technicalScore || 0,
        benchmark: 75,
        fullMark: 100
      },
      {
        subject: "Soft Skills",
        A: metrics.softSkillScore || 0,
        B: 70,
        score: metrics.softSkillScore || 0,
        benchmark: 70,
        fullMark: 100
      },
      {
        subject: "Resume / ATS",
        A: metrics.resumeScore || 0,
        B: 80,
        score: metrics.resumeScore || 0,
        benchmark: 80,
        fullMark: 100
      },
      {
        subject: "Academic Standing",
        A: metrics.academicScore || 0,
        B: 75,
        score: metrics.academicScore || 0,
        benchmark: 75,
        fullMark: 100
      },
      {
        subject: "Overall Readiness",
        A: student.readinessScore || 0,
        B: 80,
        score: student.readinessScore || 0,
        benchmark: 80,
        fullMark: 100
      }
    ];
  },

  async getReadinessBreakdown() {
    const student = await this.getCurrentStudent();
    if (!student) return null;
    const metrics = student.metrics || {
      technicalScore: 0,
      softSkillScore: 0,
      resumeScore: 0,
      codingScore: 0,
      academicScore: 0
    };

    return {
      metrics,
      weights: [
        { factor: "Technical Depth", weight: "30%", score: metrics.technicalScore, status: metrics.technicalScore >= 75 ? "Good" : "Needs Review" },
        { factor: "Soft Skills & Communication", weight: "20%", score: metrics.softSkillScore, status: metrics.softSkillScore >= 70 ? "Good" : "Moderate" },
        { factor: "Resume & ATS Optimization", weight: "20%", score: metrics.resumeScore, status: metrics.resumeScore >= 75 ? "Strong" : "Upload Pending" },
        { factor: "Academic CGPA", weight: "30%", score: metrics.academicScore, status: metrics.academicScore >= 70 ? "Strong" : "Moderate" }
      ],
      positiveFactors: [
        student.cgpa > 0 ? `Verified academic CGPA of ${student.cgpa.toFixed(2)}` : "Enrolled candidate in degree program",
        student.resumeUrl ? "Verified PDF resume synced to recruitment server" : "Profile created in placement cell database",
        student.skills.length > 0 ? `${student.skills.length} verified technical skills mapped to matching engine` : "Profile registered for campus placement drives"
      ],
      negativeFactors: [
        student.skills.length === 0 ? "Add verified technical skills from your Profile to compute drive eligibility" : "Keep verified skills up to date",
        !student.resumeUrl ? "Upload your PDF resume from your Profile to enable placement applications" : "Ensure resume reflects recent project experiences",
        !student.github ? "Connect your GitHub profile handle to verify project contributions" : "Maintain active repository commits"
      ]
    };
  }
};
