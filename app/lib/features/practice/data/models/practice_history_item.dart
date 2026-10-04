class PracticeHistoryItem {
  final String id;
  final String category;
  final String status;
  final double score;
  final double totalMarks;
  final DateTime? createdAt;
  final int questionCount;

  const PracticeHistoryItem({
    required this.id,
    required this.category,
    required this.status,
    required this.score,
    required this.totalMarks,
    this.createdAt,
    this.questionCount = 0,
  });

  factory PracticeHistoryItem.fromJson(Map<String, dynamic> json) {
    return PracticeHistoryItem(
      id: json['id']?.toString() ?? '',
      category: json['category']?.toString() ?? 'PRACTICE',
      status: json['status']?.toString() ?? 'SUBMITTED',
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      totalMarks: (json['totalMarks'] as num?)?.toDouble() ?? 0.0,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
      questionCount: (json['questionCount'] as num?)?.toInt() ?? 0,
    );
  }

  double get accuracy {
    if (totalMarks <= 0) return 0.0;
    return (score / totalMarks) * 100;
  }
}
