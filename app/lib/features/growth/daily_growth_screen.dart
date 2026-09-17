import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../core/widgets/sips_badge.dart';
import '../../core/widgets/sips_button.dart';
import '../../core/widgets/sips_card.dart';

class DailyGrowthScreen extends ConsumerWidget {
  const DailyGrowthScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 20),
            // Header Hero Box
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppColors.primaryFixed,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.trending_up_rounded, size: 32, color: AppColors.primary),
            ),
            const SizedBox(height: 18),
            Text(
              "Growth Tracking",
              style: GoogleFonts.plusJakartaSans(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: AppColors.onSurface,
                letterSpacing: -0.4,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "Growth tracking isn't available yet.\n\nYour personalized growth tasks and daily preparation milestones will appear here once this feature is connected to the backend.",
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                color: AppColors.onSurfaceVariant,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 28),

            // Feature Roadmap Information Card
            SipsCard(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SipsBadge(
                    label: 'COMING SOON',
                    variant: SipsBadgeVariant.neutral,
                    isSmall: true,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'What will be included in Growth Tracking:',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.onSurface,
                    ),
                  ),
                  const SizedBox(height: 10),
                  _buildFeatureBullet(Icons.check_circle_outline, 'Dynamic daily coding & behavioral micro-tasks'),
                  const SizedBox(height: 8),
                  _buildFeatureBullet(Icons.check_circle_outline, 'Personalized topic recommendations for target companies'),
                  const SizedBox(height: 8),
                  _buildFeatureBullet(Icons.check_circle_outline, 'Continuous score calibration and streak momentum'),
                ],
              ),
            ),

            const SizedBox(height: 24),

            SipsButton(
              label: 'View Placement Sprint Roadmap',
              variant: SipsButtonVariant.outline,
              trailingIcon: Icons.route_outlined,
              isFullWidth: true,
              onPressed: () => context.push('/roadmap'),
            ),
            const SizedBox(height: 12),
            SipsButton(
              label: 'Explore Active Placement Drives',
              trailingIcon: Icons.work_outline_rounded,
              isFullWidth: true,
              onPressed: () => context.go('/opportunities'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureBullet(IconData icon, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.primary),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              color: AppColors.onSurfaceVariant,
              height: 1.35,
            ),
          ),
        ),
      ],
    );
  }
}
