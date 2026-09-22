import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/widgets/sips_badge.dart';
import '../../core/widgets/sips_button.dart';
import '../../core/widgets/sips_card.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 12),
              // Top Brand Header
              Image.asset(
                'assets/branding/sips-logo-full.png',
                height: 52,
                fit: BoxFit.contain,
                semanticLabel: 'SIPS — Skill Intelligence Placement System',
              ),

              const SizedBox(height: 28),

              // Hero Telemetry Showcase Card
              SipsCard(
                hasGlow: true,
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    const SipsBadge(
                      label: 'CAMPUS PLACEMENT INTELLIGENCE',
                      variant: SipsBadgeVariant.primary,
                      isSmall: true,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Unlock Your True\nPlacement Potential',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: AppColors.onSurface,
                        letterSpacing: -0.6,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Continuous readiness benchmarking, precise skill gap diagnostics, and targeted company matches designed for tier-1 success.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        color: AppColors.onSurfaceVariant,
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Visual Feature Highlights Pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceContainerLow,
                        borderRadius: AppRadius.lgRadius,
                        border: Border.all(color: AppColors.outlineVariant, width: 1),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildStatItem('Real-Time', 'Readiness Index', AppColors.primary),
                          Container(width: 1, height: 28, color: AppColors.outlineVariant),
                          _buildStatItem('Verified', 'Drive Alerts', AppColors.secondary),
                          Container(width: 1, height: 28, color: AppColors.outlineVariant),
                          _buildStatItem('Live', 'Skill Benchmarking', AppColors.emerald),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Core Pillars
              _buildFeatureRow(
                icon: Icons.radar_rounded,
                iconColor: AppColors.primary,
                title: 'Live Skill Telemetry',
                description: 'Sync your coding platforms and get automated ATS & code audit scores.',
              ),
              const SizedBox(height: 14),
              _buildFeatureRow(
                icon: Icons.troubleshoot_rounded,
                iconColor: AppColors.amber,
                title: 'High-Impact Skill Gap Bridge',
                description: 'Pinpoint exactly which modules to study to unlock tier-1 shortlist privilege.',
              ),
              const SizedBox(height: 14),
              _buildFeatureRow(
                icon: Icons.video_camera_front_rounded,
                iconColor: AppColors.emerald,
                title: 'Simulated Technical Mock Panels',
                description: 'Practice real questions with instant soft-skill and STAR feedback.',
              ),

              const SizedBox(height: 32),

              // Actions
              SipsButton(
                label: 'Sign In to Student Portal',
                isFullWidth: true,
                size: SipsButtonSize.large,
                trailingIcon: Icons.arrow_forward_rounded,
                onPressed: () => context.go('/auth'),
              ),

              const SizedBox(height: 24),
              Text(
                'Student accounts are provisioned by your college placement cell.\nSign in with your institute email or roll number.',
                textAlign: TextAlign.center,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  color: AppColors.outline,
                  fontWeight: FontWeight.w500,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(String value, String label, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: AppColors.outline,
          ),
        ),
      ],
    );
  }

  Widget _buildFeatureRow({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String description,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.12),
            borderRadius: AppRadius.mdRadius,
          ),
          child: Icon(icon, color: iconColor, size: 20),
        ),
        const SizedBox(width: 14),
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
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
