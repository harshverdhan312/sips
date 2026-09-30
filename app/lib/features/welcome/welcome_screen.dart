import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/widgets/sips_button.dart';
import '../../core/widgets/sips_card.dart';
import '../../providers/sips_providers.dart';

class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _completeOnboarding() async {
    try {
      await ref.read(apiClientProvider).setHasSeenOnboarding(true);
    } catch (_) {}
    if (mounted) {
      context.go('/auth');
    }
  }

  void _nextPage() {
    _pageController.nextPage(
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar with Logo and Skip Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Image.asset(
                    'assets/branding/sips-logo-full.png',
                    height: 38,
                    fit: BoxFit.contain,
                    semanticLabel: 'SIPS — Skill Intelligence Placement System',
                  ),
                  if (_currentPage == 0)
                    TextButton(
                      onPressed: _completeOnboarding,
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.onSurfaceVariant,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      ),
                      child: Text(
                        'Skip',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    )
                  else
                    const SizedBox(width: 48),
                ],
              ),
            ),

            // Page View with Two Onboarding Steps
            Expanded(
              child: PageView(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() => _currentPage = index);
                },
                children: [
                  _buildScreen1Welcome(),
                  _buildScreen2Features(),
                ],
              ),
            ),

            // Bottom Navigation Area
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Page Indicator (● ○ or ○ ●)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildPageDot(isActive: _currentPage == 0),
                      const SizedBox(width: 8),
                      _buildPageDot(isActive: _currentPage == 1),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Action Buttons
                  if (_currentPage == 0) ...[
                    SipsButton(
                      label: 'Get Started',
                      isFullWidth: true,
                      size: SipsButtonSize.large,
                      trailingIcon: Icons.arrow_forward_rounded,
                      onPressed: _nextPage,
                    ),
                  ] else ...[
                    SipsButton(
                      label: 'Sign In to Student Portal',
                      isFullWidth: true,
                      size: SipsButtonSize.large,
                      trailingIcon: Icons.arrow_forward_rounded,
                      onPressed: _completeOnboarding,
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: _completeOnboarding,
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.outline,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      child: Text(
                        'Skip for now',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- Screen 1: Welcome ---
  Widget _buildScreen1Welcome() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 16),
          // Illustration / Visual Showcase Card
          SipsCard(
            hasGlow: true,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
            child: Column(
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.school_rounded,
                      size: 38,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Your Placement Journey\nStarts Here',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppColors.onSurface,
                    letterSpacing: -0.5,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Build your skills, discover opportunities, and get placement-ready with SIPS.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    color: AppColors.onSurfaceVariant,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  // --- Screen 2: Value & Benefits ---
  Widget _buildScreen2Features() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          Center(
            child: Text(
              'Everything You Need\nfor Your Placement Journey',
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: AppColors.onSurface,
                letterSpacing: -0.4,
                height: 1.25,
              ),
            ),
          ),
          const SizedBox(height: 24),
          _buildBenefitItem(
            icon: Icons.person_outline_rounded,
            color: AppColors.primary,
            title: 'Build your career profile',
            description: 'Showcase your skills, projects, and achievements in one place.',
          ),
          const SizedBox(height: 14),
          _buildBenefitItem(
            icon: Icons.work_outline_rounded,
            color: AppColors.emerald,
            title: 'Discover relevant opportunities',
            description: 'Find matching campus drives with clear eligibility criteria.',
          ),
          const SizedBox(height: 14),
          _buildBenefitItem(
            icon: Icons.track_changes_rounded,
            color: AppColors.secondary,
            title: 'Identify your skill gaps',
            description: 'Get targeted recommendations on what to learn and improve.',
          ),
          const SizedBox(height: 14),
          _buildBenefitItem(
            icon: Icons.insights_rounded,
            color: const Color(0xFFD97706),
            title: 'Track your placement readiness',
            description: 'Monitor your preparation progress and stay ahead in drives.',
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildBenefitItem({
    required IconData icon,
    required Color color,
    required String title,
    required String description,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: AppRadius.mdRadius,
        border: Border.all(color: AppColors.outlineVariant, width: 0.8),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: AppRadius.smRadius,
            ),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.onSurface,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    color: AppColors.onSurfaceVariant,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPageDot({required bool isActive}) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 240),
      width: isActive ? 22 : 8,
      height: 8,
      decoration: BoxDecoration(
        color: isActive ? AppColors.primary : AppColors.outlineVariant,
        borderRadius: AppRadius.fullRadius,
      ),
    );
  }
}
