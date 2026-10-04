import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/practice_history_item.dart';
import '../data/models/practice_progress.dart';
import '../data/models/practice_question.dart';
import '../data/models/practice_result.dart';
import '../data/practice_repository.dart';

final practiceRepositoryProvider = Provider<PracticeRepository>((ref) {
  return ApiPracticeRepository();
});

final practiceProgressProvider = FutureProvider.autoDispose<PracticeProgress>((ref) async {
  final repo = ref.watch(practiceRepositoryProvider);
  return repo.getProgress();
});

final practiceHistoryProvider = FutureProvider.autoDispose.family<List<PracticeHistoryItem>, String?>((ref, category) async {
  final repo = ref.watch(practiceRepositoryProvider);
  return repo.getHistory(category: category);
});

final practiceResultProvider = FutureProvider.autoDispose.family<PracticeResult, String>((ref, attemptId) async {
  final repo = ref.watch(practiceRepositoryProvider);
  return repo.getResult(attemptId);
});

// Active Practice Session State
class PracticeSessionState {
  final String attemptId;
  final List<PracticeQuestion> questions;
  final int currentIndex;
  final Map<String, String> answers; // questionVersionId -> optionId
  final bool isLoading;
  final bool isSaving;
  final bool isSubmitting;
  final String? error;
  final PracticeResult? result;

  const PracticeSessionState({
    required this.attemptId,
    this.questions = const [],
    this.currentIndex = 0,
    this.answers = const {},
    this.isLoading = true,
    this.isSaving = false,
    this.isSubmitting = false,
    this.error,
    this.result,
  });

  PracticeQuestion? get currentQuestion =>
      questions.isNotEmpty && currentIndex >= 0 && currentIndex < questions.length
          ? questions[currentIndex]
          : null;

  int get totalQuestions => questions.length;
  int get answeredCount => answers.length;
  double get progressPercentage => totalQuestions > 0 ? (currentIndex + 1) / totalQuestions : 0.0;

  PracticeSessionState copyWith({
    String? attemptId,
    List<PracticeQuestion>? questions,
    int? currentIndex,
    Map<String, String>? answers,
    bool? isLoading,
    bool? isSaving,
    bool? isSubmitting,
    String? error,
    PracticeResult? result,
  }) {
    return PracticeSessionState(
      attemptId: attemptId ?? this.attemptId,
      questions: questions ?? this.questions,
      currentIndex: currentIndex ?? this.currentIndex,
      answers: answers ?? this.answers,
      isLoading: isLoading ?? this.isLoading,
      isSaving: isSaving ?? this.isSaving,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: error,
      result: result ?? this.result,
    );
  }
}

class PracticeSessionNotifier extends StateNotifier<PracticeSessionState> {
  final PracticeRepository _repository;

  PracticeSessionNotifier(this._repository, String attemptId)
      : super(PracticeSessionState(attemptId: attemptId)) {
    loadSession();
  }

  Future<void> loadSession() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final questions = await _repository.getDeliveredQuestions(state.attemptId);
      final initialAnswers = <String, String>{};
      for (final q in questions) {
        if (q.selectedOptionId != null && q.selectedOptionId!.isNotEmpty) {
          initialAnswers[q.questionVersionId] = q.selectedOptionId!;
        }
      }
      state = state.copyWith(
        questions: questions,
        answers: initialAnswers,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load questions: ${e.toString()}',
      );
    }
  }

  Future<void> selectOption(String questionVersionId, String optionId) async {
    final updatedAnswers = Map<String, String>.from(state.answers);
    updatedAnswers[questionVersionId] = optionId;

    // Update local state immediately for snappy UI
    state = state.copyWith(answers: updatedAnswers, isSaving: true);

    try {
      await _repository.saveResponse(
        attemptId: state.attemptId,
        questionVersionId: questionVersionId,
        optionId: optionId,
      );
      state = state.copyWith(isSaving: false);
    } catch (_) {
      state = state.copyWith(isSaving: false);
    }
  }

  void nextQuestion() {
    if (state.currentIndex < state.questions.length - 1) {
      state = state.copyWith(currentIndex: state.currentIndex + 1);
    }
  }

  void previousQuestion() {
    if (state.currentIndex > 0) {
      state = state.copyWith(currentIndex: state.currentIndex - 1);
    }
  }

  void goToQuestion(int index) {
    if (index >= 0 && index < state.questions.length) {
      state = state.copyWith(currentIndex: index);
    }
  }

  Future<bool> submit() async {
    state = state.copyWith(isSubmitting: true, error: null);
    try {
      await _repository.submitAttempt(state.attemptId);
      final result = await _repository.getResult(state.attemptId);
      state = state.copyWith(isSubmitting: false, result: result);
      return true;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        error: 'Failed to submit attempt: ${e.toString()}',
      );
      return false;
    }
  }
}

final practiceSessionProvider = StateNotifierProvider.autoDispose
    .family<PracticeSessionNotifier, PracticeSessionState, String>((ref, attemptId) {
  final repo = ref.watch(practiceRepositoryProvider);
  return PracticeSessionNotifier(repo, attemptId);
});
