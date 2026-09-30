import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sips_app/core/network/api_client.dart';
import 'package:sips_app/features/opportunities/opportunities_screen.dart';
import 'package:sips_app/features/splash/splash_screen.dart';
import 'package:sips_app/features/welcome/welcome_screen.dart';
import 'package:sips_app/models/job_opportunity.dart';
import 'package:sips_app/providers/sips_providers.dart';
import 'package:sips_app/repositories/sips_repository.dart';

class MockTestSipsRepository implements SipsRepository {
  final List<JobOpportunity> testJobs;
  MockTestSipsRepository(this.testJobs);

  @override
  Future<List<JobOpportunity>> getJobOpportunities() async => testJobs;

  @override
  Future<JobOpportunity?> getJobDetail(String jobId) async =>
      testJobs.firstWhere((j) => j.id == jobId);

  @override
  Future<void> toggleJobBookmark(String jobId) async {}

  @override
  Future<void> applyForJob(String jobId) async {}

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class TestOpportunitiesNotifier extends OpportunitiesNotifier {
  TestOpportunitiesNotifier(List<JobOpportunity> jobs) : super(MockTestSipsRepository(jobs)) {
    state = AsyncValue.data(jobs);
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Part 1: Onboarding & First-Launch Persistence Tests', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    testWidgets('First launch: Welcome Screen 1 renders title, logo, and Get Started button',
        (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: WelcomeScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('Your Placement Journey'), findsOneWidget);
      expect(find.textContaining('Starts Here'), findsOneWidget);
      expect(find.text('Get Started'), findsOneWidget);
      expect(find.text('Skip'), findsOneWidget);
    });

    testWidgets('Advancing to Screen 2: displays 4 core value benefits and Sign In button',
        (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: WelcomeScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Get Started
      await tester.tap(find.text('Get Started'));
      await tester.pumpAndSettle();

      // Verify Screen 2 content
      expect(find.textContaining('Everything You Need'), findsOneWidget);
      expect(find.text('Build your career profile'), findsOneWidget);
      expect(find.text('Discover relevant opportunities'), findsOneWidget);
      expect(find.text('Identify your skill gaps'), findsOneWidget);
      expect(find.text('Track your placement readiness'), findsOneWidget);
      expect(find.text('Sign In to Student Portal'), findsOneWidget);
      expect(find.text('Skip for now'), findsOneWidget);
    });

    testWidgets('Completing onboarding sets hasSeenOnboarding = true in SharedPreferences',
        (tester) async {
      final apiClient = ApiClient();
      expect(await apiClient.hasSeenOnboarding(), false);

      await apiClient.setHasSeenOnboarding(true);
      expect(await apiClient.hasSeenOnboarding(), true);
    });

