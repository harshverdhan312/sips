import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sips_app/core/network/api_client.dart';
import 'package:sips_app/providers/sips_providers.dart';
import 'package:sips_app/repositories/mock_sips_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Riverpod Providers Tests', () {
    late ProviderContainer container;
    late MockClient mockHttpClient;

    setUp(() {
      SharedPreferences.setMockInitialValues({});
      mockHttpClient = MockClient((request) async {
        if (request.url.path.contains('/api/auth/login')) {
          final body = jsonDecode(request.body);
          if (body['password'] == 'password123') {
            return http.Response(
              jsonEncode({
                'token': 'mock-jwt-token-xyz',
                'role': 'STUDENT',
                'studentName': 'Aarav Sharma',
                'collegeName': 'RVCE',
                'userId': 'std_101',
              }),
              200,
              headers: {'content-type': 'application/json'},
            );
          }
          return http.Response(
            jsonEncode({'message': 'Invalid credentials'}),
            401,
            headers: {'content-type': 'application/json'},
          );
        }
        return http.Response(jsonEncode({}), 200, headers: {'content-type': 'application/json'});
      });

      container = ProviderContainer(
        overrides: [
          apiClientProvider.overrideWithValue(ApiClient(client: mockHttpClient, baseUrl: 'http://localhost:5000')),
          sipsRepositoryProvider.overrideWithValue(MockSipsRepository()),
        ],
      );
    });

    tearDown(() {
      container.dispose();
    });

    test('authProvider initially is uninitialized and unauthenticated', () {
      final auth = container.read(authProvider);
      expect(auth.isInitialized, false);
      expect(auth.isAuthenticated, false);
    });

    test('checkInitialAuth with no stored token marks initialized and unauthenticated', () async {
      final authNotifier = container.read(authProvider.notifier);
      final restored = await authNotifier.checkInitialAuth();

      expect(restored, false);
      final auth = container.read(authProvider);
      expect(auth.isInitialized, true);
      expect(auth.isAuthenticated, false);
    });

    test('checkInitialAuth with stored token restores session successfully', () async {
      SharedPreferences.setMockInitialValues({
        ApiConfig.tokenKey: 'persisted-jwt-token-123',
      });

      final authNotifier = container.read(authProvider.notifier);
      final restored = await authNotifier.checkInitialAuth();

      expect(restored, true);
      final auth = container.read(authProvider);
      expect(auth.isInitialized, true);
      expect(auth.isAuthenticated, true);
    });

    test('authProvider signIn success transitions state and saves token', () async {
      final authNotifier = container.read(authProvider.notifier);

      final success = await authNotifier.signIn('aarav@rvce.edu', 'password123');
      expect(success, true);
      expect(container.read(authProvider).isInitialized, true);
      expect(container.read(authProvider).isAuthenticated, true);
      expect(container.read(authProvider).userName, 'Aarav Sharma');

      await authNotifier.signOut();
      expect(container.read(authProvider).isInitialized, true);
      expect(container.read(authProvider).isAuthenticated, false);
    });

    test('authProvider signIn failure sets error message and leaves unauthenticated', () async {
      final authNotifier = container.read(authProvider.notifier);

      final success = await authNotifier.signIn('aarav@rvce.edu', 'wrongpassword');
      expect(success, false);
      expect(container.read(authProvider).isAuthenticated, false);
      expect(container.read(authProvider).errorMessage, isNotNull);
    });

    test('authenticated providers stay idle when unauthenticated and populate when authenticated', () async {
      // Initially unauthenticated -> profileProvider stays in loading/idle without throwing error
      final initialProfile = container.read(studentProfileProvider);
      expect(initialProfile.isLoading, true);

      // Sign in -> authenticated
      final authNotifier = container.read(authProvider.notifier);
      await authNotifier.signIn('aarav@rvce.edu', 'password123');

      // Await load completion
      await container.read(studentProfileProvider.notifier).loadProfile();

      // Now studentProfileProvider contains populated data
      final profileAsync = container.read(studentProfileProvider);
      expect(profileAsync.hasValue, true);
      expect(profileAsync.value?.name, 'Aarav Sharma');
    });

    test('growthTasksProvider loads tasks and allows completion toggling', () async {
      final notifier = container.read(growthTasksProvider.notifier);
      await notifier.loadTasks();

      final tasksAsync = container.read(growthTasksProvider);
      expect(tasksAsync.hasValue, true);
      final tasks = tasksAsync.value!;
      expect(tasks.isNotEmpty, true);

      final firstTask = tasks.first;
      final initialStatus = firstTask.isCompleted;

      await notifier.toggleTask(firstTask.id);
      final updatedTasks = container.read(growthTasksProvider).value!;
      expect(updatedTasks.first.isCompleted, !initialStatus);
    });

    test('opportunitiesProvider allows bookmarking', () async {
      final notifier = container.read(opportunitiesProvider.notifier);
      await notifier.loadJobs();

      final jobsAsync = container.read(opportunitiesProvider);
      expect(jobsAsync.hasValue, true);

      final firstJob = jobsAsync.value!.first;
      final initialBookmark = firstJob.isBookmarked;

      await notifier.toggleBookmark(firstJob.id);
      final updatedJobs = container.read(opportunitiesProvider).value!;
      expect(updatedJobs.first.isBookmarked, !initialBookmark);
    });

    test('interviewSessionProvider moves forward on nextQuestion', () async {
      final sessionNotifier = container.read(interviewSessionProvider.notifier);
      await sessionNotifier.initSession();

      expect(container.read(interviewSessionProvider).currentQuestionIndex, 0);
      expect(container.read(interviewSessionProvider).questions.isNotEmpty, true);

      sessionNotifier.nextQuestion();
      expect(container.read(interviewSessionProvider).currentQuestionIndex, 1);
    });
  });
}
