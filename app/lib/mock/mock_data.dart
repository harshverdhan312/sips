import '../core/widgets/skill_chip.dart';
import '../models/growth_task.dart';
import '../models/job_opportunity.dart';
import '../models/mock_interview.dart';
import '../models/peer_match.dart';
import '../models/placement_alert.dart';
import '../models/readiness_metric.dart';
import '../models/roadmap_milestone.dart';
import '../models/skill_intelligence.dart';
import '../models/student_profile.dart';

class MockData {
  MockData._();

  static const StudentProfile studentProfile = StudentProfile(
    id: 'std_001',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@nit.ac.in',
    college: 'National Institute of Technology',
    branch: 'Computer Science & Engineering',
    graduationYear: '2026 Batch (Final Year)',
    cgpa: 8.82,
    backlogs: 0,
    tier: 'Tier-1 Contender',
    avatarUrl: '',
    githubHandle: 'aarav-sharma-dev',
    leetcodeHandle: 'aarav_nit',
    leetcodeRating: 1842,
    githubCommits: 320,
    atsScore: 92,
    resumeVersion: 'v3.4 (ATS Verified)',
    targetRoles: [
      'Software Development Engineer (SDE-1)',
      'Distributed Systems Engineer',
      'Full Stack Developer',
    ],
    preferredLocations: ['Bengaluru', 'Hyderabad', 'Hybrid'],
    isVerified: true,
  );

  static const ReadinessMetric readinessMetric = ReadinessMetric(
    overallScore: 78,
    maxScore: 100,
    percentileText: 'Top 12% in CSE Batch',
    profileSummary: 'High probability profile for System & Core Engineering',
    scoreGainText: '+16 pts • 8 wks',
    techDepthScore: 88,
    starBehaviorScore: 86,
    systemArchScore: 79,
    domainScores: [
      DomainScore(title: 'Algorithms & Data Structures', score: 94, category: 'dsa'),
      DomainScore(title: 'Modern Python & Concurrency', score: 89, category: 'backend'),
      DomainScore(title: 'Distributed System Architecture', score: 78, category: 'arch'),
      DomainScore(title: 'RESTful APIs & GraphQL', score: 96, category: 'api'),
    ],
  );

  static const List<SkillItem> skills = [
    // Strong Skills
    SkillItem(
      id: 'sk_1',
      name: 'Algorithms & Data Structures',
      category: 'Core CS',
      status: SkillStatus.strong,
      proficiency: 94,
      benchmark: 'Top 5% Benchmark: 90%',
      recommendation: 'Maintain frequency with 2 hard dynamic programming sets/week.',
      readinessImpact: 4.8,
    ),
    SkillItem(
      id: 'sk_2',
      name: 'Modern Python & AsyncIO',
      category: 'Backend',
      status: SkillStatus.strong,
      proficiency: 89,
      benchmark: 'SDE-1 Benchmark: 82%',
      recommendation: 'Deep dive on GIL, memory profiler, and worker pools.',
      readinessImpact: 4.2,
    ),
    SkillItem(
      id: 'sk_3',
      name: 'RESTful APIs & GraphQL',
      category: 'Backend',
      status: SkillStatus.strong,
      proficiency: 96,
      benchmark: 'Tier-1 Target: 85%',
      recommendation: 'High mastery. Ready for real-world telemetry interviews.',
      readinessImpact: 5.0,
    ),
    SkillItem(
      id: 'sk_4',
      name: 'Relational Database Design & SQL',
      category: 'Database',
      status: SkillStatus.strong,
      proficiency: 88,
      benchmark: 'Tier-1 Target: 80%',
      recommendation: 'Review query plan optimization and indexing strategies.',
      readinessImpact: 3.9,
    ),

    // Developing Skills
    SkillItem(
      id: 'sk_5',
      name: 'Distributed Caching (Redis/Memcached)',
      category: 'System Arch',
      status: SkillStatus.developing,
      proficiency: 78,
      benchmark: 'Tier-1 Target: 85%',
      recommendation: 'Practice cache invalidation patterns, write-through vs write-back.',
      readinessImpact: 4.5,
    ),
    SkillItem(
      id: 'sk_6',
      name: 'Message Queues (Kafka / RabbitMQ)',
      category: 'System Arch',
      status: SkillStatus.developing,
      proficiency: 72,
      benchmark: 'Tier-1 Target: 80%',
      recommendation: 'Implement a producer-consumer idempotent pipeline.',
      readinessImpact: 4.0,
    ),
    SkillItem(
      id: 'sk_7',
      name: 'Unit & Integration Testing',
      category: 'Engineering Best Practices',
      status: SkillStatus.developing,
      proficiency: 74,
      benchmark: 'SDE-1 Target: 80%',
      recommendation: 'Mock dependency trees in pytest and JUnit.',
      readinessImpact: 3.2,
    ),

    // Identified Gaps
    SkillItem(
      id: 'sk_8',
      name: 'CI/CD Pipelines & Dockerization',
      category: 'DevOps & Cloud',
      status: SkillStatus.gap,
      proficiency: 58,
      benchmark: 'Tier-1 Shortlist Target: 75%',
      recommendation: 'Build containerized deployment pipeline on GitHub Actions.',
      readinessImpact: 6.4,
    ),
    SkillItem(
      id: 'sk_9',
      name: 'Kubernetes & Container Orchestration',
      category: 'DevOps & Cloud',
      status: SkillStatus.gap,
      proficiency: 52,
      benchmark: 'Tier-1 Shortlist Target: 70%',
      recommendation: 'Study Pod scheduling, ingress controllers, and ConfigMaps.',
      readinessImpact: 5.8,
    ),
    SkillItem(
      id: 'sk_10',
      name: 'Behavioral STAR Story Structuring',
      category: 'Soft Skills',
      status: SkillStatus.developing,
      proficiency: 81,
      benchmark: 'Leadership Target: 85%',
      recommendation: 'Refine 3 conflict-resolution and cross-team project narratives.',
      readinessImpact: 3.6,
    ),
  ];