    testWidgets('Splash screen redirects returning user with hasSeenOnboarding to /auth',
        (tester) async {
      SharedPreferences.setMockInitialValues({
        ApiConfig.onboardingKey: true,
      });

      final router = GoRouter(
        initialLocation: '/splash',
        routes: [
          GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
          GoRoute(path: '/auth', builder: (context, state) => const Scaffold(body: Text('AuthScreenRoute'))),
          GoRoute(path: '/welcome', builder: (context, state) => const Scaffold(body: Text('WelcomeScreenRoute'))),
          GoRoute(path: '/home', builder: (context, state) => const Scaffold(body: Text('HomeScreenRoute'))),
        ],
      );

      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );

      // Advance timer for splash transition
      await tester.pump(const Duration(milliseconds: 1200));
      await tester.pumpAndSettle();

      expect(find.text('AuthScreenRoute'), findsOneWidget);
    });
  });

  group('Part 2: Job Card Responsive Layout & Overflow Prevention Tests', () {
    final testJobs = [
      // 1. Normal Job
      const JobOpportunity(
        id: 'job_1',
        company: 'Google',
        role: 'Software Development Engineer',
        location: 'Bangalore, India',
        type: 'Full-time',
        ctc: '₹32 - 40 LPA',
        matchScore: 92,
        deadlineText: 'Deadline: 2027-11-30',
        description: 'Design and build distributed systems.',
        matchedSkills: ['Go', 'Distributed Systems', 'Kubernetes'],
        missingSkills: ['gRPC'],
        isEligible: true,
        minCgpa: 8.0,
      ),
      // 2. Job with Long Title, Long Company, Multiple Ineligible Reasons, and Many Skills
      const JobOpportunity(
        id: 'job_2',
        company: 'International Business Systems & Autonomous Cloud Robotics Corporation',
        role: 'Lead Full-Stack Infrastructure & Distributed High-Throughput Pipeline Architect',
        location: 'Hyderabad / Remote Available Across Multiple Regions',
        type: 'Full-time Hybrid Role',
        ctc: '₹45 LPA Base + Stocks & Performance Bonus',
        matchScore: 68,
        deadlineText: 'Deadline: 2027-12-15 (Extended Application Window)',
        description: 'Lead next-gen cloud data pipeline architecture.',
        matchedSkills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'GraphQL'],
        missingSkills: ['Rust', 'Kafka', 'Terraform', 'WebAssembly', 'Redis'],
        isEligible: false,
        eligibilityReasons: [
          'Minimum CGPA required: 8.5, Your CGPA: 7.4',
          'Eligible Branches: CSE, ISE only',
          'Maximum active backlogs allowed: 0'
        ],
        minCgpa: 8.5,
      ),
      // 3. Applied Job
      const JobOpportunity(
        id: 'job_3',
        company: 'Microsoft',
        role: 'Cloud Solutions Engineer',
        location: 'Hyderabad',
        type: 'Full-time',
        ctc: '₹28 LPA',
        matchScore: 85,
        deadlineText: 'Deadline: 2027-10-15',
        description: 'Build Azure solutions.',
        matchedSkills: ['Azure', 'C#', 'SQL'],
        missingSkills: [],
        isEligible: true,
        hasApplied: true,
      ),
    ];

    Widget createTestApp(double width) {
      final mockRepo = MockTestSipsRepository(testJobs);
      return ProviderScope(
        overrides: [
          sipsRepositoryProvider.overrideWithValue(mockRepo),
          opportunitiesProvider.overrideWith((ref) => TestOpportunitiesNotifier(testJobs)),
        ],
        child: MaterialApp(
          home: MediaQuery(
            data: MediaQueryData(size: Size(width, 900)),
            child: const Scaffold(
              body: OpportunitiesScreen(),
            ),
          ),
        ),
      );
    }

    testWidgets('Renders without RenderFlex overflow at 320px width (Narrow Mobile)',
        (tester) async {
      tester.view.physicalSize = const Size(320, 900);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(createTestApp(320));
      await tester.pumpAndSettle();

      expect(find.textContaining('Google'), findsOneWidget);
      expect(find.text('92% Match'), findsOneWidget);
      expect(find.text('Applied'), findsWidgets);
      expect(tester.takeException(), isNull);
    });

    testWidgets('Renders without RenderFlex overflow at 360px width (Standard Mobile)',
        (tester) async {
      tester.view.physicalSize = const Size(360, 900);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(createTestApp(360));
      await tester.pumpAndSettle();

      expect(find.textContaining('Google'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('Renders without RenderFlex overflow at 390px width (iPhone / Modern Mobile)',
        (tester) async {
      tester.view.physicalSize = const Size(390, 900);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(createTestApp(390));
      await tester.pumpAndSettle();

      expect(find.textContaining('Google'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('Renders without RenderFlex overflow at 412px width (Large Android)',
        (tester) async {
      tester.view.physicalSize = const Size(412, 900);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(createTestApp(412));
      await tester.pumpAndSettle();

      expect(find.textContaining('Google'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('Ineligible job displays concise requirements summary instead of raw unbounded text',
        (tester) async {
      tester.view.physicalSize = const Size(360, 900);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(createTestApp(360));
      await tester.pumpAndSettle();

      // Job 2 has 3 eligibility reasons: should summarize as "3 requirements not met"
      expect(find.text('3 requirements not met'), findsOneWidget);
      expect(find.text('Not Eligible'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  });
}
