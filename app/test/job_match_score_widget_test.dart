import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sips_app/features/opportunities/job_detail_screen.dart';
import 'package:sips_app/models/job_match_analysis.dart';
import 'package:sips_app/models/job_opportunity.dart';
import 'package:sips_app/providers/sips_providers.dart';
import 'package:sips_app/repositories/mock_sips_repository.dart';

class FakeOpportunitiesNotifier extends OpportunitiesNotifier {
  FakeOpportunitiesNotifier(List<JobOpportunity> initialJobs) : super(MockSipsRepository()) {
    state = AsyncValue.data(initialJobs);
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('JobDetailScreen renders 13% for hybridMatchScore=13.0 instead of 1300%', (tester) async {
    const testJobId = 'job-101';
    const mockJob = JobOpportunity(
      id: testJobId,
      company: 'Meetkats Inc',
      role: 'Software Developer',
      location: 'Remote',
      ctc: '₹12 LPA',
      type: 'Full-time',
      deadlineText: 'In 5 days',
      matchScore: 13,
      matchedSkills: ['python'],
      missingSkills: ['react', 'sql'],
      requiredSkills: ['python', 'react', 'sql'],
      description: 'Test job description',
    );

    final mockAnalysis = JobMatchAnalysis(
      jobId: testJobId,
      jobTitle: 'Software Developer',
      company: 'Meetkats Inc',
      mlStatus: 'completed',
      matchedSkills: const ['python'],
      missingSkills: const ['react', 'sql'],
      skillCoverageScore: 13.0,
      semanticSimilarity: 0.13,
      semanticScore: 13.0,
      hybridMatchScore: 13.0,
      skillWeight: 0.6,
      semanticWeight: 0.4,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          opportunitiesProvider.overrideWith((ref) => FakeOpportunitiesNotifier([mockJob])),
          jobMatchAnalysisProvider(testJobId).overrideWith((ref) => Future.value(mockAnalysis)),
        ],
        child: const MaterialApp(
          home: JobDetailScreen(jobId: testJobId),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Verify 13% is rendered and 1300% is NOT rendered
    expect(find.text('13%'), findsWidgets);
    expect(find.text('1300%'), findsNothing);
    expect(find.text('1300'), findsNothing);
  });

  testWidgets('JobDetailScreen renders 75% for hybridMatchScore=75.2 instead of 7520%', (tester) async {
    const testJobId = 'job-102';
    const mockJob = JobOpportunity(
      id: testJobId,
      company: 'Google',
      role: 'Backend Developer',
      location: 'Bangalore',
      ctc: '₹24 LPA',
      type: 'Full-time',
      deadlineText: 'In 3 days',
      matchScore: 75,
      matchedSkills: ['python', 'sql'],
      missingSkills: ['docker'],
      requiredSkills: ['python', 'sql', 'docker'],
      description: 'Backend role',
    );

    final mockAnalysis = JobMatchAnalysis(
      jobId: testJobId,
      jobTitle: 'Backend Developer',
      company: 'Google',
      mlStatus: 'completed',
      matchedSkills: const ['python', 'sql'],
      missingSkills: const ['docker'],
      skillCoverageScore: 75.0,
      semanticSimilarity: 0.75,
      semanticScore: 75.0,
      hybridMatchScore: 75.2,
      skillWeight: 0.6,
      semanticWeight: 0.4,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          opportunitiesProvider.overrideWith((ref) => FakeOpportunitiesNotifier([mockJob])),
          jobMatchAnalysisProvider(testJobId).overrideWith((ref) => Future.value(mockAnalysis)),
        ],
        child: const MaterialApp(
          home: JobDetailScreen(jobId: testJobId),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Verify 75% is rendered and 7520% is NOT rendered
    expect(find.text('75%'), findsWidgets);
    expect(find.text('7520%'), findsNothing);
    expect(find.text('7500%'), findsNothing);
  });
}
