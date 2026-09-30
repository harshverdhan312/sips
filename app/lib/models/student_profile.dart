class StudentProject {
  final int repoId;
  final String name;
  final String fullName;
  final String owner;
  final String htmlUrl;
  final String description;
  final String primaryLanguage;
  final List<String> languages;
  final List<String> topics;
  final int stars;
  final int forks;
  final bool isFork;
  final int order;
  final DateTime? updatedAt;
  final DateTime? selectedAt;
  final DateTime? syncedAt;

  const StudentProject({
    required this.repoId,
    required this.name,
    this.fullName = '',
    this.owner = '',
    this.htmlUrl = '',
    this.description = '',
    this.primaryLanguage = '',
    this.languages = const [],
    this.topics = const [],
    this.stars = 0,
    this.forks = 0,
    this.isFork = false,
    this.order = 1,
    this.updatedAt,
    this.selectedAt,
    this.syncedAt,
  });

  factory StudentProject.fromBackendJson(Map<String, dynamic> json) {
    final rawLangs = json['languages'];
    final langsList = rawLangs is List ? rawLangs.map((e) => e.toString()).toList() : <String>[];
    final rawTopics = json['topics'];
    final topicsList = rawTopics is List ? rawTopics.map((e) => e.toString()).toList() : <String>[];

    DateTime? parsedUpdated;
    if (json['updatedAt'] != null) {
      parsedUpdated = DateTime.tryParse(json['updatedAt'].toString());
    }

    DateTime? parsedSelected;
    if (json['selectedAt'] != null) {
      parsedSelected = DateTime.tryParse(json['selectedAt'].toString());
    }

    DateTime? parsedSynced;
    if (json['syncedAt'] != null) {
      parsedSynced = DateTime.tryParse(json['syncedAt'].toString());
    }

    return StudentProject(
      repoId: (json['repoId'] as num?)?.toInt() ?? 0,
      name: json['name'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      owner: json['owner'] as String? ?? '',
      htmlUrl: json['htmlUrl'] as String? ?? '',
      description: json['description'] as String? ?? '',
      primaryLanguage: json['primaryLanguage'] as String? ?? '',
      languages: langsList,
      topics: topicsList,
      stars: (json['stars'] as num?)?.toInt() ?? 0,
      forks: (json['forks'] as num?)?.toInt() ?? 0,
      isFork: json['isFork'] as bool? ?? false,
      order: (json['order'] as num?)?.toInt() ?? 1,
      updatedAt: parsedUpdated,
      selectedAt: parsedSelected,
      syncedAt: parsedSynced,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'repoId': repoId,
      'name': name,
      'fullName': fullName,
      'owner': owner,
      'htmlUrl': htmlUrl,
      'description': description,
      'primaryLanguage': primaryLanguage,
      'languages': languages,
      'topics': topics,
      'stars': stars,
      'forks': forks,
      'isFork': isFork,
      'order': order,
      'updatedAt': updatedAt?.toIso8601String(),
      'selectedAt': selectedAt?.toIso8601String(),
      'syncedAt': syncedAt?.toIso8601String(),
    };
  }
}

class StudentPublicProfile {
  final bool enabled;
  final String username;
  final String bio;
  final bool showResume;
  final bool showGithub;
  final bool showLinkedIn;
  final bool showSkills;
  final bool showProjects;

  const StudentPublicProfile({
    this.enabled = false,
    this.username = '',
    this.bio = '',
    this.showResume = false,
    this.showGithub = true,
    this.showLinkedIn = true,
    this.showSkills = true,
    this.showProjects = true,
  });

  factory StudentPublicProfile.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const StudentPublicProfile();
    return StudentPublicProfile(
      enabled: json['enabled'] as bool? ?? false,
      username: json['username'] as String? ?? '',
      bio: json['bio'] as String? ?? '',
      showResume: json['showResume'] as bool? ?? false,
      showGithub: json['showGithub'] as bool? ?? true,
      showLinkedIn: json['showLinkedIn'] as bool? ?? true,
      showSkills: json['showSkills'] as bool? ?? true,
      showProjects: json['showProjects'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'enabled': enabled,
      'username': username,
      'bio': bio,
      'showResume': showResume,
      'showGithub': showGithub,
      'showLinkedIn': showLinkedIn,
      'showSkills': showSkills,
      'showProjects': showProjects,
    };
  }

  StudentPublicProfile copyWith({
    bool? enabled,
    String? username,
    String? bio,
    bool? showResume,
    bool? showGithub,
    bool? showLinkedIn,
    bool? showSkills,
    bool? showProjects,
  }) {
    return StudentPublicProfile(
      enabled: enabled ?? this.enabled,
      username: username ?? this.username,
      bio: bio ?? this.bio,
      showResume: showResume ?? this.showResume,
      showGithub: showGithub ?? this.showGithub,
      showLinkedIn: showLinkedIn ?? this.showLinkedIn,
      showSkills: showSkills ?? this.showSkills,
      showProjects: showProjects ?? this.showProjects,
    );
  }
}

class DifficultyBreakdown {
  final int? easy;
  final int? medium;
  final int? hard;

  const DifficultyBreakdown({
    this.easy,
    this.medium,
    this.hard,
  });

  factory DifficultyBreakdown.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const DifficultyBreakdown();
    return DifficultyBreakdown(
      easy: (json['easy'] as num?)?.toInt(),
      medium: (json['medium'] as num?)?.toInt(),
      hard: (json['hard'] as num?)?.toInt(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (easy != null) 'easy': easy,
      if (medium != null) 'medium': medium,
      if (hard != null) 'hard': hard,
    };
  }
}

class CodingPlatformStats {
  final int? problemsSolved;
  final DifficultyBreakdown? difficultyBreakdown;
  final int? currentRating;
  final int? maxRating;
  final String? rank;
  final String? maxRank;
  final int? contestParticipationCount;
  final List<String> badges;
  final List<String> topLanguages;

  const CodingPlatformStats({
    this.problemsSolved,
    this.difficultyBreakdown,
    this.currentRating,
    this.maxRating,
    this.rank,
    this.maxRank,
    this.contestParticipationCount,
    this.badges = const [],
    this.topLanguages = const [],
  });

  factory CodingPlatformStats.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const CodingPlatformStats();
    final rawBadges = json['badges'];
    final badgesList = rawBadges is List ? rawBadges.map((e) => e.toString()).toList() : <String>[];
    final rawLangs = json['topLanguages'];
    final langsList = rawLangs is List ? rawLangs.map((e) => e.toString()).toList() : <String>[];

    final rawBreakdown = json['difficultyBreakdown'];
    final breakdownMap = rawBreakdown is Map ? rawBreakdown.cast<String, dynamic>() : null;

    return CodingPlatformStats(
      problemsSolved: (json['problemsSolved'] as num?)?.toInt(),
      difficultyBreakdown: breakdownMap != null
          ? DifficultyBreakdown.fromJson(breakdownMap)
          : null,
      currentRating: (json['currentRating'] as num?)?.toInt(),
      maxRating: (json['maxRating'] as num?)?.toInt(),
      rank: json['rank'] as String?,
      maxRank: json['maxRank'] as String?,
      contestParticipationCount: (json['contestParticipationCount'] as num?)?.toInt(),
      badges: badgesList,
      topLanguages: langsList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (problemsSolved != null) 'problemsSolved': problemsSolved,
      if (difficultyBreakdown != null) 'difficultyBreakdown': difficultyBreakdown!.toJson(),
      if (currentRating != null) 'currentRating': currentRating,
      if (maxRating != null) 'maxRating': maxRating,
      if (rank != null) 'rank': rank,
      if (maxRank != null) 'maxRank': maxRank,
      if (contestParticipationCount != null) 'contestParticipationCount': contestParticipationCount,
      if (badges.isNotEmpty) 'badges': badges,
      if (topLanguages.isNotEmpty) 'topLanguages': topLanguages,
    };
  }
}

