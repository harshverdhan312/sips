import { api } from "./api";
import { mockSkillsData, radarSkillCategoryData } from "../data/mockSkills";

export const studentService = {
  /**
   * Fetch logged-in student profile from backend
   */
  async getCurrentStudent() {
    try {
      const student = await api.get('/api/student/profile');
      if (student) {
        const readiness = student.readinessScore || 0;
        const status = readiness >= 80 ? "Tier-1 Contender • Placement Ready" : (readiness >= 60 ? "Tier-2 Candidate • Developing" : "Tier-3 • Needs Preparation");
        return {
          id: student._id,
          _id: student._id,
          name: student.name,
          usn: student.usn || student.rollNo,
          rollNo: student.rollNo,
          email: student.email,
          branch: student.branch,
          batch: student.batch,
          semester: "8th Semester",
          cgpa: student.cgpa || 7.5,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name)}`,
          phone: "+91 98765 43210",
          location: "Campus Resident",
          headline: `Candidate | ${student.branch}`,
          bio: "Student pursuing engineering degree with focus on software development and data structures.",
          status,
          readinessScore: readiness,
          github: student.github || "",
          resumeUrl: student.resumeUrl || "",
          skills: Array.isArray(student.skills) ? student.skills : [],
          metrics: {
            employabilityIndex: readiness || 70,
            placementProbability: student.placementStatus === 'PLACED' ? 100 : Math.min(95, Math.round((readiness || 70) * 1.1)),
            technicalScore: student.technicalScore || 70,
            softSkillScore: student.softSkillScore || 65,
            resumeScore: student.resumeScore || 75,
            interviewReadiness: 70,
            codingScore: 75,
            academicScore: Math.round((student.cgpa || 7.5) * 10)
          },
          codingProfiles: {
            leetcode: { handle: "candidate_dev", solved: 180, easy: 90, medium: 80, hard: 10, contestRating: 1540, badge: "Knight" },
            github: { handle: student.github || "candidate-gh", repos: 12, stars: 18, contributions: 240 },
            hackerrank: { handle: "candidate_hr", badges: ["5 Star Problem Solving"] }
          },
          projects: [
            {
              id: "p1",
              title: "Engineering Domain Capstone Project",
              tech: ["React", "Node.js", "MongoDB"],
              description: "Designed and implemented end-to-end fullstack platform with real-time state sync and REST APIs.",
              link: "https://github.com"
            }
          ]
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
      const res = await api.put('/api/student/profile', {
        skills: updatedFields.skills,
        github: updatedFields.github,
        newPassword: updatedFields.newPassword
      });
      return res.student || res;
    } catch (e) {
      console.error("Failed to update student profile:", e);
      throw e;
    }
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
          role: j.role || j.title,
          department: j.department || "Engineering",
          location: j.location || "Bengaluru, India",
          ctc: j.ctc || "12 LPA - 16 LPA",
          type: j.type || "Full-time",
          deadline: j.deadline ? new Date(j.deadline).toISOString().split('T')[0] : "2025-06-30",
          minCgpa: j.minCgpa ?? 7.0,
          allowedBranches: Array.isArray(j.allowedBranches) ? j.allowedBranches : ["Computer Science & Engineering"],
          requiredSkills: Array.isArray(j.requiredSkills) ? j.requiredSkills : [],
          description: j.description || "Campus recruitment drive for engineering graduates.",
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

  async getSkillsData(category = "All") {
    if (!category || category === "All") {
      return mockSkillsData;
    }
    return mockSkillsData.filter((s) => s.category === category);
  },

  async getRadarData() {
    return radarSkillCategoryData;
  },

  async getReadinessBreakdown() {
    const student = await this.getCurrentStudent();
    const metrics = student?.metrics || {
      technicalScore: 70,
      softSkillScore: 65,
      resumeScore: 75,
      codingScore: 70,
      academicScore: 75
    };

    return {
      metrics,
      weights: [
        { factor: "Technical Proficiency", weight: "30%", score: metrics.technicalScore, status: "Good" },
        { factor: "Soft Skills & Communication", weight: "20%", score: metrics.softSkillScore, status: "Moderate" },
        { factor: "Resume & ATS Optimization", weight: "20%", score: metrics.resumeScore, status: "Strong" },
        { factor: "Coding Profile", weight: "15%", score: metrics.codingScore, status: "Good" },
        { factor: "Academic CGPA", weight: "15%", score: metrics.academicScore, status: "Strong" }
      ],
      positiveFactors: [
        "Consistent academic performance across degree semesters",
        "Clean ATS resume format scoring high compatibility",
        "Verified competencies in core branch technologies"
      ],
      negativeFactors: [
        "Practice mock interview speech pacing (130-140 WPM)",
        "Deepen practical hands-on experience in cloud architectures",
        "Structure STAR responses with specific action impact statements"
      ]
    };
  }
};
