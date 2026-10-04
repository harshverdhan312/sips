class QuestionResultItem {
  final String questionVersionId;
  final String title;
  final String statement;
  final List<dynamic> options;
  final dynamic correctAnswer;
  final String? explanation;
  final dynamic candidateAnswer;
  final bool isCorrect;
  final double marksAwarded;

  const QuestionResultItem({
    required this.questionVersionId,
    required this.title,
    required this.statement,
    required this.options,
    required this.correctAnswer,
    this.explanation,
    this.candidateAnswer,
    required this.isCorrect,
    required this.marksAwarded,
  });

  factory QuestionResultItem.fromJson(Map<String, dynamic> json) {
    return QuestionResultItem(
      questionVersionId: json['questionVersionId']?.toString() ?? json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      statement: json['statement']?.toString() ?? '',
      options: (json['options'] as List?) ?? [],
      correctAnswer: json['correctAnswer'],
      explanation: json['explanation']?.toString(),
      candidateAnswer: json['candidateAnswer'] ?? json['answerData'],
      isCorrect: json['isCorrect'] == true,
      marksAwarded: (json['marksAwarded'] as num?)?.toDouble() ?? 0.0,
    );
  }

  String? get correctOptionId {
    if (correctAnswer is Map) {
      return correctAnswer['optionId']?.toString();
    }
    if (correctAnswer is String) {
      return correctAnswer.toString();
    }
    return null;
  }

  String? get chosenOptionId {
    if (candidateAnswer is Map) {
      return candidateAnswer['optionId']?.toString();
    }
    if (candidateAnswer is String) {
      return candidateAnswer.toString();
    }
    return null;
  }
}

class PracticeResult {
  final String attemptId;
  final String category;
  final String status;
  final double score;
  final double totalMarks;
  final double accuracyPercentage;
  final int totalQuestions;
  final int correctCount;
  final List<QuestionResultItem> questions;

  const PracticeResult({
    required this.attemptId,
    required this.category,
    required this.status,
    required this.score,
    required this.totalMarks,
    required this.accuracyPercentage,
    required this.totalQuestions,
    required this.correctCount,
    required this.questions,
  });

  factory PracticeResult.fromJson(Map<String, dynamic> json) {
    final rawQs = json['questions'];
    final List<QuestionResultItem> items = [];

    if (rawQs is List) {
      for (final q in rawQs) {
        if (q is Map<String, dynamic>) {
          items.add(QuestionResultItem.fromJson(q));
        }
      }
    }

    final double scoreVal = (json['score'] as num?)?.toDouble() ?? 0.0;
    final double totalMarksVal = (json['totalMarks'] as num?)?.toDouble() ?? items.length.toDouble();
    final int correct = items.where((q) => q.isCorrect).length;
    final double accuracy = items.isNotEmpty ? (correct / items.length) * 100 : 0.0;

    return PracticeResult(
      attemptId: json['attemptId']?.toString() ?? json['id']?.toString() ?? '',
      category: json['category']?.toString() ?? 'PRACTICE',
      status: json['status']?.toString() ?? 'SUBMITTED',
      score: scoreVal,
      totalMarks: totalMarksVal,
      accuracyPercentage: (json['accuracyPercentage'] as num?)?.toDouble() ?? accuracy,
      totalQuestions: items.length,
      correctCount: correct,
      questions: items,
    );
  }
}
