import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/alerts/alerts_screen.dart';
import '../../features/auth/auth_screen.dart';
import '../../features/growth/daily_growth_screen.dart';
import '../../features/growth/roadmap_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/interview/interview_diagnostic_screen.dart';
import '../../features/interview/mock_interview_screen.dart';
import '../../features/opportunities/job_detail_screen.dart';
import '../../features/opportunities/opportunities_screen.dart';
import '../../features/peers/peer_matching_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/shell/main_shell_screen.dart';
import '../../features/skills/skills_screen.dart';
import '../../features/splash/splash_screen.dart';
import '../../features/welcome/welcome_screen.dart';
import '../../providers/sips_providers.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();
final GlobalKey<NavigatorState> _shellNavigatorKey = GlobalKey<NavigatorState>();

class AppRouter {
  AppRouter._();

  static final GoRouter router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),
      GoRoute(
        path: '/auth',
        builder: (context, state) => const AuthScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        redirect: (context, state) {
          try {
            final container = ProviderScope.containerOf(context, listen: false);
            final auth = container.read(authProvider);
            return auth.isAuthenticated ? '/home' : '/auth';
          } catch (_) {
            return '/auth';
          }
        },
      ),

      // Main App Shell with Bottom Navigation
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => MainShellScreen(child: child),
        routes: [
          GoRoute(
            path: '/home',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/skills',
            builder: (context, state) => const SkillsScreen(),
          ),
          GoRoute(
            path: '/opportunities',
            builder: (context, state) => const OpportunitiesScreen(),
          ),
          GoRoute(
            path: '/growth',
            builder: (context, state) => const DailyGrowthScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),

      // Contextual Feature Sub-Routes
      GoRoute(
        path: '/job-detail/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? 'job_1';
          return JobDetailScreen(jobId: id);
        },
      ),
      GoRoute(
        path: '/roadmap',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const RoadmapScreen(),
      ),
      GoRoute(
        path: '/mock-interview',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const MockInterviewScreen(),
      ),
      GoRoute(
        path: '/interview-diagnostic',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const InterviewDiagnosticScreen(),
      ),
      GoRoute(
        path: '/peer-matching',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const PeerMatchingScreen(),
      ),
      GoRoute(
        path: '/alerts',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const AlertsScreen(),
      ),
    ],
  );
}
