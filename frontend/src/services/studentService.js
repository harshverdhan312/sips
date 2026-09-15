import { currentStudent, mockStudentsList } from "../data/mockStudents";
import { mockSkillsData, radarSkillCategoryData } from "../data/mockSkills";

export const studentService = {
  // Simulates fetching logged in student data
  async getCurrentStudent() {
    await new Promise((res) => setTimeout(res, 200));
    const saved = localStorage.getItem("sips_current_student");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return currentStudent;
  },

  async updateCurrentStudent(updatedFields) {
    await new Promise((res) => setTimeout(res, 300));
    const current = await this.getCurrentStudent();
    const merged = { ...current, ...updatedFields };
    localStorage.setItem("sips_current_student", JSON.stringify(merged));
    return merged;
  },

  async getSkillsData(category = "All") {
    await new Promise((res) => setTimeout(res, 150));
    if (!category || category === "All") {
      return mockSkillsData;
    }
    return mockSkillsData.filter((s) => s.category === category);
  },

  async getRadarData() {
    await new Promise((res) => setTimeout(res, 150));
    return radarSkillCategoryData;
  },

  async getReadinessBreakdown() {
    await new Promise((res) => setTimeout(res, 200));
    const student = await this.getCurrentStudent();
    return {
      metrics: student.metrics,
      weights: [
        { factor: "Technical Proficiency", weight: "30%", score: student.metrics.technicalScore, status: "Good" },
        { factor: "Soft Skills & Communication", weight: "20%", score: student.metrics.softSkillScore, status: "Moderate" },
        { factor: "Resume & ATS Optimization", weight: "20%", score: student.metrics.resumeScore, status: "Strong" },
        { factor: "Coding Profile (LeetCode/GH)", weight: "15%", score: student.metrics.codingScore, status: "Strong" },
        { factor: "Academic CGPA (8.74/10)", weight: "15%", score: student.metrics.academicScore, status: "Strong" }
      ],
      positiveFactors: [
        "Consistent 8.7+ CGPA across 7 university semesters with zero backlogs",
        "Ranked Knight (Top 6%) on LeetCode with 340+ solved algorithmic problems",
        "Clean ATS resume format scoring 88/100 with clear quantifiable project metrics",
        "Strong verified competencies in Python, React, and REST API development"
      ],
      negativeFactors: [
        "Speech pace fluctuates during behavioral interviews (needs consistent 130-140 WPM)",
        "20% knowledge gap in Containerization (Docker) and AWS Cloud Services",
        "STAR behavioral responses need more concrete individual 'Action' statements",
        "System design scalability (sharding, caching topologies) needs practical drills"
      ]
    };
  }
};
