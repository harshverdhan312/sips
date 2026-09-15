class StudentProfile {
  final String id;
  final String name;
  final String email;
  final String college;
  final String branch;
  final String graduationYear;
  final double cgpa;
  final int backlogs;
  final String tier;
  final String avatarUrl;
  final String githubHandle;
  final String leetcodeHandle;
  final int leetcodeRating;
  final int githubCommits;
  final int atsScore;
  final String resumeVersion;
  final List<String> targetRoles;
  final List<String> preferredLocations;
  final bool isVerified;

  const StudentProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.college,
    required this.branch,
    required this.graduationYear,
    required this.cgpa,
    this.backlogs = 0,
    this.tier = 'Tier-1 Contender',
    this.avatarUrl = '',
    this.githubHandle = 'aarav-sharma-dev',
    this.leetcodeHandle = 'aarav_nit',
    this.leetcodeRating = 1842,
    this.githubCommits = 320,
    this.atsScore = 92,
    this.resumeVersion = 'v3.4 (ATS Parsed)',
    this.targetRoles = const ['Software Development Engineer', 'Full Stack Developer', 'Cloud / Backend Engineer'],
    this.preferredLocations = const ['Bengaluru', 'Hyderabad', 'Remote / Hybrid'],
    this.isVerified = true,
  });

  StudentProfile copyWith({
    String? id,
    String? name,
    String? email,
    String? college,
    String? branch,
    String? graduationYear,
    double? cgpa,
    int? backlogs,
    String? tier,
    String? avatarUrl,
    String? githubHandle,
    String? leetcodeHandle,
    int? leetcodeRating,
    int? githubCommits,
    int? atsScore,
    String? resumeVersion,
    List<String>? targetRoles,
    List<String>? preferredLocations,
    bool? isVerified,
  }) {
    return StudentProfile(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      college: college ?? this.college,
      branch: branch ?? this.branch,
      graduationYear: graduationYear ?? this.graduationYear,
      cgpa: cgpa ?? this.cgpa,
      backlogs: backlogs ?? this.backlogs,
      tier: tier ?? this.tier,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      githubHandle: githubHandle ?? this.githubHandle,
      leetcodeHandle: leetcodeHandle ?? this.leetcodeHandle,
      leetcodeRating: leetcodeRating ?? this.leetcodeRating,
      githubCommits: githubCommits ?? this.githubCommits,
      atsScore: atsScore ?? this.atsScore,
      resumeVersion: resumeVersion ?? this.resumeVersion,
      targetRoles: targetRoles ?? this.targetRoles,
      preferredLocations: preferredLocations ?? this.preferredLocations,
      isVerified: isVerified ?? this.isVerified,
    );
  }
}
