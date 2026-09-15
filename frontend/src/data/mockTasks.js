export const gamificationState = {
  streakDays: 7,
  totalXp: 1250,
  level: "Placement Pioneer (Lvl 4)",
  nextLevelXp: 1500,
  completedTasksThisWeek: 5,
  badges: [
    { id: "b1", title: "First Pitch", icon: "Mic", desc: "Completed 1st 60s elevator pitch" },
    { id: "b2", title: "STAR Master", icon: "Award", desc: "Structured 5 stories with 80%+ STAR rating" },
    { id: "b3", title: "7-Day Streak", icon: "Flame", desc: "Practiced behavioral tasks 7 days in a row" },
    { id: "b4", title: "Pacing Pro", icon: "Clock", desc: "Spoke at optimal 135 WPM in 3 interviews" }
  ]
};

export const weeklyCalendar = [
  { day: "Mon", status: "completed", date: "Apr 7" },
  { day: "Tue", status: "completed", date: "Apr 8" },
  { day: "Wed", status: "completed", date: "Apr 9" },
  { day: "Thu", status: "completed", date: "Apr 10" },
  { day: "Fri", status: "completed", date: "Apr 11" },
  { day: "Sat", status: "completed", date: "Apr 12" },
  { day: "Sun", status: "active", date: "Apr 13" } // Today's task
];

export const mockDailyTasks = [
  {
    id: "task_today",
    title: "60-Second Technical Pitch: Explain Your Best Project",
    category: "Communication & Pitch",
    difficulty: "Medium",
    xpReward: 150,
    status: "active", // 'completed' | 'active' | 'locked'
    description: "Record a concise 60-second audio or video response describing the problem your final-year project solves, the core tech stack chosen, and measurable impact achieved.",
    instructions: [
      "Hook the recruiter in the first 10 seconds with the problem statement.",
      "Mention 2 key engineering challenges and how you tackled them.",
      "End with the quantifiable outcome (e.g. 40% latency reduction, 1,000 active users)."
    ],
    sampleScript: "Hi, I'm Khushi. In my capstone project, I noticed engineering students struggle with fragmented placement data. I architected SIPS, an AI-powered career intelligence platform with ATS resume analysis and mock peer interviews. Using React, Redis caching, and async workers, we reduced evaluation cycle time by 60% across 400+ students."
  },
  {
    id: "task_prev_1",
    title: "Mastering 'Tell Me About Yourself'",
    category: "HR Behavioral",
    difficulty: "Easy",
    xpReward: 100,
    status: "completed",
    completedDate: "Yesterday, 6:40 PM",
    userScore: 88,
    description: "Structure a fluent 90-second introduction balancing technical passion, university achievements, and career trajectory."
  },
  {
    id: "task_prev_2",
    title: "STAR Response: Handling a Critical Bug Under Pressure",
    category: "STAR Practice",
    difficulty: "Hard",
    xpReward: 200,
    status: "completed",
    completedDate: "2 days ago",
    userScore: 92,
    description: "Draft a high-impact behavioral story using Situation, Task, Action, Result framework."
  },
  {
    id: "task_next_1",
    title: "Explain Big-O Notation to a Non-Technical Manager",
    category: "Clarity & Analogy",
    difficulty: "Medium",
    xpReward: 150,
    status: "locked",
    unlockRequirement: "Unlocks tomorrow after streak day 8"
  },
  {
    id: "task_next_2",
    title: "Salary Negotiation Roleplay & Counter-Offer",
    category: "Professional Etiquette",
    difficulty: "Hard",
    xpReward: 250,
    status: "locked",
    unlockRequirement: "Unlocks at Level 5"
  }
];
