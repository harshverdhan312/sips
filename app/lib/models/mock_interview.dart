class InterviewQuestion {
  final int questionNumber;
  final String title;
  final String category; // "System Architecture", "Algorithms", "Concurrency"
  final String prompt;
  final List<String> keyTalkingPoints;
  final String userNotesOrAnswer;

  const InterviewQuestion({
    required this.questionNumber,
    required this.title,
    required this.category,
    required this.prompt,
    required this.keyTalkingPoints,
    this.userNotesOrAnswer = '',
  });

  InterviewQuestion copyWith({
    int? questionNumber,
    String? title,
    String? category,
    String? prompt,
    List<String>? keyTalkingPoints,
    String? userNotesOrAnswer,
  }) {
    return InterviewQuestion(
      questionNumber: questionNumber ?? this.questionNumber,
      title: title ?? this.title,
      category: category ?? this.category,
      prompt: prompt ?? this.prompt,
      keyTalkingPoints: keyTalkingPoints ?? this.keyTalkingPoints,
      userNotesOrAnswer: userNotesOrAnswer ?? this.userNotesOrAnswer,
    );
  }
}

class InterviewDiagnosticReport {
  final String id;
  final int overallScore; // e.g. 84%
  final String interviewTitle;
  final String date;
  final int technicalScore; // 88%
  final int communicationScore; // 82%
  final int structureScore; // 85%
  final int starMethodScore; // 80%
  final int confidenceScore; // 86%
  final String summaryVerdict;
  final List<String> topStrengths;
  final List<String> highPriorityGaps;
  final List<String> actionableNextSteps;

  const InterviewDiagnosticReport({
    required this.id,
    required this.overallScore,
    required this.interviewTitle,
    required this.date,
    required this.technicalScore,
    required this.communicationScore,
    required this.structureScore,
    required this.starMethodScore,
    required this.confidenceScore,
    required this.summaryVerdict,
    required this.topStrengths,
    required this.highPriorityGaps,
    required this.actionableNextSteps,
  });
}
