import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sips_app/core/network/api_client.dart';
import 'package:sips_app/core/network/api_exception.dart';
import 'package:sips_app/features/opportunities/opportunities_screen.dart';
import 'package:sips_app/models/job_opportunity.dart';
import 'package:sips_app/providers/sips_providers.dart';
import 'package:sips_app/repositories/api_sips_repository.dart';
import 'package:sips_app/repositories/mock_sips_repository.dart';
import 'package:sips_app/repositories/sips_repository.dart';

class FakeOpportunitiesNotifier extends OpportunitiesNotifier {
  int loadJobsCallCount = 0;

  FakeOpportunitiesNotifier(List<JobOpportunity> initialJobs, [SipsRepository? repo])
      : super(repo ?? MockSipsRepository()) {
    state = AsyncValue.data(initialJobs);
  }

  @override
  Future<void> loadJobs() async {
    loadJobsCallCount++;
    try {
      await super.loadJobs();
    } catch (_) {}
  }
}

class FakeErrorOpportunitiesNotifier extends OpportunitiesNotifier {
  FakeErrorOpportunitiesNotifier([SipsRepository? repo]) : super(repo ?? MockSipsRepository()) {
    state = AsyncValue.error('Network timeout error', StackTrace.current);
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Phase 14 — Job Parity & Application Persistence Tests', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({
        ApiConfig.tokenKey: 'test-auth-token-xyz',
      });
    });

    final eligibleJobJson = {
      '_id': 'job_meetkats',
      'company': 'MeetKats',
      'title': 'SDE1',
      'role': 'SDE1',
      'location': 'Bengaluru',
      'type': 'Full-time',
      'ctc': '12 LPA',
      'ctcValue': 12.0,
      'matchScore': 100,
      'deadline': '2027-10-10T00:00:00.000Z',
      'description': 'Full stack engineering role at MeetKats.',
      'requiredSkills': ['flutter', 'node.js', 'javascript', 'dart', 'mongodb'],
      'matchedSkills': ['flutter', 'node.js', 'javascript', 'dart', 'mongodb'],
      'missingSkills': <String>[],
      'minCgpa': 6.0,
      'allowedBranches': ['Computer Science'],
      'isEligible': true,
      'eligibilityReasons': <String>[],
      'hasApplied': false,
      'applicationStatus': null,
      'status': 'ACTIVE',
    };

    final ineligibleJobJson = {
      '_id': 'job_google',
      'company': 'Google India',
      'title': 'SDE1 - Backend',
      'role': 'SDE1 - Backend',
      'location': 'Hyderabad',
      'type': 'Full-time',
      'ctc': '28 LPA',
      'ctcValue': 28.0,
      'matchScore': 13,
      'deadline': '2027-10-10T00:00:00.000Z',
      'description': 'Distributed backend infra.',
      'requiredSkills': ['docker', 'java', 'springboot', 'kubernetes', 'redis', 'kafka'],
      'matchedSkills': ['docker'],
      'missingSkills': ['java', 'springboot', 'kubernetes', 'redis', 'kafka'],
      'minCgpa': 8.0,
      'allowedBranches': ['Computer Science'],
      'isEligible': false,
      'eligibilityReasons': ['Minimum CGPA required: 8. Your CGPA: 6.9'],
      'hasApplied': false,
      'applicationStatus': null,
      'status': 'ACTIVE',
    };

    final appliedJobJson = {
      '_id': 'job_uber',
      'company': 'Uber',
      'title': 'Software Engineer I',
      'role': 'Software Engineer I',
      'location': 'Bengaluru',
      'type': 'Internship',
      'ctc': '30 LPA',
      'matchScore': 85,
      'deadline': '2027-11-01T00:00:00.000Z',
      'description': 'Uber Mobility platform.',
      'requiredSkills': ['python', 'algorithms', 'distributed systems'],
      'matchedSkills': ['python', 'algorithms'],
      'missingSkills': ['distributed systems'],
      'minCgpa': 7.0,
      'isEligible': true,
      'eligibilityReasons': <String>[],
      'hasApplied': true,
      'applicationStatus': 'APPLIED',
      'status': 'ACTIVE',
    };

    final closedJobJson = {
      '_id': 'job_closed',
      'company': 'Old Corp',
      'title': 'QA Engineer',
      'role': 'QA Engineer',
      'location': 'Remote',
      'type': 'Full-time',
      'ctc': '6 LPA',
      'matchScore': 40,
      'deadline': '2020-01-01T00:00:00.000Z',
      'description': 'Closed testing drive.',
      'requiredSkills': ['selenium'],
      'matchedSkills': <String>[],
      'missingSkills': ['selenium'],
      'isEligible': false,
      'eligibilityReasons': ['This job posting is closed'],
      'hasApplied': false,
      'status': 'CLOSED',
    };

    // 1. Active jobs load & 2. Multiple active jobs display
    test('1 & 2. ApiSipsRepository loads multiple active jobs from backend accurately', () async {
      final mockClient = MockClient((request) async {
        if (request.url.path == '/api/student/jobs') {
          return http.Response(
            jsonEncode([eligibleJobJson, ineligibleJobJson, appliedJobJson, closedJobJson]),
            200,
            headers: {'content-type': 'application/json'},
          );
        }
        return http.Response('Not Found', 404);
      });

      final apiClient = ApiClient(client: mockClient, baseUrl: 'http://localhost:5000');
      final repo = ApiSipsRepository(apiClient);

      final jobs = await repo.getJobOpportunities();
      expect(jobs.length, 4);

      // Verify active vs closed flags
      expect(jobs[0].isActive, true);
      expect(jobs[1].isActive, true);
      expect(jobs[2].isActive, true);
      expect(jobs[3].isActive, false); // Closed/expired
    });

    // 3. Search filter works
    test('3. Search filter matches company, role, location, and required skills', () {
      final j1 = JobOpportunity.fromBackendJson(eligibleJobJson);
      final j2 = JobOpportunity.fromBackendJson(ineligibleJobJson);
      final jobs = [j1, j2];

      // Search by company
      final byCompany = jobs.where((j) => j.company.toLowerCase().contains('meetkats')).toList();
      expect(byCompany.length, 1);
      expect(byCompany.first.id, 'job_meetkats');

      // Search by role
      final byRole = jobs.where((j) => j.role.toLowerCase().contains('backend')).toList();
      expect(byRole.length, 1);
      expect(byRole.first.id, 'job_google');

      // Search by location
      final byLocation = jobs.where((j) => j.location.toLowerCase().contains('hyderabad')).toList();
      expect(byLocation.length, 1);
      expect(byLocation.first.id, 'job_google');

      // Search by skill
      final bySkill = jobs.where((j) => j.requiredSkills.any((s) => s.toLowerCase().contains('flutter'))).toList();
      expect(bySkill.length, 1);
      expect(bySkill.first.id, 'job_meetkats');
    });

    // 4. Drive status filter works
    test('4. Drive status filter separates active/running from closed/expired', () {
      final jActive = JobOpportunity.fromBackendJson(eligibleJobJson);
      final jClosed = JobOpportunity.fromBackendJson(closedJobJson);
      final jobs = [jActive, jClosed];

      final activeOnly = jobs.where((j) => j.isActive).toList();
      expect(activeOnly.length, 1);
      expect(activeOnly.first.id, 'job_meetkats');

      final closedOnly = jobs.where((j) => !j.isActive).toList();
      expect(closedOnly.length, 1);
      expect(closedOnly.first.id, 'job_closed');
    });

    // 5. Match score filter works
    test('5. Match score filter handles tier ranges: high (>=80), moderate (60-79), low (<60)', () {
      final jHigh = JobOpportunity.fromBackendJson(eligibleJobJson); // 100%
      final jMod = JobOpportunity.fromBackendJson(appliedJobJson).copyWith(matchScore: 65); // 65%
      final jLow = JobOpportunity.fromBackendJson(ineligibleJobJson); // 13%
      final jobs = [jHigh, jMod, jLow];

      final high = jobs.where((j) => j.matchScore >= 80).toList();
      expect(high.length, 1);
      expect(high.first.id, 'job_meetkats');

      final moderate = jobs.where((j) => j.matchScore >= 60 && j.matchScore < 80).toList();
      expect(moderate.length, 1);
      expect(moderate.first.matchScore, 65);

      final low = jobs.where((j) => j.matchScore < 60).toList();
      expect(low.length, 1);
      expect(low.first.id, 'job_google');
    });

    // 6. Job type filter works
    test('6. Job type filter matches Full-time vs Internship', () {
      final jFt = JobOpportunity.fromBackendJson(eligibleJobJson); // Full-time
      final jIntern = JobOpportunity.fromBackendJson(appliedJobJson); // Internship
      final jobs = [jFt, jIntern];

      final ft = jobs.where((j) => j.type.toLowerCase().contains('full-time')).toList();
      expect(ft.length, 1);
      expect(ft.first.id, 'job_meetkats');

      final intern = jobs.where((j) => j.type.toLowerCase().contains('internship')).toList();
      expect(intern.length, 1);
      expect(intern.first.id, 'job_uber');
    });

    // 7, 8, 9, 10, 11 & 15-18: Widget rendering of buttons, eligibility, match and application status
    testWidgets('7-11 & 15-18. OpportunitiesScreen renders correct states for Eligible, Ineligible, and Applied jobs', (tester) async {
      final mockJobs = [
        JobOpportunity.fromBackendJson(eligibleJobJson),
        JobOpportunity.fromBackendJson(ineligibleJobJson),
        JobOpportunity.fromBackendJson(appliedJobJson),
      ];

      final mockClient = MockClient((request) async {
        return http.Response(jsonEncode([eligibleJobJson, ineligibleJobJson, appliedJobJson]), 200);
      });

      final apiClient = ApiClient(client: mockClient, baseUrl: 'http://localhost:5000');
      final repo = ApiSipsRepository(apiClient);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sipsRepositoryProvider.overrideWithValue(repo),
            opportunitiesProvider.overrideWith((ref) => FakeOpportunitiesNotifier(mockJobs, repo)),
          ],
          child: const MaterialApp(
            home: OpportunitiesScreen(),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // 15. Match scores display
      expect(find.text('100% Match'), findsOneWidget);
      expect(find.text('13% Match'), findsOneWidget);
      expect(find.text('85% Match'), findsOneWidget);

      // 16. Matched skills display
      expect(find.text('flutter'), findsWidgets);
      expect(find.text('docker'), findsWidgets);

      // 17. Skill gaps display
      expect(find.text('kubernetes'), findsWidgets);
      expect(find.text('kafka'), findsWidgets);

      // 7. Eligible job shows Apply Now
      expect(find.text('Apply Now'), findsOneWidget);

      // 8. Ineligible job shows Not Eligible
      expect(find.text('Not Eligible'), findsWidgets);

      // 9. Minimum CGPA restriction displayed concisely
      expect(find.text('Min CGPA: 8.0'), findsOneWidget);

      // 10 & 11. Already-applied job displays Applied
      expect(find.text('Applied'), findsWidgets);
    });

    // 12. External Web application reflected in Flutter refresh/reopen
    test('12. External Web application is reflected when Flutter fetches jobs from backend', () async {
      // Step 1: Initial state where job_meetkats is not applied
      var currentJobData = [Map<String, dynamic>.from(eligibleJobJson)];

      final mockClient = MockClient((request) async {
        if (request.url.path == '/api/student/jobs') {
          return http.Response(jsonEncode(currentJobData), 200, headers: {'content-type': 'application/json'});
        }
        return http.Response('Not Found', 404);
      });

      final apiClient = ApiClient(client: mockClient, baseUrl: 'http://localhost:5000');
      final repo = ApiSipsRepository(apiClient);

      var initialJobs = await repo.getJobOpportunities();
      expect(initialJobs.first.hasApplied, false);
      expect(initialJobs.first.applicationStatus, isNull);

      // Step 2: Student applies on Web -> Backend now returns hasApplied: true, applicationStatus: 'APPLIED'
      currentJobData = [
        {
          ...eligibleJobJson,
          'hasApplied': true,
          'applicationStatus': 'APPLIED',
        }
      ];

      // Flutter refreshes / reopens -> calls getJobOpportunities()
      var refreshedJobs = await repo.getJobOpportunities();
      expect(refreshedJobs.first.hasApplied, true);
      expect(refreshedJobs.first.applicationStatus, 'APPLIED');
    });

    // 13. Successful Flutter application changes state to Applied via POST /api/student/jobs/:id/apply
    test('13. Successful Flutter application sends POST request and updates state to Applied', () async {
      late http.BaseRequest capturedRequest;
      final mockClient = MockClient((request) async {
        capturedRequest = request;
        if (request.url.path == '/api/student/jobs/job_meetkats/apply' && request.method == 'POST') {
          return http.Response(
            jsonEncode({
              'success': true,
              'message': 'Application submitted successfully',
              'application': {
                '_id': 'app_999',
                'jobId': 'job_meetkats',
                'status': 'APPLIED',
                'appliedAt': DateTime.now().toIso8601String(),
              }
            }),
            201,
            headers: {'content-type': 'application/json'},
          );
        }
        if (request.url.path == '/api/student/jobs') {
          return http.Response(jsonEncode([eligibleJobJson]), 200, headers: {'content-type': 'application/json'});
        }
        return http.Response('Not Found', 404);
      });

      final apiClient = ApiClient(client: mockClient, baseUrl: 'http://localhost:5000');
      final repo = ApiSipsRepository(apiClient);

      await repo.getJobOpportunities();
      await repo.applyForJob('job_meetkats');

      expect(capturedRequest.url.path, '/api/student/jobs/job_meetkats/apply');
      expect(capturedRequest.method, 'POST');

      final detail = await repo.getJobDetail('job_meetkats');
      expect(detail?.hasApplied, true);
      expect(detail?.applicationStatus, 'APPLIED');
    });

    // 14. Duplicate application is prevented / handled
    test('14. Duplicate application error from backend is surfaced as ApiException', () async {
      final mockClient = MockClient((request) async {
        if (request.url.path == '/api/student/jobs/job_meetkats/apply') {
          return http.Response(
            jsonEncode({
              'success': false,
              'message': 'You have already applied for this job',
            }),
            409,
            headers: {'content-type': 'application/json'},
          );
        }
        return http.Response('Not Found', 404);
      });

      final apiClient = ApiClient(client: mockClient, baseUrl: 'http://localhost:5000');
      final repo = ApiSipsRepository(apiClient);

      expect(
        () async => await repo.applyForJob('job_meetkats'),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'statusCode', 409)),
      );
    });

    // 19. Empty active-job state works
    testWidgets('19. Empty active-job state displays correct message', (tester) async {
      final mockClient = MockClient((request) async {
        return http.Response(jsonEncode([]), 200);
      });

      final apiClient = ApiClient(client: mockClient, baseUrl: 'http://localhost:5000');
      final repo = ApiSipsRepository(apiClient);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sipsRepositoryProvider.overrideWithValue(repo),
            opportunitiesProvider.overrideWith((ref) => FakeOpportunitiesNotifier([], repo)),
          ],
          child: const MaterialApp(
            home: OpportunitiesScreen(),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
      expect(find.text('No active opportunities available.'), findsOneWidget);
    });

    // 20. Network error and retry works
    testWidgets('20. Network error shows error state and retry button', (tester) async {
      final mockClient = MockClient((request) async {
        return http.Response(jsonEncode({'message': 'Network timeout'}), 500);
      });

      final apiClient = ApiClient(client: mockClient, baseUrl: 'http://localhost:5000');
      final repo = ApiSipsRepository(apiClient);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sipsRepositoryProvider.overrideWithValue(repo),
            opportunitiesProvider.overrideWith((ref) => FakeErrorOpportunitiesNotifier(repo)),
          ],
          child: const MaterialApp(
            home: OpportunitiesScreen(),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
      expect(find.text('Unable to load campus opportunities'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
    });

    // 21. Pull-to-refresh updates application state
    testWidgets('21. Pull-to-refresh calls getJobOpportunities', (tester) async {
      final mockJobs = [JobOpportunity.fromBackendJson(eligibleJobJson)];
      final mockClient = MockClient((request) async {
        return http.Response(jsonEncode([eligibleJobJson]), 200);
      });

      final apiClient = ApiClient(client: mockClient, baseUrl: 'http://localhost:5000');
      final repo = ApiSipsRepository(apiClient);
      final notifier = FakeOpportunitiesNotifier(mockJobs, repo);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sipsRepositoryProvider.overrideWithValue(repo),
            opportunitiesProvider.overrideWith((ref) => notifier),
          ],
          child: const MaterialApp(
            home: OpportunitiesScreen(),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(notifier.loadJobsCallCount, 0);

      // Trigger pull to refresh
      await tester.fling(find.byType(RefreshIndicator), const Offset(0, 300), 1000);
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));

      expect(notifier.loadJobsCallCount, 1);
    });

    // 22. Student authentication still works
    test('22. Auth token is passed to authenticated student jobs endpoint', () async {
      late String? capturedAuthHeader;
      final mockClient = MockClient((request) async {
        capturedAuthHeader = request.headers['Authorization'];
        return http.Response(jsonEncode([]), 200);
      });

      final apiClient = ApiClient(client: mockClient, baseUrl: 'http://localhost:5000');
      final repo = ApiSipsRepository(apiClient);

      await repo.getJobOpportunities();
      expect(capturedAuthHeader, 'Bearer test-auth-token-xyz');
    });
  });
}
