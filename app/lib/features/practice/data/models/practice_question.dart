class QuestionOption {
  final String id;
  final String text;

  const QuestionOption({
    required this.id,
    required this.text,
  });

  factory QuestionOption.fromJson(Map<String, dynamic> json) {
    return QuestionOption(
      id: json['id']?.toString() ?? '',
      text: json['text']?.toString() ?? json['label']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'text': text,
  };
}

class PracticeQuestion {
  final String id;
  final String questionVersionId;
  final String title;
  final String statement;
  final String type;
  final String format;
  final String category;
  final String? subcategory;
  final String difficulty;
  final List<QuestionOption> options;
  final String? responseId;
  final bool answered;
  final String? selectedOptionId;

  const PracticeQuestion({
    required this.id,
    required this.questionVersionId,
    required this.title,
    required this.statement,
    required this.type,
    required this.format,
    required this.category,
    this.subcategory,
    required this.difficulty,
    required this.options,
    this.responseId,
    this.answered = false,
    this.selectedOptionId,
  });

  factory PracticeQuestion.fromJson(Map<String, dynamic> json) {
    final rawOptions = json['options'];
    final List<QuestionOption> parsedOptions = [];

    if (rawOptions is List) {
      for (final opt in rawOptions) {
        if (opt is Map<String, dynamic>) {
          parsedOptions.add(QuestionOption.fromJson(opt));
        } else if (opt is String) {
          parsedOptions.add(QuestionOption(id: opt, text: opt));
        }
      }
    }

    String? selectedOpt;
    final currentAns = json['currentAnswer'] ?? json['answerData'];
    if (currentAns is Map) {
      selectedOpt = currentAns['optionId']?.toString();
    }

    return PracticeQuestion(
      id: json['id']?.toString() ?? '',
      questionVersionId: json['questionVersionId']?.toString() ?? json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      statement: json['statement']?.toString() ?? '',
      type: json['type']?.toString() ?? 'APTITUDE',
      format: json['format']?.toString() ?? 'SINGLE_CHOICE',
      category: json['category']?.toString() ?? 'QUANTITATIVE',
      subcategory: json['subcategory']?.toString(),
      difficulty: json['difficulty']?.toString() ?? 'MEDIUM',
      options: parsedOptions,
      responseId: json['responseId']?.toString(),
      answered: json['answered'] == true || selectedOpt != null,
      selectedOptionId: selectedOpt,
    );
  }

  PracticeQuestion copyWith({
    String? selectedOptionId,
    bool? answered,
  }) {
    return PracticeQuestion(
      id: id,
      questionVersionId: questionVersionId,
      title: title,
      statement: statement,
      type: type,
      format: format,
      category: category,
      subcategory: subcategory,
      difficulty: difficulty,
      options: options,
      responseId: responseId,
      answered: answered ?? this.answered,
      selectedOptionId: selectedOptionId ?? this.selectedOptionId,
    );
  }
}
