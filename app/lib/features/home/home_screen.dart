import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/widgets/readiness_gauge.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/sips_badge.dart';
import '../../core/widgets/sips_button.dart';
import '../../core/widgets/sips_card.dart';
import '../../providers/sips_providers.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final readinessAsync = ref.watch(readinessProvider);
    final profileAsync = ref.watch(studentProfileProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: readinessAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(child: Text('Error loading readiness: $err')),
        data: (readiness) {
          final profile = profileAsync.value;

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Hero Placement Readiness Scorecard
                SipsCard(
                  hasGlow: true,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      // Top Meta Badges
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          SipsBadge(
                            label: profile?.tier ?? 'Tier-1 Contender',
                            icon: Icons.verified_user_rounded,
                            variant: SipsBadgeVariant.neutral,
                          ),
                          SipsBadge(
                            label: readiness.scoreGainText,
                            icon: Icons.trending_up_rounded,
                            variant: SipsBadgeVariant.emerald,
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      // Animated Circular Arc Gauge
                      ReadinessGauge(
                        score: readiness.overallScore.toDouble(),
                        size: 160,
                        subtitle: 'Readiness Index',
                      ),
                      const SizedBox(height: 12),
                      Text(
                        readiness.percentileText,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        readiness.profileSummary,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          color: AppColors.onSurfaceVariant,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Pillar Breakdown Chips
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceContainerLow,
                          borderRadius: AppRadius.lgRadius,
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: _buildPillarItem(
                                'Tech Depth',
                                '${readiness.techDepthScore}%',
                                AppColors.primary,
                              ),
                            ),
                            Container(width: 1, height: 26, color: AppColors.outlineVariant),
                            Expanded(
                              child: _buildPillarItem(
                                'STAR Behavior',
                                '${readiness.starBehaviorScore}%',
                                AppColors.secondary,
                              ),
                            ),
                            Container(width: 1, height: 26, color: AppColors.outlineVariant),
                            Expanded(
                              child: _buildPillarItem(
                                'System Arch',
                                '${readiness.systemArchScore}%',
                                const Color(0xFF006E4C),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Placement Cell Urgent Announcement Banner
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerHigh,
                    borderRadius: AppRadius.xlRadius,
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.2), width: 1),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: AppRadius.mdRadius,
                        ),
                        child: const Icon(Icons.campaign_rounded, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'CAMPUS BULLETIN • PLACEMENT CELL',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primary,
                                    letterSpacing: 0.4,
                                  ),
                                ),
                                Text(
                                  'Just now',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 10,
                                    color: AppColors.outline,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Google Autumn Drive Finalized',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: AppColors.onSurface,
                              ),
                            ),
                            const SizedBox(height: 3),
                            RichText(
                              text: TextSpan(
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  color: AppColors.onSurfaceVariant,
                                  height: 1.35,
                                ),
                                children: const [
                                  TextSpan(
                                    text: 'Eligibility benchmark locked at ',
                                  ),
                                  TextSpan(
                                    text: '80+ Readiness Score',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                  TextSpan(
                                    text: '. You are currently 2 points away from direct shortlist privilege.',
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Candidate Telemetry Row
                SectionHeader(
                  title: 'Candidate Telemetry',
                  badge: const SipsBadge(label: 'SYNC: LIVE', variant: SipsBadgeVariant.neutral, isSmall: true),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    // LeetCode Card
                    Expanded(
                      child: SipsCard(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Icon(Icons.terminal_rounded, size: 18, color: AppColors.secondary),
                                Text(
                                  '3 Synced',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF006E4C),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${profile?.leetcodeRating ?? 1842}',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                                color: AppColors.onSurface,
                              ),
                            ),
                            Text(
                              'LeetCode Rating',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 10,
                                color: AppColors.outline,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Container(
                                  width: 4,
                                  height: 4,
                                  decoration: const BoxDecoration(
                                    color: AppColors.emerald,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${profile?.githubCommits ?? 320} commits',
                                  style: const TextStyle(fontSize: 10, color: AppColors.onSurfaceVariant),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // ATS Resume Card
                    Expanded(
                      child: SipsCard(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Icon(Icons.description_outlined, size: 18, color: AppColors.primary),
                                Text(
                                  'v3.4',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            RichText(
                              text: TextSpan(
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.onSurface,
                                ),
                                children: const [
                                  TextSpan(text: '92'),
                                  TextSpan(
                                    text: '/100',
                                    style: TextStyle(fontSize: 11, color: AppColors.outline),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              'ATS Resume',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 10,
                                color: AppColors.outline,
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Row(
                              children: [
                                Icon(Icons.check_circle_rounded, size: 12, color: AppColors.emerald),
                                SizedBox(width: 4),
                                Text(
                                  'Parse Ready',
                                  style: TextStyle(fontSize: 10, color: AppColors.onSurfaceVariant),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Academic CGPA Card
                    Expanded(
                      child: SipsCard(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Icon(Icons.school_outlined, size: 18, color: Color(0xFF006E4C)),
                                Text(
                                  'Clear',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF006E4C),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${profile?.backlogs ?? 0}',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                                color: AppColors.onSurface,
                              ),
                            ),
                            Text(
                              'Backlogs',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 10,
                                color: AppColors.outline,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Icon(Icons.thumb_up_rounded, size: 11, color: Color(0xFF006E4C)),
                                const SizedBox(width: 4),
                                Text(
                                  '${profile?.cgpa ?? 8.82} CGPA',
                                  style: const TextStyle(fontSize: 10, color: AppColors.onSurfaceVariant),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Today's Focus (Action Priority Queue)
                SectionHeader(
                  title: "Today's Focus",
                  badge: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.primaryFixed,
                      borderRadius: AppRadius.fullRadius,
                    ),
                    child: Text(
                      '3',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppColors.onPrimaryFixed,
                      ),
                    ),
                  ),
                  actionLabel: 'View All Tasks',
                  onActionTap: () => context.go('/growth'),
                ),
                const SizedBox(height: 10),

                // Focus Card 1: System Design Mock
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  onTap: () => context.push('/mock-interview'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: AppColors.primaryFixed,
                              borderRadius: AppRadius.mdRadius,
                            ),
                            child: const Icon(
                              Icons.video_camera_front_rounded,
                              color: AppColors.primary,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 5,
                                      height: 5,
                                      decoration: const BoxDecoration(
                                        color: AppColors.primary,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      '6:30 PM • Peer Mock Session',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Distributed Caching System',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.onSurface,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SipsBadge(
                            label: '45m',
                            variant: SipsBadgeVariant.neutral,
                            isSmall: true,
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 24,
                                height: 24,
                                decoration: const BoxDecoration(
                                  color: Color(0xFFCBD5E1),
                                  shape: BoxShape.circle,
                                ),
                                child: const Center(
                                  child: Text('RV', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800)),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'With Rohan V. (SDE-1 @ Stripe)',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  color: AppColors.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                          SipsButton(
                            label: 'Join Room',
                            size: SipsButtonSize.small,
                            trailingIcon: Icons.arrow_forward_rounded,
                            onPressed: () => context.push('/mock-interview'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 10),

                // Focus Card 2: Tree Problem Task
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  onTap: () => context.go('/growth'),
                  child: Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: AppColors.secondaryFixed,
                          borderRadius: AppRadius.mdRadius,
                        ),
                        child: const Icon(
                          Icons.account_tree_rounded,
                          color: AppColors.secondary,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const SipsBadge(
                                  label: 'Uber Tagged',
                                  variant: SipsBadgeVariant.neutral,
                                  isSmall: true,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  '• 25 mins',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 11,
                                    color: AppColors.outline,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '2 High-Frequency Tree Inversions',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.onSurface,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.play_circle_fill_rounded, color: AppColors.primary, size: 28),
                        onPressed: () => context.go('/growth'),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Domain Competency Radar
                SectionHeader(
                  title: 'Domain Competency Radar',
                  actionLabel: 'Deep Audit',
                  onActionTap: () => context.go('/skills'),
                ),
                const SizedBox(height: 10),
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: readiness.domainScores.map((domain) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  domain.title,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.onSurface,
                                  ),
                                ),
                                Text(
                                  '${domain.score}%',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.onSurface,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            ClipRRect(
                              borderRadius: AppRadius.fullRadius,
                              child: LinearProgressIndicator(
                                value: domain.score / 100,
                                minHeight: 6,
                                backgroundColor: AppColors.surfaceContainerLow,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  domain.score >= 90
                                      ? AppColors.emerald
                                      : (domain.score >= 80 ? AppColors.primary : AppColors.secondary),
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),

                const SizedBox(height: 20),

                // Placement Cell Advisor Note Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerLow,
                    borderRadius: AppRadius.xlRadius,
                    border: Border.all(color: AppColors.outlineVariant, width: 1),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: AppColors.primaryFixed,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.primary.withValues(alpha: 0.3), width: 1),
                        ),
                        child: const Icon(Icons.person_pin_rounded, color: AppColors.primary, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Placement Cell Advisor Note',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.onSurface,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Complete your mock interview today to trigger automatic tier-1 verification for tomorrow\'s campus shortlist batch.',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 11,
                                color: AppColors.onSurfaceVariant,
                                height: 1.35,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildPillarItem(String label, String value, Color valueColor) {
    return Column(
      children: [
        Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: AppColors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}
