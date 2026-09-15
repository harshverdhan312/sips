import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/growth_task.dart';
import '../models/job_opportunity.dart';
import '../models/mock_interview.dart';
import '../models/peer_match.dart';
import '../models/placement_alert.dart';
import '../models/readiness_metric.dart';
import '../models/roadmap_milestone.dart';
import '../models/skill_intelligence.dart';
import '../models/student_profile.dart';
import '../repositories/mock_sips_repository.dart';
import '../repositories/sips_repository.dart';

// --- Repository Provider ---
final sipsRepositoryProvider = Provider<SipsRepository>((ref) {
  return MockSipsRepository();
});

// --- Auth State & Provider ---
class AuthState {
  final bool isAuthenticated;
  final bool isOnboardingCompleted;
  final String userEmail;
  final bool isLoading;

  const AuthState({
    this.isAuthenticated = true, // default authenticated for seamless exploration
    this.isOnboardingCompleted = true,
    this.userEmail = 'aarav.sharma@nit.ac.in',
    this.isLoading = false,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isOnboardingCompleted,
    String? userEmail,
    bool? isLoading,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isOnboardingCompleted: isOnboardingCompleted ?? this.isOnboardingCompleted,
      userEmail: userEmail ?? this.userEmail,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState());

  Future<void> signIn(String email, String password) async {
    state = state.copyWith(isLoading: true);
    await Future.delayed(const Duration(milliseconds: 600));
    state = state.copyWith(
      isAuthenticated: true,
      userEmail: email.isEmpty ? 'aarav.sharma@nit.ac.in' : email,
      isLoading: false,
    );
  }

  void completeOnboarding() {
    state = state.copyWith(isOnboardingCompleted: true);
  }

  void signOut() {
    state = const AuthState(
      isAuthenticated: false,
      isOnboardingCompleted: false,
      userEmail: '',
    );
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

// --- Student Profile Provider ---
class ProfileNotifier extends StateNotifier<AsyncValue<StudentProfile>> {
  final SipsRepository _repository;

  ProfileNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadProfile();
  }

  Future<void> loadProfile() async {
    state = const AsyncValue.loading();
    try {
      final profile = await _repository.getStudentProfile();
      state = AsyncValue.data(profile);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> updateProfile(StudentProfile profile) async {
    state = const AsyncValue.loading();
    try {
      final updated = await _repository.updateStudentProfile(profile);
      state = AsyncValue.data(updated);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final studentProfileProvider = StateNotifierProvider<ProfileNotifier, AsyncValue<StudentProfile>>((ref) {
  final repo = ref.watch(sipsRepositoryProvider);
  return ProfileNotifier(repo);
});

// --- Readiness Metric Provider ---
class ReadinessNotifier extends StateNotifier<AsyncValue<ReadinessMetric>> {
  final SipsRepository _repository;

  ReadinessNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadReadiness();
  }

  Future<void> loadReadiness() async {
    state = const AsyncValue.loading();
    try {
      final data = await _repository.getReadinessMetric();
      state = AsyncValue.data(data);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void recalculate() async {
    final data = await _repository.getReadinessMetric();
    state = AsyncValue.data(data);
  }
}

final readinessProvider = StateNotifierProvider<ReadinessNotifier, AsyncValue<ReadinessMetric>>((ref) {
  final repo = ref.watch(sipsRepositoryProvider);
  return ReadinessNotifier(repo);
});

// --- Skills Provider ---
final skillsProvider = FutureProvider<List<SkillItem>>((ref) async {
  final repo = ref.watch(sipsRepositoryProvider);
  return repo.getSkills();
});

// --- Opportunities Provider ---
class OpportunitiesNotifier extends StateNotifier<AsyncValue<List<JobOpportunity>>> {
  final SipsRepository _repository;

  OpportunitiesNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadJobs();
  }

  Future<void> loadJobs() async {
    state = const AsyncValue.loading();
    try {
      final jobs = await _repository.getJobOpportunities();
      state = AsyncValue.data(jobs);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> toggleBookmark(String jobId) async {
    await _repository.toggleJobBookmark(jobId);
    final jobs = await _repository.getJobOpportunities();
    state = AsyncValue.data(jobs);
  }

  Future<void> apply(String jobId) async {
    await _repository.applyForJob(jobId);
    final jobs = await _repository.getJobOpportunities();
    state = AsyncValue.data(jobs);
  }
}

final opportunitiesProvider =
    StateNotifierProvider<OpportunitiesNotifier, AsyncValue<List<JobOpportunity>>>((ref) {
  final repo = ref.watch(sipsRepositoryProvider);
  return OpportunitiesNotifier(repo);
});

// --- Growth Tasks Provider ---
class GrowthTasksNotifier extends StateNotifier<AsyncValue<List<GrowthTask>>> {
  final SipsRepository _repository;
  final Ref _ref;

  GrowthTasksNotifier(this._repository, this._ref) : super(const AsyncValue.loading()) {
    loadTasks();
  }

  Future<void> loadTasks() async {
    state = const AsyncValue.loading();
    try {
      final tasks = await _repository.getGrowthTasks();
      state = AsyncValue.data(tasks);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> toggleTask(String taskId) async {
    try {
      await _repository.toggleTaskCompletion(taskId);
      final tasks = await _repository.getGrowthTasks();
      state = AsyncValue.data(tasks);
      _ref.read(readinessProvider.notifier).recalculate();
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final growthTasksProvider = StateNotifierProvider<GrowthTasksNotifier, AsyncValue<List<GrowthTask>>>((ref) {
  final repo = ref.watch(sipsRepositoryProvider);
  return GrowthTasksNotifier(repo, ref);
});

// --- Roadmap Provider ---
final roadmapProvider = FutureProvider<List<RoadmapMilestone>>((ref) async {
  final repo = ref.watch(sipsRepositoryProvider);
  return repo.getRoadmapMilestones();
});

// --- Mock Interview Runner Provider ---
class InterviewSessionState {
  final int currentQuestionIndex;
  final List<InterviewQuestion> questions;
  final int elapsedSeconds;
  final bool isRecording;
  final bool isCompleted;

  const InterviewSessionState({
    this.currentQuestionIndex = 0,
    this.questions = const [],
    this.elapsedSeconds = 0,
    this.isRecording = false,
    this.isCompleted = false,
  });

  InterviewSessionState copyWith({
    int? currentQuestionIndex,
    List<InterviewQuestion>? questions,
    int? elapsedSeconds,
    bool? isRecording,
    bool? isCompleted,
  }) {
    return InterviewSessionState(
      currentQuestionIndex: currentQuestionIndex ?? this.currentQuestionIndex,
      questions: questions ?? this.questions,
      elapsedSeconds: elapsedSeconds ?? this.elapsedSeconds,
      isRecording: isRecording ?? this.isRecording,
      isCompleted: isCompleted ?? this.isCompleted,
    );
  }
}

class InterviewSessionNotifier extends StateNotifier<InterviewSessionState> {
  final SipsRepository _repository;

  InterviewSessionNotifier(this._repository) : super(const InterviewSessionState()) {
    initSession();
  }

  Future<void> initSession() async {
    final questions = await _repository.getMockInterviewQuestions();
    state = InterviewSessionState(questions: questions, isRecording: true);
  }

  void nextQuestion() {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      state = state.copyWith(currentQuestionIndex: state.currentQuestionIndex + 1);
    } else {
      state = state.copyWith(isCompleted: true);
    }
  }

  void previousQuestion() {
    if (state.currentQuestionIndex > 0) {
      state = state.copyWith(currentQuestionIndex: state.currentQuestionIndex - 1);
    }
  }

  void toggleRecording() {
    state = state.copyWith(isRecording: !state.isRecording);
  }

  void updateAnswerNotes(String notes) {
    final updatedList = List<InterviewQuestion>.from(state.questions);
    updatedList[state.currentQuestionIndex] =
        updatedList[state.currentQuestionIndex].copyWith(userNotesOrAnswer: notes);
    state = state.copyWith(questions: updatedList);
  }
}

final interviewSessionProvider =
    StateNotifierProvider<InterviewSessionNotifier, InterviewSessionState>((ref) {
  final repo = ref.watch(sipsRepositoryProvider);
  return InterviewSessionNotifier(repo);
});

// --- Interview Diagnostic Provider ---
final interviewDiagnosticProvider = FutureProvider<InterviewDiagnosticReport>((ref) async {
  final repo = ref.watch(sipsRepositoryProvider);
  return repo.getDiagnosticReport();
});

// --- Peer Matching Provider ---
final peerMatchingProvider = FutureProvider<List<PeerMatch>>((ref) async {
  final repo = ref.watch(sipsRepositoryProvider);
  return repo.getPeerMatches();
});

// --- Placement Alerts Provider ---
class AlertsNotifier extends StateNotifier<AsyncValue<List<PlacementAlert>>> {
  final SipsRepository _repository;

  AlertsNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadAlerts();
  }

  Future<void> loadAlerts() async {
    state = const AsyncValue.loading();
    try {
      final alerts = await _repository.getPlacementAlerts();
      state = AsyncValue.data(alerts);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> markAsRead(String alertId) async {
    await _repository.markAlertAsRead(alertId);
    final alerts = await _repository.getPlacementAlerts();
    state = AsyncValue.data(alerts);
  }
}

final alertsProvider = StateNotifierProvider<AlertsNotifier, AsyncValue<List<PlacementAlert>>>((ref) {
  final repo = ref.watch(sipsRepositoryProvider);
  return AlertsNotifier(repo);
});