  static const List<JobOpportunity> jobs = [
    JobOpportunity(
      id: 'job_1',
      company: 'Atlassian',
      role: 'Early Career Software Engineer (SDE-1)',
      location: 'Bengaluru / Hybrid',
      type: 'Full-Time',
      ctc: '₹28.5 - 34.0 LPA',
      matchScore: 91,
      deadlineText: 'Closes in 24h',
      description:
          'Join the core cloud engineering platform team at Atlassian building resilient collaborative infrastructure used by millions of developers globally.',
      matchedSkills: [
        'Algorithms & Data Structures',
        'Modern Python & Concurrency',
        'RESTful APIs & GraphQL',
        'Relational Databases & SQL',
      ],
      missingSkills: [
        'CI/CD Pipelines & Docker',
        'Distributed Caching at Scale',
      ],
      responsibilities: [
        'Design and implement high-availability microservices.',
        'Participate in architecture reviews and sprint roadmaps.',
        'Collaborate with product and reliability engineering teams.',
      ],
      eligibilityCriteria: [
        'B.Tech / B.E in CSE/IT or related field (2026 Batch).',
        'Minimum 7.5 CGPA with 0 active backlogs.',
        'SIPS Placement Readiness Score 80+ required.',
      ],
    ),
    JobOpportunity(
      id: 'job_2',
      company: 'Google',
      role: 'Associate Software Engineer — Campus Drive',
      location: 'Hyderabad / Bengaluru',
      type: 'Full-Time',
      ctc: '₹32.0 - 40.0 LPA',
      matchScore: 88,
      deadlineText: 'Drive on Sept 28',
      description:
          'Google Autumn Campus Shortlist Drive is finalized. Eligible students with 80+ readiness scores will receive priority direct test invitations.',
      matchedSkills: [
        'Algorithms & Data Structures',
        'System Architecture Principles',
        'Clean Code & OOP',
        'Relational Database Design',
      ],
      missingSkills: [
        'Advanced Concurrency & Multithreading',
        'System Scale Optimization',
      ],
      responsibilities: [
        'Develop software solutions for planetary-scale applications.',
        'Solve complex algorithmic problems under real-time latency bounds.',
      ],
      eligibilityCriteria: [
        '2026 Graduating Batch.',
        'CGPA >= 8.0, 0 Backlogs.',
        'Verified SIPS Telemetry.',
      ],
    ),
    JobOpportunity(
      id: 'job_3',
      company: 'Uber',
      role: 'Software Engineer I — Platform Infrastructure',
      location: 'Bengaluru',
      type: 'Full-Time',
      ctc: '₹30.0 - 36.0 LPA',
      matchScore: 84,
      deadlineText: 'Apply before Oct 5',
      description:
          'Drive mobility forward. Work on real-time routing engines, dispatch optimizations, and low-latency geospatial services.',
      matchedSkills: [
        'Data Structures & Algorithms',
        'REST & gRPC APIs',
        'Database Optimization',
      ],
      missingSkills: [
        'Kafka / Event-Driven Architectures',
        'Container Orchestration',
      ],
      responsibilities: [
        'Build and maintain mission-critical backend services.',
        'Optimize high-throughput RPC pipelines.',
      ],
      eligibilityCriteria: [
        'Graduation: 2026 Batch.',
        'Strong DSA foundations.',
      ],
    ),
    JobOpportunity(
      id: 'job_4',
      company: 'Stripe',
      role: 'Software Engineer — Payments Core',
      location: 'Remote / Bengaluru',
      type: 'Full-Time',
      ctc: '₹35.0 - 45.0 LPA',
      matchScore: 82,
      deadlineText: 'Open for 5 Days',
      description:
          'Build economic infrastructure for the internet. Stripe engineers build fault-tolerant ledger and transaction settlement systems.',
      matchedSkills: [
        'Python / Java Engineering',
        'Distributed Transactions',
        'API Quality & Security',
      ],
      missingSkills: [
        'Idempotent Event Systems',
        'PCI-DSS Compliance Concepts',
      ],
      responsibilities: [
        'Design robust ledger and payout execution engines.',
        'Maintain zero-downtime financial pipelines.',
      ],
      eligibilityCriteria: [
        '2026 Batch.',
        'Strong problem-solving record on LeetCode/Codeforces.',
      ],
    ),
  ];

