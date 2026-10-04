class CategoryAccuracy {
  final String category;
  final int totalAttempted;
  final int totalCorrect;
  final double accuracy;

  const CategoryAccuracy({
    required this.category,
    required this.totalAttempted,
    required this.totalCorrect,
    required this.accuracy,
  });

  factory CategoryAccuracy.fromJson(Map<String, dynamic> json) {
    return CategoryAccuracy(
      category: json['category']?.toString() ?? 'General',
      totalAttempted: (json['totalAttempted'] as num?)?.toInt() ?? 0,
      totalCorrect: (json['totalCorrect'] as num?)?.toInt() ?? 0,
      accuracy: (json['accuracy'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class PracticeProgress {
  final int streakDays;
  final int totalAttempts;
  final int totalSolved;
  final double overallAccuracy;
  final List<CategoryAccuracy> categoryBreakdown;

  const PracticeProgress({
    this.streakDays = 0,
    this.totalAttempts = 0,
    this.totalSolved = 0,
    this.overallAccuracy = 0.0,
    this.categoryBreakdown = const [],
  });

  factory PracticeProgress.fromJson(Map<String, dynamic> json) {
    final streakObj = json['streak'];
    final int streak = (streakObj is Map ? streakObj['currentStreak'] : json['streakDays']) as int? ?? 0;

    final rawBreakdown = json['categoryBreakdown'] ?? json['breakdown'];
    final List<CategoryAccuracy> breakdown = [];
    if (rawBreakdown is List) {
      for (final b in rawBreakdown) {
        if (b is Map<String, dynamic>) {
          breakdown.add(CategoryAccuracy.fromJson(b));
        }
      }
    }

    return PracticeProgress(
      streakDays: streak,
      totalAttempts: (json['totalAttempts'] as num?)?.toInt() ?? 0,
      totalSolved: (json['totalQuestionsAnswered'] as num?)?.toInt() ?? (json['totalSolved'] as num?)?.toInt() ?? 0,
      overallAccuracy: (json['overallAccuracy'] as num?)?.toDouble() ?? (json['accuracy'] as num?)?.toDouble() ?? 0.0,
      categoryBreakdown: breakdown,
    );
  }
}
