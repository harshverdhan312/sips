export const placementBatchMetrics = {
  totalStudents: 480,
  placementReady: 312,
  placementReadyPct: 65,
  needsImprovement: 124,
  needsImprovementPct: 26,
  atRisk: 44,
  atRiskPct: 9,
  avgEmployabilityIndex: 74.2,
  avgSoftSkillScore: 68.5,
  avgTechnicalScore: 76.8,
  resumesParsed: 468,
  mockInterviewsConducted: 890,
  activeDrives: 18,
  offersReleased: 215,
  highestPackage: "44 LPA (Amazon)",
  avgPackage: "11.4 LPA"
};

export const batchReadinessDonutData = [
  { name: "Placement Ready", value: 312, color: "#10b981" },
  { name: "Needs Improvement", value: 124, color: "#f59e0b" },
  { name: "At Risk", value: 44, color: "#ef4444" }
];

export const departmentPerformanceData = [
  { department: "CSE", total: 180, ready: 135, needsImp: 35, atRisk: 10, avgScore: 81 },
  { department: "ISE", total: 120, ready: 82, needsImp: 28, atRisk: 10, avgScore: 76 },
  { department: "AI/ML", total: 60, ready: 45, needsImp: 12, atRisk: 3, avgScore: 82 },
  { department: "ECE", total: 80, ready: 38, needsImp: 31, atRisk: 11, avgScore: 68 },
  { department: "EEE/Mech", total: 40, ready: 12, needsImp: 18, atRisk: 10, avgScore: 59 }
];

export const skillDemandVsSupply = [
  { skill: "Data Structures & Algos", industryDemand: 95, studentSupply: 78, gap: 17 },
  { skill: "System Design & Architecture", industryDemand: 88, studentSupply: 48, gap: 40 },
  { skill: "Cloud (AWS / Azure)", industryDemand: 82, studentSupply: 52, gap: 30 },
  { skill: "Docker / Kubernetes", industryDemand: 75, studentSupply: 45, gap: 30 },
  { skill: "SQL & Query Optimization", industryDemand: 85, studentSupply: 69, gap: 16 },
  { skill: "STAR Behavioral Interviews", industryDemand: 90, studentSupply: 62, gap: 28 },
  { skill: "React / Modern Frontend", industryDemand: 80, studentSupply: 74, gap: 6 },
  { skill: "Python / Scripting", industryDemand: 85, studentSupply: 82, gap: 3 }
];

export const historicalPlacementTrend = [
  { year: "2021", placementPct: 78, avgLpa: 7.5, highestLpa: 28 },
  { year: "2022", placementPct: 83, avgLpa: 8.8, highestLpa: 36 },
  { year: "2023", placementPct: 81, avgLpa: 9.4, highestLpa: 40 },
  { year: "2024", placementPct: 86, avgLpa: 10.2, highestLpa: 42 },
  { year: "2025 (Projected)", placementPct: 91, avgLpa: 11.8, highestLpa: 44 }
];

export const technicalVsSoftSkillQuadrant = [
  { name: "Khushi Sharma", tech: 84, soft: 71, dept: "CSE", status: "Ready" },
  { name: "Ananya Iyer", tech: 92, soft: 90, dept: "CSE", status: "Ready" },
  { name: "Rahul Verma", tech: 78, soft: 68, dept: "ISE", status: "Needs Improvement" },
  { name: "Siddharth Menon", tech: 58, soft: 52, dept: "ECE", status: "At Risk" },
  { name: "Pooja Hegde", tech: 82, soft: 76, dept: "CSE", status: "Ready" },
  { name: "Vikramaditya Roy", tech: 91, soft: 82, dept: "AIML", status: "Ready" },
  { name: "Tanvi Kulkarni", tech: 52, soft: 56, dept: "ISE", status: "At Risk" },
  { name: "Aditya Chopra", tech: 86, soft: 74, dept: "CSE", status: "Ready" }
];
