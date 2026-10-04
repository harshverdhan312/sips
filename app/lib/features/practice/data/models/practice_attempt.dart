class PracticeAttempt {
  final String attemptId;
  final String studentId;
  final String collegeId;
  final String category;
  final String status;
  final int questionCount;
  final DateTime? startedAt;

  const PracticeAttempt({
    required this.attemptId,
    required this.studentId,
    required this.collegeId,
    required this.category,
    required this.status,
    required this.questionCount,
    this.startedAt,
  });

  factory PracticeAttempt.fromJson(Map<String, dynamic> json) {
    return PracticeAttempt(
      attemptId: json['attemptId']?.toString() ?? json['id']?.toString() ?? '',
      studentId: json['studentId']?.toString() ?? '',
      collegeId: json['collegeId']?.toString() ?? '',
      category: json['category']?.toString() ?? 'GENERAL',
      status: json['status']?.toString() ?? 'IN_PROGRESS',
      questionCount: (json['questionCount'] as num?)?.toInt() ?? 0,
      startedAt: json['startedAt'] != null ? DateTime.tryParse(json['startedAt'].toString()) : null,
    );
  }
}
