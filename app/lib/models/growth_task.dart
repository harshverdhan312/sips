class GrowthTask {
  final String id;
  final String title;
  final String category; // 'DSA & Code', 'System Design', 'Behavioral / STAR', 'Profile'
  final String durationText; // "25 mins"
  final String targetCompanyTag; // "Uber Tagged", "Stripe Focus"
  final double scoreBoost; // +2.5 pts
  final List<String> targetTopics;
  final bool isCompleted;

  const GrowthTask({
    required this.id,
    required this.title,
    required this.category,
    required this.durationText,
    this.targetCompanyTag = '',
    required this.scoreBoost,
    this.targetTopics = const [],
    this.isCompleted = false,
  });

  GrowthTask copyWith({
    String? id,
    String? title,
    String? category,
    String? durationText,
    String? targetCompanyTag,
    double? scoreBoost,
    List<String>? targetTopics,
    bool? isCompleted,
  }) {
    return GrowthTask(
      id: id ?? this.id,
      title: title ?? this.title,
      category: category ?? this.category,
      durationText: durationText ?? this.durationText,
      targetCompanyTag: targetCompanyTag ?? this.targetCompanyTag,
      scoreBoost: scoreBoost ?? this.scoreBoost,
      targetTopics: targetTopics ?? this.targetTopics,
      isCompleted: isCompleted ?? this.isCompleted,
    );
  }
}
