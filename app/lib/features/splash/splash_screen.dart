import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../providers/sips_providers.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  bool _hasNavigated = false;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    if (_hasNavigated) return;

    // Concurrently run authentication check and minimum visual splash branding transition
    final results = await Future.wait([
      ref.read(authProvider.notifier).checkInitialAuth(),
      Future.delayed(const Duration(milliseconds: 1000)),
    ]);

    if (!mounted || _hasNavigated) return;
    _hasNavigated = true;

    final isAuthenticated = results[0] as bool;
    if (isAuthenticated) {
      context.go('/home');
    } else {
      context.go('/welcome');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Image.asset(
                  'assets/branding/sips-logo-full.png',
                  height: 64,
                  fit: BoxFit.contain,
                  semanticLabel: 'SIPS — Skill Intelligence Placement System',
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: 140,
                  child: ClipRRect(
                    borderRadius: AppRadius.fullRadius,
                    child: LinearProgressIndicator(
                      backgroundColor: AppColors.surfaceContainerLow,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                      minHeight: 3,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
