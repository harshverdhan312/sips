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
    this.responsibilities = const [],
    this.eligibilityCriteria = const [],
    this.isBookmarked = false,
    this.hasApplied = false,
  });

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
      responsibilities: responsibilities ?? this.responsibilities,
      eligibilityCriteria: eligibilityCriteria ?? this.eligibilityCriteria,
      isBookmarked: isBookmarked ?? this.isBookmarked,
      hasApplied: hasApplied ?? this.hasApplied,
    );
  }
}
