import { interviewRoles, interviewQuestionsBank, sampleInterviewReport } from "../data/mockInterviews";

export const interviewService = {
  async getRoles() {
    await new Promise((res) => setTimeout(res, 100));
    return interviewRoles;
  },

  async getQuestionsForRole(role = "Full Stack Software Engineer") {
    await new Promise((res) => setTimeout(res, 200));
    return interviewQuestionsBank[role] || interviewQuestionsBank["Full Stack Software Engineer"];
  },

  async submitInterviewSession(sessionData) {
    await new Promise((res) => setTimeout(res, 1500));
    return {
      ...sampleInterviewReport,
      role: sessionData.role || sampleInterviewReport.role,
      date: "Just now",
      overallScore: Math.floor(Math.random() * 8) + 80 // 80-87
    };
  },

  async getLatestReport() {
    await new Promise((res) => setTimeout(res, 200));
    return sampleInterviewReport;
  }
};
