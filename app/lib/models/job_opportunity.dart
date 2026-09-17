class JobOpportunity {
  final String id;
  final String company;
  final String role;
  final String location;
  final String type; // 'Full-Time', 'Internship'
  final String ctc; // e.g. "₹28 - 34 LPA"
  final int matchScore; // e.g. 91%
  final String deadlineText; // "Closes in 24h"
  final String logoUrl;
  final String description;
  final List<String> matchedSkills;
  final List<String> missingSkills;
  final List<String> requiredSkills;
  final List<String> responsibilities;
  final List<String> eligibilityCriteria;
  final bool isBookmarked;
  final bool hasApplied;

  const JobOpportunity({
    required this.id,
    required this.company,
    required this.role,
    required this.location,
    required this.type,
    required this.ctc,
    required this.matchScore,
    required this.deadlineText,
    this.logoUrl = '',
    required this.description,
    required this.matchedSkills,
    required this.missingSkills,
    this.requiredSkills = const [],
    this.responsibilities = const [],
    this.eligibilityCriteria = const [],
    this.isBookmarked = false,
    this.hasApplied = false,
  });

  factory JobOpportunity.fromBackendJson(Map<String, dynamic> json) {
    final deadlineRaw = json['deadline'];
    String deadlineFormatted = 'Active Drive';
    if (deadlineRaw != null) {
      try {
        final dt = DateTime.parse(deadlineRaw.toString());
        deadlineFormatted = 'Closes ${dt.day}/${dt.month}/${dt.year}';
      } catch (_) {
        deadlineFormatted = deadlineRaw.toString();
      }
    }

    final matched = (json['matchedSkills'] as List?)?.map((s) => s.toString()).toList() ?? [];
    final missing = (json['missingSkills'] as List?)?.map((s) => s.toString()).toList() ?? [];
    final required = (json['requiredSkills'] as List?)?.map((s) => s.toString()).toList() ?? [];
    final allowedBranches = (json['allowedBranches'] as List?)?.map((s) => s.toString()).toList() ?? [];
    final minCgpa = json['minCgpa'] != null ? 'Min CGPA: ${json['minCgpa']}' : null;

    final eligibility = <String>[];
    if (minCgpa != null) eligibility.add(minCgpa);
    if (allowedBranches.isNotEmpty) eligibility.add('Branches: ${allowedBranches.join(', ')}');

    return JobOpportunity(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      company: json['company'] as String? ?? 'Campus Recruiter',
      role: json['role'] as String? ?? json['title'] as String? ?? 'Software Engineer',
      location: json['location'] as String? ?? 'Bengaluru, India',
      type: json['type'] as String? ?? 'Full-time',
      ctc: json['ctc'] as String? ?? (json['ctcValue'] != null ? '${json['ctcValue']} LPA' : 'Competitive'),
      matchScore: (json['matchScore'] as num?)?.toInt() ?? 0,
      deadlineText: deadlineFormatted,
      description: json['description'] as String? ?? '',
      matchedSkills: matched,
      missingSkills: missing,
      requiredSkills: required,
      eligibilityCriteria: eligibility,
      isBookmarked: false,
      hasApplied: false,
    );
  }

  JobOpportunity copyWith({
    String? id,
    String? company,
    String? role,
    String? location,
    String? type,
    String? ctc,
    int? matchScore,
    String? deadlineText,
    String? logoUrl,
    String? description,
    List<String>? matchedSkills,
    List<String>? missingSkills,
    List<String>? requiredSkills,
    List<String>? responsibilities,
    List<String>? eligibilityCriteria,
    bool? isBookmarked,
    bool? hasApplied,
  }) {
    return JobOpportunity(
      id: id ?? this.id,
      company: company ?? this.company,
      role: role ?? this.role,
      location: location ?? this.location,
      type: type ?? this.type,
      ctc: ctc ?? this.ctc,
      matchScore: matchScore ?? this.matchScore,
      deadlineText: deadlineText ?? this.deadlineText,
      logoUrl: logoUrl ?? this.logoUrl,
      description: description ?? this.description,
      matchedSkills: matchedSkills ?? this.matchedSkills,
      missingSkills: missingSkills ?? this.missingSkills,
      requiredSkills: requiredSkills ?? this.requiredSkills,
      responsibilities: responsibilities ?? this.responsibilities,
      eligibilityCriteria: eligibilityCriteria ?? this.eligibilityCriteria,
      isBookmarked: isBookmarked ?? this.isBookmarked,
      hasApplied: hasApplied ?? this.hasApplied,
    );
  }
}
