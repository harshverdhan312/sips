import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/sips_badge.dart';
import '../../core/widgets/sips_button.dart';
import '../../core/widgets/sips_card.dart';
import '../../core/widgets/skill_chip.dart';
import '../../providers/sips_providers.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(studentProfileProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(child: Text('Error: $err')),
        data: (profile) {
          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Profile Hero Card
                SipsCard(
                  hasGlow: true,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              color: AppColors.primaryFixed,
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.primary.withValues(alpha: 0.3), width: 2),
                            ),
                            child: const Center(
                              child: Text(
                                'AS',
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.onPrimaryFixed,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      profile.name,
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.onSurface,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    const Icon(Icons.verified_rounded, color: AppColors.primary, size: 18),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  profile.email,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 12,
                                    color: AppColors.outline,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                const SipsBadge(
                                  label: 'TIER-1 PLACEMENT CANDIDATE',
                                  variant: SipsBadgeVariant.primary,
                                  isSmall: true,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      // Academic Credentials Grid
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceContainerLow,
                          borderRadius: AppRadius.lgRadius,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildAcademicPill('CGPA', '${profile.cgpa}', const Color(0xFF047857)),
                            Container(width: 1, height: 26, color: AppColors.outlineVariant),
                            _buildAcademicPill('Backlogs', '${profile.backlogs}', AppColors.onSurface),
                            Container(width: 1, height: 26, color: AppColors.outlineVariant),
                            _buildAcademicPill('Graduation', '2026 Batch', AppColors.primary),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // College & Department Info
                SectionHeader(title: 'Institute Verification'),
                const SizedBox(height: 8),
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildInfoRow(Icons.school_outlined, 'College', profile.college),
                      const Divider(height: 16),
                      _buildInfoRow(Icons.account_tree_outlined, 'Branch', profile.branch),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Connected Telemetry Accounts
                SectionHeader(
                  title: 'Connected Telemetry Handles',
                  badge: const SipsBadge(label: 'SYNCED', variant: SipsBadgeVariant.emerald, isSmall: true),
                ),
                const SizedBox(height: 8),
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildInfoRow(
                        Icons.code_rounded,
                        'LeetCode Handle',
                        '${profile.leetcodeHandle} (${profile.leetcodeRating} Rating)',
                      ),
                      const Divider(height: 16),
                      _buildInfoRow(
                        Icons.terminal_rounded,
                        'GitHub Account',
                        '${profile.githubHandle} (${profile.githubCommits} Commits)',
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // ATS Resume Hub
                SectionHeader(title: 'Resume & Documents'),
                const SizedBox(height: 8),
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.primaryFixed,
                          borderRadius: AppRadius.mdRadius,
                        ),
                        child: const Icon(Icons.description_rounded, color: AppColors.primary, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Aarav_Sharma_Resume_2026.pdf',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.onSurface,
                              ),
                            ),
                            Text(
                              'ATS Score: ${profile.atsScore}/100 • ${profile.resumeVersion}',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 11,
                                color: const Color(0xFF047857),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Resume ATS audit refreshed!')),
                          );
                        },
                        tooltip: 'Re-audit ATS Score',
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Target Roles
                SectionHeader(title: 'Calibrated Target Roles'),
                const SizedBox(height: 8),
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: profile.targetRoles
                        .map((r) => SkillChip(label: r, status: SkillStatus.neutral))
                        .toList(),
                  ),
                ),

                const SizedBox(height: 24),

                // Sign Out
                SipsButton(
                  label: 'Sign Out of SIPS',
                  variant: SipsButtonVariant.outline,
                  isFullWidth: true,
                  size: SipsButtonSize.large,
                  onPressed: () {
                    ref.read(authProvider.notifier).signOut();
                    context.go('/welcome');
                  },
                ),
                const SizedBox(height: 16),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildAcademicPill(String label, String value, Color valueColor) {
    return Column(
      children: [
        Text(
          value,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: valueColor,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 10,
            color: AppColors.outline,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.outline),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 10,
                color: AppColors.outline,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              value,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.onSurface,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
