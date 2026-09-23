class JobMatchAnalysis {
  final String jobId;
  final String jobTitle;
  final String company;
  final String mlStatus;
  final List<String> matchedSkills;
  final List<String> missingSkills;
  final double skillCoverageScore;
  final double? semanticSimilarity;
  final double? semanticScore;
  final double hybridMatchScore;
  final double skillWeight;
  final double semanticWeight;
  final String? message;

  const JobMatchAnalysis({
    required this.jobId,
    required this.jobTitle,
    required this.company,
    required this.mlStatus,
    required this.matchedSkills,
    required this.missingSkills,
    required this.skillCoverageScore,
    this.semanticSimilarity,
    this.semanticScore,
    required this.hybridMatchScore,
    required this.skillWeight,
    required this.semanticWeight,
    this.message,
  });

  factory JobMatchAnalysis.fromJson(Map<String, dynamic> json) {
    final hybrid = json['hybridMatch'] as Map<String, dynamic>? ?? {};
    return JobMatchAnalysis(
      jobId: json['jobId']?.toString() ?? '',
      jobTitle: json['jobTitle']?.toString() ?? '',
      company: json['company']?.toString() ?? '',
      mlStatus: json['mlStatus']?.toString() ?? 'unknown',
      matchedSkills: (hybrid['matched_skills'] as List?)?.map((e) => e.toString()).toList() ?? [],
      missingSkills: (hybrid['missing_skills'] as List?)?.map((e) => e.toString()).toList() ?? [],
      skillCoverageScore: (hybrid['skill_coverage_score'] as num?)?.toDouble() ?? 0.0,
      semanticSimilarity: (hybrid['semantic_similarity'] as num?)?.toDouble(),
      semanticScore: (hybrid['semantic_score'] as num?)?.toDouble(),
      hybridMatchScore: (hybrid['hybrid_match_score'] as num?)?.toDouble() ?? 0.0,
      skillWeight: (hybrid['skill_weight'] as num?)?.toDouble() ?? 0.6,
      semanticWeight: (hybrid['semantic_weight'] as num?)?.toDouble() ?? 0.4,
      message: json['message']?.toString(),
    );
  }
}
