export const interviewRoles = [
  "Full Stack Software Engineer",
  "Frontend Developer (React)",
  "Backend Engineer (Node/Python)",
  "Cloud & DevOps Engineer",
  "Data Scientist / AI Engineer",
  "Campus Behavioral & HR Fitment"
];

export const interviewQuestionsBank = {
  "Full Stack Software Engineer": [
    {
      id: "q1",
      question: "Can you explain how the JavaScript Event Loop handles asynchronous operations such as Promises and setTimeout?",
      category: "Technical",
      expectedKeywords: ["Call stack", "Microtask queue", "Callback queue", "Event loop", "Promise.then"],
      idealDurationSec: 120,
      tips: "Distinguish microtasks (Promises, queueMicrotask) from macrotasks (setTimeout, setInterval)."
    },
    {
      id: "q2",
      question: "Tell me about a complex project where you had to optimize API response times or database queries. What was your approach?",
      category: "Behavioral & Architecture",
      expectedKeywords: ["Indexing", "Caching", "Profiling", "Latency reduction", "Benchmarking"],
      idealDurationSec: 150,
      tips: "Use the STAR framework: Situation, Task, Action taken with technical details, and quantifiable Result."
    },
    {
      id: "q3",
      question: "How do you ensure state consistency and avoid race conditions when multiple microservices update related records?",
      category: "System Design",
      expectedKeywords: ["Saga pattern", "2-Phase commit", "Idempotency", "Eventual consistency", "Message broker"],
      idealDurationSec: 180,
      tips: "Discuss trade-offs between ACID strong consistency vs CAP theorem eventual consistency."
    }
  ],
  "Frontend Developer (React)": [
    {
      id: "q1",
      question: "What is the difference between React 18 Concurrent features (like useTransition, Suspense) and traditional rendering?",
      category: "Technical",
      expectedKeywords: ["Fiber", "Interruptible rendering", "useTransition", "Suspense", "Priority scheduling"],
      idealDurationSec: 120,
      tips: "Highlight how non-urgent state updates avoid locking the main browser thread."
    },
    {
      id: "q2",
      question: "Describe a situation where a component in your team's application suffered from severe re-render performance bottlenecks.",
      category: "Behavioral & Practical",
      expectedKeywords: ["Profiler", "useMemo", "useCallback", "State colocation", "Bundle size"],
      idealDurationSec: 150,
      tips: "Explain your diagnostic steps first before jumping to the code solution."
    }
  ],
  "Campus Behavioral & HR Fitment": [
    {
      id: "q1",
      question: "Tell me about yourself and walk me through your journey into software engineering.",
      category: "Self Pitch",
      expectedKeywords: ["Passion", "Key projects", "Technical strengths", "Career goals"],
      idealDurationSec: 90,
      tips: "Keep it under 90 seconds. Focus on recent engineering accomplishments and future value."
    },
    {
      id: "q2",
      question: "Describe a time when you had a strong disagreement with a teammate over an engineering design decision. How did you resolve it?",
      category: "STAR Conflict Resolution",
      expectedKeywords: ["Active listening", "Objective data", "Compromise", "Team goal", "Retrospective"],
      idealDurationSec: 150,
      tips: "Show empathy, focus on objective technical metrics rather than personal egos."
    },
    {
      id: "q3",
      question: "Where do you see yourself contributing most in your first 90 days after joining our engineering team?",
      category: "Culture & Value",
      expectedKeywords: ["Onboarding", "Codebase mastery", "Documentation", "Sprint participation", "Mentorship"],
      idealDurationSec: 120,
      tips: "Show eagerness to learn existing workflows and contribute bug fixes quickly."
    }
  ]
};

export const sampleInterviewReport = {
  sessionId: "int_sess_894",
  role: "Full Stack Software Engineer",
  date: "Today, 11:30 AM",
  overallScore: 82,
  durationMinutes: 14,
  metrics: {
    communicationClarity: 85,
    speechPaceWpm: 136, // Optimal is 125-150 WPM
    confidenceScore: 78,
    sentimentTone: "Positive & Collaborative",
    starCompliance: 74,
    technicalAccuracy: 86
  },
  summary: "Strong technical foundations with crisp explanations of JavaScript concurrency. Pacing was very steady at 136 WPM. You demonstrated good domain intuition in system design. To improve further, ensure the 'Result' in behavioral answers includes concrete percentage metrics.",
  strengths: [
    "Precise explanation of Microtask vs Macrotask event loop phases",
    "Confident voice cadence without hesitation filler words (only 3 'um's detected)",
    "Highlighted distributed caching with Redis accurately in system design"
  ],
  improvements: [
    "In Question 2, the 'Action' was heavy on team effort ('we did')—clarify your personal contribution ('I designed the schema index')",
    "Mention latency measurements before vs after optimization (e.g., 'reduced p99 from 450ms to 85ms')",
    "Increase eye contact / camera alignment during opening response"
  ],
  questionBreakdown: [
    {
      question: "JavaScript Event Loop & Microtask Queues",
      score: 92,
      feedback: "Exceptional breakdown of Call Stack execution order and Promise microtask priority.",
      starScore: 88,
      wpm: 140
    },
    {
      question: "API & Query Optimization Experience",
      score: 76,
      feedback: "Good technical choices mentioned, but STAR structure lacked quantitative before-and-after benchmarks.",
      starScore: 68,
      wpm: 132
    },
    {
      question: "Handling Microservice Consistency & Sagas",
      score: 79,
      feedback: "Accurate mention of Saga orchestrator vs choreography, but should elaborate on compensating transactions.",
      starScore: 72,
      wpm: 136
    }
  ]
};
