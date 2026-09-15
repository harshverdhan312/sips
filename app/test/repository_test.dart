import 'package:flutter_test/flutter_test.dart';
import 'package:sips_app/repositories/mock_sips_repository.dart';

void main() {
  group('MockSipsRepository Tests', () {
    late MockSipsRepository repository;

    setUp(() {
      repository = MockSipsRepository();
    });

    test('getStudentProfile returns default candidate profile', () async {
      final profile = await repository.getStudentProfile();
      expect(profile.name, 'Aarav Sharma');
      expect(profile.college, contains('National Institute of Technology'));
      expect(profile.cgpa, 8.82);
    });

    test('getReadinessMetric returns valid telemetry baseline', () async {
      final readiness = await repository.getReadinessMetric();
      expect(readiness.overallScore, 78);
      expect(readiness.domainScores.isNotEmpty, true);
    });

    test('toggleTaskCompletion updates task state and readiness score', () async {
      final initialReadiness = await repository.getReadinessMetric();
      final initialScore = initialReadiness.overallScore;

      final updatedTask = await repository.toggleTaskCompletion('tsk_1');
      expect(updatedTask.isCompleted, true);

      final newReadiness = await repository.getReadinessMetric();
      expect(newReadiness.overallScore, greaterThan(initialScore));
    });

    test('getJobOpportunities returns curated placements', () async {
      final jobs = await repository.getJobOpportunities();
      expect(jobs.isNotEmpty, true);
      expect(jobs.any((j) => j.company == 'Atlassian'), true);
      expect(jobs.any((j) => j.company == 'Google'), true);
    });

    test('applyForJob marks application as completed', () async {
      await repository.applyForJob('job_1');
      final job = await repository.getJobDetail('job_1');
      expect(job?.hasApplied, true);
    });
  });
}