  static const List<GrowthTask> tasks = [
    GrowthTask(
      id: 'tsk_1',
      title: 'Practice 2 High-Frequency Tree Inversions',
      category: 'DSA & Code',
      durationText: '25 mins',
      targetCompanyTag: 'Uber Tagged',
      scoreBoost: 1.8,
      targetTopics: ['Binary Trees', 'Recursion', 'DFS'],
      isCompleted: false,
    ),
    GrowthTask(
      id: 'tsk_2',
      title: 'Distributed Caching Mock Interview',
      category: 'System Design',
      durationText: '45 mins',
      targetCompanyTag: 'Stripe Focus',
      scoreBoost: 4.5,
      targetTopics: ['Redis', 'Eviction Policies', 'Sharding'],
      isCompleted: false,
    ),
    GrowthTask(
      id: 'tsk_3',
      title: 'Refine STAR Story on Team Leadership',
      category: 'Behavioral / STAR',
      durationText: '15 mins',
      targetCompanyTag: 'Amazon Prep',
      scoreBoost: 1.5,
      targetTopics: ['Conflict Resolution', 'Ownership'],
      isCompleted: true,
    ),
    GrowthTask(
      id: 'tsk_4',
      title: 'Complete CI/CD Containerization Sprint',
      category: 'DevOps & Cloud',
      durationText: '30 mins',
      targetCompanyTag: 'Atlassian Req',
      scoreBoost: 3.2,
      targetTopics: ['Docker', 'GitHub Actions'],
      isCompleted: false,
    ),
  ];

