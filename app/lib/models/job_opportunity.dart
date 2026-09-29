class JobOpportunity {
  final String id;
  final String company;
  final String role;
  final String department;
  final String location;
  final String type; // 'Full-time', 'Internship', etc.
  final String ctc; // e.g. "₹28 - 34 LPA" or "14.5 LPA"
  final double? ctcValue;
  final int matchScore; // 0 - 100
  final String deadline; // formatted e.g. "2027-10-10"
  final dynamic deadlineRaw;
  final String deadlineText; // friendly string
  final String logoUrl;
  final String description;
  final List<String> matchedSkills;
  final List<String> missingSkills;
  final List<String> requiredSkills;
  final List<String> allowedBranches;
  final double minCgpa;
  final bool isEligible;
  final List<String> eligibilityReasons;
  final bool hasApplied;
  final String? applicationStatus; // 'APPLIED', 'SHORTLISTED', 'REJECTED', 'SELECTED', 'WITHDRAWN'
  final DateTime? appliedAt;
  final String status; // 'ACTIVE', 'CLOSED', 'UPCOMING'
  final bool isActive;
  final bool isExpired;
  final List<String> responsibilities;
  final List<String> eligibilityCriteria;
  final bool isBookmarked;

  const JobOpportunity({
    required this.id,
    required this.company,
    required this.role,
    this.department = 'Engineering',
    required this.location,
    required this.type,
    required this.ctc,
    this.ctcValue,
    required this.matchScore,
    this.deadline = 'Open Drive',
    this.deadlineRaw,
    required this.deadlineText,
    this.logoUrl = '',
    required this.description,
    required this.matchedSkills,
    required this.missingSkills,
    this.requiredSkills = const [],
    this.allowedBranches = const [],
    this.minCgpa = 0.0,
    this.isEligible = true,
    this.eligibilityReasons = const [],
    this.hasApplied = false,
    this.applicationStatus,
    this.appliedAt,
    this.status = 'ACTIVE',
    this.isActive = true,
    this.isExpired = false,
    this.responsibilities = const [],
    this.eligibilityCriteria = const [],
    this.isBookmarked = false,
  });

  static bool computeIsExpired(dynamic deadlineRaw) {
    if (deadlineRaw == null) return false;
    try {
      final str = deadlineRaw.toString();
      DateTime? dt;
      if (str.length == 10 && RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(str)) {
        final parts = str.split('-');
        dt = DateTime(int.parse(parts[0]), int.parse(parts[1]), int.parse(parts[2]), 23, 59, 59, 999);
      } else {
        dt = DateTime.tryParse(str);
        if (dt != null && str.length <= 10) {
          dt = DateTime(dt.year, dt.month, dt.day, 23, 59, 59, 999);
        }
      }
      if (dt != null) {
        return dt.isBefore(DateTime.now());
      }
    } catch (_) {}
    return false;
  }

  factory JobOpportunity.fromBackendJson(Map<String, dynamic> json) {
    final deadlineRaw = json['deadline'];
    String deadlineFormatted = 'Open Drive';
    String deadlineText = 'Open Drive';
    DateTime? deadlineDate;

    if (deadlineRaw != null) {
      try {
        deadlineDate = DateTime.parse(deadlineRaw.toString());
        final year = deadlineDate.year.toString().padLeft(4, '0');
        final month = deadlineDate.month.toString().padLeft(2, '0');
        final day = deadlineDate.day.toString().padLeft(2, '0');
        deadlineFormatted = '$year-$month-$day';
        deadlineText = 'Deadline: $deadlineFormatted';
      } catch (_) {
        deadlineFormatted = deadlineRaw.toString();
        deadlineText = deadlineFormatted;
      }
    }

    final isExpired = computeIsExpired(deadlineRaw);
    final status = (json['status'] as String?)?.toUpperCase() ?? 'ACTIVE';
    final isStatusActive = status == 'ACTIVE';
    final isActive = isStatusActive && !isExpired;

    final matched = (json['matchedSkills'] as List?)?.map((s) => s.toString()).toList() ?? [];
    final missing = (json['missingSkills'] as List?)?.map((s) => s.toString()).toList() ?? [];
    final required = (json['requiredSkills'] as List?)?.map((s) => s.toString()).toList() ?? [];
    final allowedBranches = (json['allowedBranches'] as List?)?.map((s) => s.toString()).toList() ?? [];
    final minCgpa = (json['minCgpa'] as num?)?.toDouble() ?? 0.0;

    final eligibilityReasons = (json['eligibilityReasons'] as List?)?.map((e) => e.toString()).toList() ?? [];
    final isEligible = json['isEligible'] != null ? json['isEligible'] == true : (eligibilityReasons.isEmpty);

    final hasApplied = json['hasApplied'] == true || json['isApplied'] == true;
    final applicationStatus = json['applicationStatus'] as String?;

    DateTime? appliedAt;
    if (json['appliedAt'] != null) {
      try {
        appliedAt = DateTime.parse(json['appliedAt'].toString());
      } catch (_) {}
    }

    final eligibilityCriteria = <String>[];
    if (minCgpa > 0) eligibilityCriteria.add('Min CGPA: $minCgpa');
    if (allowedBranches.isNotEmpty) eligibilityCriteria.add('Branches: ${allowedBranches.join(', ')}');
    if (eligibilityReasons.isNotEmpty) {
      for (final r in eligibilityReasons) {
        if (!eligibilityCriteria.contains(r)) {
          eligibilityCriteria.add(r);
        }
      }
    }

    String ctcFormatted = 'Competitive';
    if (json['ctc'] != null && json['ctc'].toString().trim().isNotEmpty) {
      ctcFormatted = json['ctc'].toString();
    } else if (json['ctcValue'] != null) {
      ctcFormatted = '${json['ctcValue']} LPA';
    }

    return JobOpportunity(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      company: json['company'] as String? ?? 'Campus Recruiter',
      role: json['role'] as String? ?? json['title'] as String? ?? 'Software Engineer',
      department: json['department'] as String? ?? 'Engineering',
      location: json['location'] as String? ?? 'Bengaluru, India',
      type: json['type'] as String? ?? 'Full-time',
      ctc: ctcFormatted,
      ctcValue: (json['ctcValue'] as num?)?.toDouble(),
      matchScore: (json['matchScore'] as num?)?.toInt() ?? 0,
      deadline: deadlineFormatted,
      deadlineRaw: deadlineRaw,
      deadlineText: isExpired ? '$deadlineFormatted (Passed)' : deadlineText,
      description: json['description'] as String? ?? '',
      matchedSkills: matched,
      missingSkills: missing,
      requiredSkills: required,
      allowedBranches: allowedBranches,
      minCgpa: minCgpa,
      isEligible: isEligible,
      eligibilityReasons: eligibilityReasons,
      hasApplied: hasApplied,
      applicationStatus: applicationStatus ?? (hasApplied ? 'APPLIED' : null),
      appliedAt: appliedAt,
      status: status,
      isActive: isActive,
      isExpired: isExpired,
      eligibilityCriteria: eligibilityCriteria,
      isBookmarked: false,
    );
  }

  JobOpportunity copyWith({
    String? id,
    String? company,
    String? role,
    String? department,
    String? location,
    String? type,
    String? ctc,
    double? ctcValue,
    int? matchScore,
    String? deadline,
    dynamic deadlineRaw,
    String? deadlineText,
    String? logoUrl,
    String? description,
    List<String>? matchedSkills,
    List<String>? missingSkills,
    List<String>? requiredSkills,
    List<String>? allowedBranches,
    double? minCgpa,
    bool? isEligible,
    List<String>? eligibilityReasons,
    bool? hasApplied,
    String? applicationStatus,
    DateTime? appliedAt,
    String? status,
    bool? isActive,
    bool? isExpired,
    List<String>? responsibilities,
    List<String>? eligibilityCriteria,
    bool? isBookmarked,
  }) {
    return JobOpportunity(
      id: id ?? this.id,
      company: company ?? this.company,
      role: role ?? this.role,
      department: department ?? this.department,
      location: location ?? this.location,
      type: type ?? this.type,
      ctc: ctc ?? this.ctc,
      ctcValue: ctcValue ?? this.ctcValue,
      matchScore: matchScore ?? this.matchScore,
      deadline: deadline ?? this.deadline,
      deadlineRaw: deadlineRaw ?? this.deadlineRaw,
      deadlineText: deadlineText ?? this.deadlineText,
      logoUrl: logoUrl ?? this.logoUrl,
      description: description ?? this.description,
      matchedSkills: matchedSkills ?? this.matchedSkills,
      missingSkills: missingSkills ?? this.missingSkills,
      requiredSkills: requiredSkills ?? this.requiredSkills,
      allowedBranches: allowedBranches ?? this.allowedBranches,
      minCgpa: minCgpa ?? this.minCgpa,
      isEligible: isEligible ?? this.isEligible,
      eligibilityReasons: eligibilityReasons ?? this.eligibilityReasons,
      hasApplied: hasApplied ?? this.hasApplied,
      applicationStatus: applicationStatus ?? this.applicationStatus,
      appliedAt: appliedAt ?? this.appliedAt,
      status: status ?? this.status,
      isActive: isActive ?? this.isActive,
      isExpired: isExpired ?? this.isExpired,
      responsibilities: responsibilities ?? this.responsibilities,
      eligibilityCriteria: eligibilityCriteria ?? this.eligibilityCriteria,
      isBookmarked: isBookmarked ?? this.isBookmarked,
    );
  }
}
