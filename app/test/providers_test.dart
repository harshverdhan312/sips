import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sips_app/providers/sips_providers.dart';

void main() {
  group('Riverpod Providers Tests', () {
    late ProviderContainer container;

    setUp(() {
      container = ProviderContainer();
    });

    tearDown(() {
      container.dispose();
    });

    test('authProvider initially is authenticated for demo exploration', () {
      final auth = container.read(authProvider);
      expect(auth.isAuthenticated, true);
      expect(auth.userEmail, 'aarav.sharma@nit.ac.in');
    });

    test('authProvider signOut and signIn transition works', () async {
      final authNotifier = container.read(authProvider.notifier);
      authNotifier.signOut();

      expect(container.read(authProvider).isAuthenticated, false);

      await authNotifier.signIn('newstudent@nit.ac.in', 'password');
      expect(container.read(authProvider).isAuthenticated, true);
      expect(container.read(authProvider).userEmail, 'newstudent@nit.ac.in');
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