  static const List<RoadmapMilestone> roadmapMilestones = [
    RoadmapMilestone(
      id: 'mile_1',
      phaseNumber: 'PHASE 01',
      title: 'Foundations & Core Algorithms',
      description: 'Master high-frequency data structures, time complexity analysis, and OOP principles.',
      state: MilestoneState.completed,
      progressPercent: 100,
      deadline: 'Completed • July 15',
      checklist: [
        '300+ LeetCode problems across Array, Tree, Graph',
        'Time & Space Complexity mastery',
        'Object-Oriented Design patterns',
        'Database Schema normalization',
      ],
    ),
    RoadmapMilestone(
      id: 'mile_2',
      phaseNumber: 'PHASE 02',
      title: 'System Architecture & Backend Mastery',
      description: 'Distributed cache systems, asynchronous message brokers, API scalability, and resilience.',
      state: MilestoneState.inProgress,
      progressPercent: 78,
      deadline: 'In Progress • Target: Sept 20',
      checklist: [
        'Distributed Caching strategies (Redis/Memcached)',
        'Message Queuing with Kafka & Idempotency',
        'Database indexing and query execution plans',
        'RESTful & gRPC interface protocols',
      ],
    ),
    RoadmapMilestone(
      id: 'mile_3',
      phaseNumber: 'PHASE 03',
      title: 'Live Mock Drills & Behavioral STAR',
      description: 'Pair interviews with mentors, real-time code live-shares, and structured STAR delivery.',
      state: MilestoneState.inProgress,
      progressPercent: 45,
      deadline: 'Target: Oct 05',
      checklist: [
        'Complete 5 System Design mock interviews',
        'Conduct 3 Peer Live Coding sessions',
        'Refine 6 Behavioral stories using STAR technique',
        'Review ATS resume scoring benchmark (90%+)',
      ],
    ),
    RoadmapMilestone(
      id: 'mile_4',
      phaseNumber: 'PHASE 04',
      title: 'Campus Shortlist & Placement Drives',
      description: 'Tier-1 drive applications, fast-track coding rounds, and executive offer negotiation.',
      state: MilestoneState.locked,
      progressPercent: 0,
      deadline: 'Starts Oct 15',
      checklist: [
        'Google Autumn campus drive shortlist',
        'Atlassian Day-1 interview slot privilege',
        'Uber & Stripe final technical panels',
      ],
    ),
  ];

  static const List<InterviewQuestion> mockInterviewQuestions = [
    InterviewQuestion(
      questionNumber: 1,
      title: 'Distributed Cache Eviction & Consistency',
      category: 'System Architecture',
      prompt:
          'Explain how you would design a distributed caching layer for a high-throughput read-heavy service. How do you handle cache invalidation during network partitions?',
      keyTalkingPoints: [
        'LRU / LFU eviction trade-offs',
        'Write-through vs Write-back vs Cache-aside',
        'Thundering herd problem mitigation (mutex lock or probabilistic early expiration)',
        'Eventual consistency using message queues',
      ],
      userNotesOrAnswer:
          'I would deploy a Redis cluster using Cache-Aside pattern. For invalidation, asynchronous CDC events from the main DB queue invalidation keys.',
    ),
    InterviewQuestion(
      questionNumber: 2,
      title: 'Idempotency in Payment Gateways',
      category: 'API & Backend Design',
      prompt:
          'How do you guarantee that a retry request for a payment transaction does not charge the customer twice in a distributed microservices environment?',
      keyTalkingPoints: [
        'Idempotency keys stored with unique constraints',
        'Atomic check-and-insert using Redis or DB lock',
        'Two-phase commit vs Saga orchestrator',
        'Handling in-flight processing status',
      ],
      userNotesOrAnswer:
          'Clients generate a unique UUID idempotency key in headers. The server records this key with state PENDING before dispatching downstream.',
    ),
    InterviewQuestion(
      questionNumber: 3,
      title: 'Inverting a Binary Tree & Complexity',
      category: 'Algorithms & Data Structures',
      prompt:
          'Walk through inverting a binary tree both recursively and iteratively. What are the memory constraints in deep unbalanced trees?',
      keyTalkingPoints: [
        'Recursive DFS swap left and right pointers',
        'Iterative BFS using a queue',
        'Space complexity: O(h) recursion stack where h = height',
        'Worst case unbalanced: O(N) stack frames',
      ],
      userNotesOrAnswer:
          'Swap left and right children at each node recursively. For large trees, iterative traversal avoids call stack overflow.',
    ),
  ];