class CodingPlatformProfile {
  final String platform; // 'LEETCODE' | 'CODEFORCES'
  final String username;
  final String profileUrl;
  final String connectionStatus; // 'CONNECTED' | 'DISCONNECTED' | 'ERROR'
  final String verificationStatus; // 'UNVERIFIED'
  final bool showOnPublicProfile;
  final CodingPlatformStats stats;
  final DateTime? lastSyncedAt;
  final String? syncStatus;
  final String? syncError;

  const CodingPlatformProfile({
    required this.platform,
    required this.username,
    this.profileUrl = '',
    this.connectionStatus = 'CONNECTED',
    this.verificationStatus = 'UNVERIFIED',
    this.showOnPublicProfile = true,
    this.stats = const CodingPlatformStats(),
    this.lastSyncedAt,
    this.syncStatus,
    this.syncError,
  });

  factory CodingPlatformProfile.fromBackendJson(Map<String, dynamic> json) {
    DateTime? parsedSynced;
    if (json['lastSyncedAt'] != null) {
      parsedSynced = DateTime.tryParse(json['lastSyncedAt'].toString());
    }

    final rawStats = json['stats'];
    final statsMap = rawStats is Map ? rawStats.cast<String, dynamic>() : null;

    return CodingPlatformProfile(
      platform: json['platform'] as String? ?? '',
      username: json['username'] as String? ?? '',
      profileUrl: json['profileUrl'] as String? ?? '',
      connectionStatus: json['connectionStatus'] as String? ?? 'CONNECTED',
      verificationStatus: json['verificationStatus'] as String? ?? 'UNVERIFIED',
      showOnPublicProfile: json['showOnPublicProfile'] as bool? ?? true,
      stats: CodingPlatformStats.fromJson(statsMap),
      lastSyncedAt: parsedSynced,
      syncStatus: json['syncStatus'] as String?,
      syncError: json['syncError'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'platform': platform,
      'username': username,
      'profileUrl': profileUrl,
      'connectionStatus': connectionStatus,
      'verificationStatus': verificationStatus,
      'showOnPublicProfile': showOnPublicProfile,
      'stats': stats.toJson(),
      'lastSyncedAt': lastSyncedAt?.toIso8601String(),
      'syncStatus': syncStatus,
      'syncError': syncError,
    };
  }

  CodingPlatformProfile copyWith({
    String? platform,
    String? username,
    String? profileUrl,
    String? connectionStatus,
    String? verificationStatus,
    bool? showOnPublicProfile,
    CodingPlatformStats? stats,
    DateTime? lastSyncedAt,
    String? syncStatus,
    String? syncError,
  }) {
    return CodingPlatformProfile(
      platform: platform ?? this.platform,
      username: username ?? this.username,
      profileUrl: profileUrl ?? this.profileUrl,
      connectionStatus: connectionStatus ?? this.connectionStatus,
      verificationStatus: verificationStatus ?? this.verificationStatus,
      showOnPublicProfile: showOnPublicProfile ?? this.showOnPublicProfile,
      stats: stats ?? this.stats,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      syncStatus: syncStatus ?? this.syncStatus,
      syncError: syncError ?? this.syncError,
    );
  }
}

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
  final String linkedin;
  final String leetcodeHandle;
  final int leetcodeRating;
  final int githubCommits;
  final int atsScore;
  final String resumeVersion;
  final List<String> targetRoles;
  final List<String> preferredLocations;
  final List<String> skills;
  final List<String> extractedSkills;
  final List<StudentProject> projects;
  final List<CodingPlatformProfile> codingProfiles;
  final StudentPublicProfile publicProfile;
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
    this.linkedin = '',
    this.leetcodeHandle = '',
    this.leetcodeRating = 0,
    this.githubCommits = 0,
    this.atsScore = 0,
    this.resumeVersion = '',
    this.targetRoles = const [],
    this.preferredLocations = const [],
    this.skills = const [],
    this.extractedSkills = const [],
    this.projects = const [],
    this.codingProfiles = const [],
    this.publicProfile = const StudentPublicProfile(),
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
    final rawSkills = json['skills'];
    final skillsList = rawSkills is List ? rawSkills.map((s) => s.toString()).toList() : <String>[];
    final mlAnalysis = json['mlAnalysis'] as Map<String, dynamic>?;
    final rawExtracted = mlAnalysis?['extracted_skills'] ?? json['extractedSkills'];
    final extractedList = rawExtracted is List ? rawExtracted.map((s) => s.toString()).toList() : <String>[];
    final cgpaVal = (json['cgpa'] as num?)?.toDouble() ?? 0.0;
    final resumeUrl = json['resumeUrl'] as String? ?? '';
    final placementStatusVal = json['placementStatus'] as String? ?? 'Not Placed';

