class DomainScore {
  final String title;
  final int score; // 0-100
  final String category;

  const DomainScore({
    required this.title,
    required this.score,
    required this.category,
  });
}

class ReadinessMetric {
  final int overallScore; // e.g. 78
  final int maxScore; // 100
  final String percentileText; // "Top 12% in CSE Batch"
  final String profileSummary; // "High probability profile for System & Core Engineering"
  final String scoreGainText; // "+16 pts • 8 wks"
  final int techDepthScore; // 88%
  final int starBehaviorScore; // 86%
  final int systemArchScore; // 79%
  final List<DomainScore> domainScores;

  const ReadinessMetric({
    this.overallScore = 78,
    this.maxScore = 100,
    this.percentileText = 'Top 12% in CSE Batch',
    this.profileSummary = 'High probability profile for System & Core Engineering',
    this.scoreGainText = '+16 pts • 8 wks',
    this.techDepthScore = 88,
    this.starBehaviorScore = 86,
    this.systemArchScore = 79,
    this.domainScores = const [
      DomainScore(title: 'Algorithms & Data Structures', score: 94, category: 'dsa'),
      DomainScore(title: 'Modern Python & Concurrency', score: 89, category: 'backend'),
      DomainScore(title: 'Distributed System Architecture', score: 78, category: 'arch'),
      DomainScore(title: 'RESTful APIs & GraphQL', score: 96, category: 'api'),
    ],
  });

  ReadinessMetric copyWith({
    int? overallScore,
    int? maxScore,
    String? percentileText,
    String? profileSummary,
    String? scoreGainText,
    int? techDepthScore,
    int? starBehaviorScore,
    int? systemArchScore,
    List<DomainScore>? domainScores,
  }) {
    return ReadinessMetric(
      overallScore: overallScore ?? this.overallScore,
      maxScore: maxScore ?? this.maxScore,
      percentileText: percentileText ?? this.percentileText,
      profileSummary: profileSummary ?? this.profileSummary,
      scoreGainText: scoreGainText ?? this.scoreGainText,
      techDepthScore: techDepthScore ?? this.techDepthScore,
      starBehaviorScore: starBehaviorScore ?? this.starBehaviorScore,
      systemArchScore: systemArchScore ?? this.systemArchScore,
      domainScores: domainScores ?? this.domainScores,
    );
  }
}
