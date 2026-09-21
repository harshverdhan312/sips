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
  final String profileImageUrl;
  final String githubHandle;
  final String leetcodeHandle;
  final int leetcodeRating;
  final int githubCommits;
  final int atsScore;
  final String resumeVersion;
  final List<String> targetRoles;
  final List<String> preferredLocations;
  final List<String> skills;
  final String resumeUrl;
  final int readinessScore;
  final int technicalScore;
  final int softSkillScore;
  final int resumeScore;
  final String placementStatus;
  final bool isVerified;
  final int? age;
  final int? internships;
  final bool? hostel;
  final int? historyOfBacklogs;

  const StudentProfile({
    this.id = '',
    this.name = '',
    this.email = '',
    this.college = '',
    this.branch = '',
    this.graduationYear = '',
    this.cgpa = 0.0,
    this.backlogs = 0,
    this.tier = 'Tier-3 • Needs Preparation',
    this.profileImageUrl = '',
    this.githubHandle = '',
    this.leetcodeHandle = '',
    this.leetcodeRating = 0,
    this.githubCommits = 0,
    this.atsScore = 0,
    this.resumeVersion = '',
    this.targetRoles = const [],
    this.preferredLocations = const [],
    this.skills = const [],
    this.resumeUrl = '',
    this.readinessScore = 0,
    this.technicalScore = 0,
    this.softSkillScore = 0,
    this.resumeScore = 0,
    this.placementStatus = 'Not Placed',
    this.isVerified = true,
    this.age,
    this.internships,
    this.hostel,
    this.historyOfBacklogs,
  });

  factory StudentProfile.fromBackendJson(Map<String, dynamic> json, {String collegeName = ''}) {
    final readiness = (json['readinessScore'] as num?)?.toInt() ?? 0;
    final technical = (json['technicalScore'] as num?)?.toInt() ?? 0;
    final softSkill = (json['softSkillScore'] as num?)?.toInt() ?? 0;
    final resumeScoreVal = (json['resumeScore'] as num?)?.toInt() ?? 0;
    // Shared Cross-Platform Frontend Presentation Standard:
    // >= 80 -> Tier-1 Contender • Placement Ready
    // >= 60 -> Tier-2 Candidate • Developing
    // < 60  -> Tier-3 • Needs Preparation
    final tier = readiness >= 80
        ? 'Tier-1 Contender • Placement Ready'
        : (readiness >= 60 ? 'Tier-2 Candidate • Developing' : 'Tier-3 • Needs Preparation');
    final rawSkills = json['skills'];
    final skillsList = rawSkills is List ? rawSkills.map((s) => s.toString()).toList() : <String>[];
    final cgpaVal = (json['cgpa'] as num?)?.toDouble() ?? 0.0;
    final resumeUrl = json['resumeUrl'] as String? ?? '';
    final placementStatusVal = json['placementStatus'] as String? ?? 'Not Placed';

    return StudentProfile(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      college: collegeName.isNotEmpty ? collegeName : '',
      branch: json['branch'] as String? ?? '',
      graduationYear: json['batch'] as String? ?? '',
      cgpa: cgpaVal,
      backlogs: 0,
      tier: tier,
      profileImageUrl: json['profileImageUrl'] as String? ?? json['avatarUrl'] as String? ?? '',
      githubHandle: json['github'] as String? ?? '',
      atsScore: resumeScoreVal > 0 ? resumeScoreVal : (resumeUrl.isNotEmpty ? 80 : 0),
      resumeScore: resumeScoreVal,
      technicalScore: technical,
      softSkillScore: softSkill,
      placementStatus: placementStatusVal,
      resumeVersion: resumeUrl.isNotEmpty ? 'Uploaded Resume' : 'No Resume Uploaded',
      skills: skillsList,
      resumeUrl: resumeUrl,
      readinessScore: readiness,
      isVerified: true,
      age: (json['age'] as num?)?.toInt(),
      internships: (json['internships'] as num?)?.toInt(),
      hostel: json['hostel'] as bool?,
      historyOfBacklogs: (json['historyOfBacklogs'] as num?)?.toInt(),
    );
  }

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
    String? profileImageUrl,
    String? githubHandle,
    String? leetcodeHandle,
    int? leetcodeRating,
    int? githubCommits,
    int? atsScore,
    String? resumeVersion,
    List<String>? targetRoles,
    List<String>? preferredLocations,
    List<String>? skills,
    String? resumeUrl,
    int? readinessScore,
    int? technicalScore,
    int? softSkillScore,
    int? resumeScore,
    String? placementStatus,
    bool? isVerified,
    int? age,
    int? internships,
    bool? hostel,
    int? historyOfBacklogs,
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
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      githubHandle: githubHandle ?? this.githubHandle,
      leetcodeHandle: leetcodeHandle ?? this.leetcodeHandle,
      leetcodeRating: leetcodeRating ?? this.leetcodeRating,
      githubCommits: githubCommits ?? this.githubCommits,
      atsScore: atsScore ?? this.atsScore,
      resumeVersion: resumeVersion ?? this.resumeVersion,
      targetRoles: targetRoles ?? this.targetRoles,
      preferredLocations: preferredLocations ?? this.preferredLocations,
      skills: skills ?? this.skills,
      resumeUrl: resumeUrl ?? this.resumeUrl,
      readinessScore: readinessScore ?? this.readinessScore,
      technicalScore: technicalScore ?? this.technicalScore,
      softSkillScore: softSkillScore ?? this.softSkillScore,
      resumeScore: resumeScore ?? this.resumeScore,
      placementStatus: placementStatus ?? this.placementStatus,
      isVerified: isVerified ?? this.isVerified,
      age: age ?? this.age,
      internships: internships ?? this.internships,
      hostel: hostel ?? this.hostel,
      historyOfBacklogs: historyOfBacklogs ?? this.historyOfBacklogs,
    );
  }
}