    int technical = (json['technicalScore'] as num?)?.toInt() ?? 0;
    if (technical <= 0 && skillsList.isNotEmpty) {
      technical = (skillsList.length * 20).clamp(50, 95);
    }

    int softSkill = (json['softSkillScore'] as num?)?.toInt() ?? 0;
    if (softSkill <= 0 && skillsList.isNotEmpty) {
      softSkill = 70;
    }

    int resumeScoreVal = (json['resumeScore'] as num?)?.toInt() ?? 0;
    if (resumeScoreVal <= 0 && resumeUrl.isNotEmpty) {
      resumeScoreVal = 85;
    }

    final academicScore = (cgpaVal * 10).round().clamp(0, 100);

    int readiness = (json['readinessScore'] as num?)?.toInt() ?? 0;
    if (readiness <= 0 && (skillsList.isNotEmpty || cgpaVal > 0 || resumeUrl.isNotEmpty)) {
      readiness = ((technical * 0.3) + (softSkill * 0.2) + (resumeScoreVal * 0.2) + (academicScore * 0.3)).round().clamp(0, 100);
    }

    final tier = readiness >= 80
        ? 'Tier-1 Contender • Placement Ready'
        : (readiness >= 60 ? 'Tier-2 Candidate • Developing' : 'Tier-3 • Needs Preparation');