  static const InterviewDiagnosticReport diagnosticReport = InterviewDiagnosticReport(
    id: 'diag_101',
    overallScore: 84,
    interviewTitle: 'Distributed Systems & Backend Technical Round',
    date: 'Completed Today • Session #4',
    technicalScore: 88,
    communicationScore: 82,
    structureScore: 85,
    starMethodScore: 80,
    confidenceScore: 86,
    summaryVerdict:
        'Strong technical core with clear explanation of trade-offs. Minor pacing rushes when handling edge cases in CAP theorem.',
    topStrengths: [
      'Excellent articulation of Cache-Aside vs Write-Through strategies.',
      'Clear structured decomposition of system constraints before coding.',
      'Strong mastery of concurrency locks and atomic execution.',
    ],
    highPriorityGaps: [
      'Deepen coverage of network partition behavior (split-brain prevention).',
      'Use concrete numerical estimates (QPS, storage, bandwidth) earlier.',
    ],
    actionableNextSteps: [
      'Practice 2 back-of-the-envelope capacity estimation drills.',
      'Conduct a peer mock on Paxos and Raft consensus protocols.',
    ],
  );

  static const List<PeerMatch> peers = [
    PeerMatch(
      id: 'peer_1',
      name: 'Rohan Verma',
      roleOrBadge: 'SDE-1 @ Stripe Intern',
      college: 'NIT CSE • Final Year',
      matchAffinity: 94,
      avatarUrl: '',
      strongSkills: ['Distributed Systems', 'Kafka', 'Java'],
      learningSkills: ['Flutter Mobile', 'Modern Python'],
      currentGoal: 'Practicing System Design & Mock Interviews',
      isAvailableNow: true,
    ),
    PeerMatch(
      id: 'peer_2',
      name: 'Ananya Deshmukh',
      roleOrBadge: 'Top 5% LeetCode',
      college: 'NIT IT • Final Year',
      matchAffinity: 91,
      avatarUrl: '',
      strongSkills: ['Dynamic Programming', 'Graph Algorithms', 'C++'],
      learningSkills: ['Microservices', 'Docker / CI/CD'],
      currentGoal: 'Solving Uber Tagged Hard Sets',
      isAvailableNow: true,
    ),
    PeerMatch(
      id: 'peer_3',
      name: 'Vikram Mehta',
      roleOrBadge: 'Backend Enthusiast',
      college: 'NIT CSE • Final Year',
      matchAffinity: 87,
      avatarUrl: '',
      strongSkills: ['PostgreSQL', 'Redis', 'Node.js'],
      learningSkills: ['System Design Scale', 'STAR Technique'],
      currentGoal: 'Mock drills for Atlassian Campus Drive',
      isAvailableNow: false,
    ),
  ];

  static const List<PlacementAlert> alerts = [
    PlacementAlert(
      id: 'alt_1',
      title: 'Google Autumn Drive Finalized',
      description:
          'Eligibility benchmark locked at 80+ Readiness Score. You are currently 2 points away from direct shortlist privilege.',
      timestamp: 'Just now',
      type: AlertType.campusDrive,
      actionRoute: '/opportunities',
      actionLabel: 'View Opportunity',
      isRead: false,
      isUrgent: true,
    ),
    PlacementAlert(
      id: 'alt_2',
      title: 'Readiness Index Increased (+4 pts)',
      description:
          'Your completed Behavioral STAR task and LeetCode rating sync boosted your index to 78/100.',
      timestamp: '2 hours ago',
      type: AlertType.readinessBoost,
      actionRoute: '/skills',
      actionLabel: 'Audit Skills',
      isRead: false,
    ),
    PlacementAlert(
      id: 'alt_3',
      title: 'Interview Diagnostic Report Ready',
      description:
          'Your performance in Distributed Systems Mock has been scored (84%). Strengths and gap recommendations are available.',
      timestamp: '5 hours ago',
      type: AlertType.interviewFeedback,
      actionRoute: '/interview-diagnostic',
      actionLabel: 'View Report',
      isRead: true,
    ),
    PlacementAlert(
      id: 'alt_4',
      title: 'Critical Skill Gap Alert: CI/CD & Docker',
      description:
          '3 of your dream matched companies (Atlassian, Stripe, Uber) require containerized deployment skills.',
      timestamp: 'Yesterday',
      type: AlertType.skillGap,
      actionRoute: '/growth',
      actionLabel: 'Start Sprint',
      isRead: true,
    ),
  ];
}
