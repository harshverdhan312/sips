export const currentStudent = {
  id: "std_01",
  name: "Khushi Sharma",
  usn: "1SI21CS045",
  email: "student@sips.demo",
  branch: "Computer Science & Engineering",
  batch: "2021-2025",
  semester: "8th Semester",
  cgpa: 8.74,
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  phone: "+91 98765 43210",
  location: "Bengaluru, India",
  headline: "Aspiring Full-Stack & Cloud Software Engineer | React, Python, Distributed Systems",
  bio: "Final-year Computer Science student passionate about building scalable cloud-native architectures, intuitive user experiences, and exploring AI-assisted workflows.",
  
  // High-level placement intelligence metrics
  metrics: {
    employabilityIndex: 78,
    placementProbability: 82,
    technicalScore: 84,
    softSkillScore: 71,
    resumeScore: 88,
    interviewReadiness: 76,
    codingScore: 80,
    academicScore: 87
  },

  status: "Placement Ready", // 'Placement Ready' | 'Needs Improvement' | 'At Risk'
  
  // Coding profiles
  codingProfiles: {
    leetcode: {
      handle: "khushi_sharma",
      solved: 342,
      easy: 120,
      medium: 184,
      hard: 38,
      contestRating: 1740,
      badge: "Knight (Top 6%)"
    },
    github: {
      handle: "khushisharma-dev",
      repos: 24,
      stars: 48,
      contributions: 612
    },
    hackerrank: {
      handle: "khushisharma_cse",
      badges: ["5 Star Python", "5 Star Problem Solving", "4 Star SQL"]
    }
  },

  // Projects portfolio
  projects: [
    {
      id: "p1",
      title: "Distributed Task Queue & Workflow Orchestrator",
      tech: ["Node.js", "Redis", "Docker", "RabbitMQ"],
      description: "Designed a fault-tolerant job scheduler handling 5,000+ concurrent worker heartbeats with delayed job retries and exponential backoff.",
      link: "https://github.com/example/task-queue",
      featured: true
    },
    {
      id: "p2",
      title: "AI Clinical Document Summarizer",
      tech: ["Python", "FastAPI", "HuggingFace", "React"],
      description: "Extracted medical entities and clinical discharge summaries using fine-tuned transformer models, saving clinicians 35% review time.",
      link: "https://github.com/example/clinical-summarizer",
      featured: true
    },
    {
      id: "p3",
      title: "Campus Placement Intelligence System (SIPS UI)",
      tech: ["React", "Vite", "Tailwind CSS", "Recharts"],
      description: "Comprehensive frontend for AI-assisted placement readiness, ATS resume scoring, peer skill matching, and mock interview analytics.",
      link: "https://github.com/example/sips-ui",
      featured: true
    }
  ],

  // Certifications
  certifications: [
    { name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", date: "2024", badgeUrl: "" },
    { name: "Meta Front-End Developer Specialization", issuer: "Coursera", date: "2023", badgeUrl: "" },
    { name: "Problem Solving (Advanced)", issuer: "HackerRank", date: "2024", badgeUrl: "" }
  ],

  // Academic breakdown
  academics: {
    semesters: [
      { sem: "Sem 1", gpa: 8.4 },
      { sem: "Sem 2", gpa: 8.6 },
      { sem: "Sem 3", gpa: 8.5 },
      { sem: "Sem 4", gpa: 8.8 },
      { sem: "Sem 5", gpa: 8.9 },
      { sem: "Sem 6", gpa: 8.7 },
      { sem: "Sem 7", gpa: 9.0 }
    ],
    backlogs: 0,
    attendance: "92%"
  }
};

export const mockStudentsList = [
  currentStudent,
  {
    id: "std_02",
    name: "Rahul Verma",
    usn: "1SI21IS012",
    email: "rahul.v@sips.demo",
    branch: "Information Technology",
    batch: "2021-2025",
    cgpa: 8.2,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    metrics: {
      employabilityIndex: 72,
      placementProbability: 75,
      technicalScore: 78,
      softSkillScore: 68,
      resumeScore: 74,
      interviewReadiness: 66
    },
    status: "Needs Improvement",
    strongSkills: ["Java", "Spring Boot", "SQL"],
    weakSkills: ["React", "Cloud (AWS)", "Communication"],
    interviewsCompleted: 3
  },
  {
    id: "std_03",
    name: "Ananya Iyer",
    usn: "1SI21CS009",
    email: "ananya.i@sips.demo",
    branch: "Computer Science & Engineering",
    batch: "2021-2025",
    cgpa: 9.4,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    metrics: {
      employabilityIndex: 94,
      placementProbability: 96,
      technicalScore: 92,
      softSkillScore: 90,
      resumeScore: 95,
      interviewReadiness: 91
    },
    status: "Placement Ready",
    strongSkills: ["C++", "Algorithms", "System Design", "AWS", "Public Speaking"],
    weakSkills: ["UI Design"],
    interviewsCompleted: 9
  },
  {
    id: "std_04",
    name: "Siddharth Menon",
    usn: "1SI21EC088",
    email: "sid.menon@sips.demo",
    branch: "Electronics & Communication",
    batch: "2021-2025",
    cgpa: 6.9,
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    metrics: {
      employabilityIndex: 51,
      placementProbability: 48,
      technicalScore: 58,
      softSkillScore: 52,
      resumeScore: 54,
      interviewReadiness: 45
    },
    status: "At Risk",
    strongSkills: ["Embedded C", "Microcontrollers"],
    weakSkills: ["Data Structures", "Python", "STAR Interviews", "Resume Formatting"],
    interviewsCompleted: 1
  },
  {
    id: "std_05",
    name: "Pooja Hegde",
    usn: "1SI21CS102",
    email: "pooja.h@sips.demo",
    branch: "Computer Science & Engineering",
    batch: "2021-2025",
    cgpa: 7.8,
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    metrics: {
      employabilityIndex: 79,
      placementProbability: 80,
      technicalScore: 82,
      softSkillScore: 76,
      resumeScore: 81,
      interviewReadiness: 75
    },
    status: "Placement Ready",
    strongSkills: ["Python", "Django", "PostgreSQL", "Docker"],
    weakSkills: ["System Design", "Kubernetes"],
    interviewsCompleted: 5
  },
  {
    id: "std_06",
    name: "Vikramaditya Roy",
    usn: "1SI21AI034",
    email: "vikram.roy@sips.demo",
    branch: "Artificial Intelligence & ML",
    batch: "2021-2025",
    cgpa: 8.9,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    metrics: {
      employabilityIndex: 88,
      placementProbability: 89,
      technicalScore: 91,
      softSkillScore: 82,
      resumeScore: 86,
      interviewReadiness: 84
    },
    status: "Placement Ready",
    strongSkills: ["PyTorch", "NLP", "Python", "FastAPI", "Vector DBs"],
    weakSkills: ["DevOps", "Frontend"],
    interviewsCompleted: 6
  },
  {
    id: "std_07",
    name: "Tanvi Kulkarni",
    usn: "1SI21IS047",
    email: "tanvi.k@sips.demo",
    branch: "Information Technology",
    batch: "2021-2025",
    cgpa: 6.7,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    metrics: {
      employabilityIndex: 49,
      placementProbability: 44,
      technicalScore: 52,
      softSkillScore: 56,
      resumeScore: 48,
      interviewReadiness: 42
    },
    status: "At Risk",
    strongSkills: ["HTML", "CSS", "Basic JS"],
    weakSkills: ["SQL", "OOP Concepts", "Algorithms", "Confidence"],
    interviewsCompleted: 1
  },
  {
    id: "std_08",
    name: "Aditya Chopra",
    usn: "1SI21CS018",
    email: "aditya.c@sips.demo",
    branch: "Computer Science & Engineering",
    batch: "2021-2025",
    cgpa: 8.3,
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    metrics: {
      employabilityIndex: 81,
      placementProbability: 84,
      technicalScore: 86,
      softSkillScore: 74,
      resumeScore: 82,
      interviewReadiness: 78
    },
    status: "Placement Ready",
    strongSkills: ["Go", "Kubernetes", "Microservices", "gRPC"],
    weakSkills: ["Frontend", "STAR Method"],
    interviewsCompleted: 4
  }
];