    final rawProjects = json['projects'];
    final projectsList = rawProjects is List
        ? rawProjects
            .whereType<Map<String, dynamic>>()
            .map((p) => StudentProject.fromBackendJson(p))
            .toList()
        : <StudentProject>[];

    final rawCodingProfiles = json['codingProfiles'];
    final codingProfilesList = rawCodingProfiles is List
        ? rawCodingProfiles
            .whereType<Map<String, dynamic>>()
            .map((p) => CodingPlatformProfile.fromBackendJson(p))
            .toList()
        : <CodingPlatformProfile>[];

    // Derive leetcode legacy stats if present
    final lcProfile = codingProfilesList.where((p) => p.platform == 'LEETCODE' && p.connectionStatus == 'CONNECTED').firstOrNull;
    final derivedLcHandle = lcProfile?.username ?? (json['leetcode'] as String? ?? '');
    final derivedLcRating = lcProfile?.stats.currentRating ?? (json['leetcodeRating'] as num?)?.toInt() ?? 0;

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
      linkedin: json['linkedin'] as String? ?? '',
      leetcodeHandle: derivedLcHandle,
      leetcodeRating: derivedLcRating,
      atsScore: resumeScoreVal > 0 ? resumeScoreVal : (resumeUrl.isNotEmpty ? 80 : 0),
      resumeScore: resumeScoreVal,
      technicalScore: technical,
      softSkillScore: softSkill,
      placementStatus: placementStatusVal,
      resumeVersion: resumeUrl.isNotEmpty ? 'Uploaded Resume' : 'No Resume Uploaded',
      skills: skillsList,
      extractedSkills: extractedList,
      projects: projectsList,
      codingProfiles: codingProfilesList,
      publicProfile: StudentPublicProfile.fromJson(json['publicProfile'] as Map<String, dynamic>?),
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
    String? linkedin,
    String? leetcodeHandle,
    int? leetcodeRating,
    int? githubCommits,
    int? atsScore,
    String? resumeVersion,
    List<String>? targetRoles,
    List<String>? preferredLocations,
    List<String>? skills,
    List<String>? extractedSkills,
    List<StudentProject>? projects,
    List<CodingPlatformProfile>? codingProfiles,
    StudentPublicProfile? publicProfile,
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
      linkedin: linkedin ?? this.linkedin,
      leetcodeHandle: leetcodeHandle ?? this.leetcodeHandle,
      leetcodeRating: leetcodeRating ?? this.leetcodeRating,
      githubCommits: githubCommits ?? this.githubCommits,
      atsScore: atsScore ?? this.atsScore,
      resumeVersion: resumeVersion ?? this.resumeVersion,
      targetRoles: targetRoles ?? this.targetRoles,
      preferredLocations: preferredLocations ?? this.preferredLocations,
      skills: skills ?? this.skills,
      extractedSkills: extractedSkills ?? this.extractedSkills,
      projects: projects ?? this.projects,
      codingProfiles: codingProfiles ?? this.codingProfiles,
      publicProfile: publicProfile ?? this.publicProfile,
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
