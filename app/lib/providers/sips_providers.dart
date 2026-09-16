import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';
import '../models/growth_task.dart';
import '../models/job_opportunity.dart';
import '../models/mock_interview.dart';
import '../models/peer_match.dart';
import '../models/placement_alert.dart';
import '../models/readiness_metric.dart';
import '../models/roadmap_milestone.dart';
import '../models/skill_intelligence.dart';
import '../models/student_profile.dart';
import '../repositories/api_sips_repository.dart';
import '../repositories/sips_repository.dart';

// --- API Client Provider ---
final Provider<ApiClient> apiClientProvider = Provider<ApiClient>((ref) {
  final client = ApiClient();
  client.onUnauthorized = () {
    ref.read(authProvider.notifier).signOut();
  };
  return client;
});

// --- Repository Provider ---
final Provider<SipsRepository> sipsRepositoryProvider = Provider<SipsRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ApiSipsRepository(apiClient);
});

// --- Auth State & Provider ---
class AuthState {
  final bool isAuthenticated;
  final bool isOnboardingCompleted;
  final String userEmail;
  final String userName;
  final String collegeName;
  final String userId;
  final bool isLoading;
  final String? errorMessage;

  const AuthState({
    this.isAuthenticated = false,
    this.isOnboardingCompleted = true,
    this.userEmail = '',
    this.userName = '',
    this.collegeName = '',
    this.userId = '',
    this.isLoading = false,
    this.errorMessage,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isOnboardingCompleted,
    String? userEmail,
    String? userName,
    String? collegeName,
    String? userId,
    bool? isLoading,
    String? errorMessage,
    bool clearError = false,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isOnboardingCompleted: isOnboardingCompleted ?? this.isOnboardingCompleted,
      userEmail: userEmail ?? this.userEmail,
      userName: userName ?? this.userName,
      collegeName: collegeName ?? this.collegeName,
      userId: userId ?? this.userId,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _apiClient;
  final Ref _ref;

  AuthNotifier(this._apiClient, this._ref) : super(const AuthState()) {
    checkInitialAuth();
  }

  Future<void> checkInitialAuth() async {
    final token = await _apiClient.getToken();
    if (token != null && token.isNotEmpty) {
      state = state.copyWith(isAuthenticated: true);
    }
  }

  Future<bool> signIn(String identifier, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final body = <String, dynamic>{
        'identifier': identifier.trim(),
        'password': password,
      };

      final response = await _apiClient.post('/api/auth/login', body: body);

      if (response is Map<String, dynamic>) {
        final token = response['token'] as String?;
        final role = response['role'] as String?;
        final studentName = response['studentName'] as String? ?? response['name'] as String? ?? '';
        final collegeName = response['collegeName'] as String? ?? '';
        final userId = response['userId'] as String? ?? '';

        if (token == null || token.isEmpty) {
          throw const ApiException(message: 'Authentication token missing from response');
        }

        // Enforce Student Role Validation
        if (role != 'STUDENT') {
          throw const ApiException(
            message: 'Access restricted: This portal is for students only. Please use the Admin Portal for placement administration.',
            statusCode: 403,
          );
        }

        await _apiClient.saveToken(token);

        state = state.copyWith(
          isAuthenticated: true,
          userEmail: identifier,
          userName: studentName,
          collegeName: collegeName,
          userId: userId,
          isLoading: false,
          clearError: true,
        );

        // Reload fresh live data
        _ref.read(studentProfileProvider.notifier).loadProfile();
        _ref.read(opportunitiesProvider.notifier).loadJobs();
        _ref.read(alertsProvider.notifier).loadAlerts();
        _ref.read(readinessProvider.notifier).loadReadiness();

        return true;
      }
      throw const ApiException(message: 'Invalid server response structure');
    } catch (e) {
      final errorMsg = e is ApiException ? e.message : 'Sign in failed: ${e.toString()}';
      state = state.copyWith(
        isLoading: false,
        errorMessage: errorMsg,
      );
      return false;
    }
  }

  void completeOnboarding() {
    state = state.copyWith(isOnboardingCompleted: true);
  }

  Future<void> signOut() async {
    await _apiClient.clearToken();
    state = const AuthState(
      isAuthenticated: false,
      isOnboardingCompleted: false,
      userEmail: '',
      userName: '',
      collegeName: '',
      userId: '',
    );
  }
}

final StateNotifierProvider<AuthNotifier, AuthState> authProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthNotifier(apiClient, ref);
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

  Future<String> uploadResume(List<int> bytes, String filename) async {
    final url = await _repository.uploadResume(bytes, filename);
    await loadProfile();
    return url;
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
    try {
      final data = await _repository.getReadinessMetric();
      state = AsyncValue.data(data);
    } catch (_) {}
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
    state.whenData((jobs) {
      state = AsyncValue.data(jobs.map((j) {
        if (j.id == jobId) {
          return j.copyWith(isBookmarked: !j.isBookmarked);
        }
        return j;
      }).toList());
    });
  }

  Future<void> apply(String jobId) async {
    await _repository.applyForJob(jobId);
    state.whenData((jobs) {
      state = AsyncValue.data(jobs.map((j) {
        if (j.id == jobId) {
          return j.copyWith(hasApplied: true);
        }
        return j;
      }).toList());
    });
  }
}

final opportunitiesProvider =
    StateNotifierProvider<OpportunitiesNotifier, AsyncValue<List<JobOpportunity>>>((ref) {
  final repo = ref.watch(sipsRepositoryProvider);
  return OpportunitiesNotifier(repo);
});

// --- Growth Tasks Provider (Local/Mock) ---
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

// --- Roadmap Provider (Local/Mock) ---
final roadmapProvider = FutureProvider<List<RoadmapMilestone>>((ref) async {
  final repo = ref.watch(sipsRepositoryProvider);
  return repo.getRoadmapMilestones();
});

// --- Mock Interview Runner Provider (Local/Mock) ---
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

// --- Interview Diagnostic Provider (Local/Mock) ---
final interviewDiagnosticProvider = FutureProvider<InterviewDiagnosticReport>((ref) async {
  final repo = ref.watch(sipsRepositoryProvider);
  return repo.getDiagnosticReport();
});

// --- Peer Matching Provider (Local/Mock) ---
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
    state.whenData((alerts) {
      state = AsyncValue.data(alerts.map((a) {
        if (a.id == alertId) {
          return a.copyWith(isRead: true);
        }
        return a;
      }).toList());
    });
  }
}

final alertsProvider = StateNotifierProvider<AlertsNotifier, AsyncValue<List<PlacementAlert>>>((ref) {
  final repo = ref.watch(sipsRepositoryProvider);
  return AlertsNotifier(repo);
});
