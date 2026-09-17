import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/widgets/readiness_gauge.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/sips_badge.dart';
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
          final alertsAsync = ref.watch(alertsProvider);
          final oppsAsync = ref.watch(opportunitiesProvider);
          final latestAlert = alertsAsync.value?.isNotEmpty == true ? alertsAsync.value!.first : null;
          final topJobs = oppsAsync.value?.take(2).toList() ?? [];

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
                            label: profile?.tier ?? 'Tier-3 • Needs Preparation',
                            icon: Icons.verified_user_rounded,
                            variant: SipsBadgeVariant.neutral,
                          ),
                          SipsBadge(
                            label: readiness.scoreGainText,
                            icon: Icons.trending_up_rounded,
                            variant: readiness.overallScore >= 80 ? SipsBadgeVariant.emerald : SipsBadgeVariant.neutral,
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

                // Placement Cell Announcement Banner (LIVE from notifications)
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
                                  latestAlert?.timestamp ?? 'Live',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 10,
                                    color: AppColors.outline,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              latestAlert?.title ?? 'No Active Announcements',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: AppColors.onSurface,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              latestAlert?.description ?? 'New campus placement alerts and recruitment schedules will appear here in real time.',
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
                ),

                const SizedBox(height: 20),

                // Candidate Telemetry Row (LIVE Backend Fields)
                SectionHeader(
                  title: 'Candidate Telemetry',
                  badge: const SipsBadge(label: 'SYNC: LIVE', variant: SipsBadgeVariant.neutral, isSmall: true),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    // GitHub Card
                    Expanded(
                      child: SipsCard(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Icon(Icons.terminal_rounded, size: 18, color: AppColors.secondary),
                                Text(
                                  profile?.githubHandle.isNotEmpty == true ? 'Synced' : 'Not Linked',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: profile?.githubHandle.isNotEmpty == true ? const Color(0xFF006E4C) : AppColors.outline,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              profile?.githubHandle.isNotEmpty == true ? profile!.githubHandle : '—',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: AppColors.onSurface,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              'GitHub Handle',
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
                                  decoration: BoxDecoration(
                                    color: profile?.githubHandle.isNotEmpty == true ? AppColors.emerald : AppColors.outline,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    profile?.githubHandle.isNotEmpty == true ? 'Connected' : 'Add in Profile',
                                    style: const TextStyle(fontSize: 10, color: AppColors.onSurfaceVariant),
                                    overflow: TextOverflow.ellipsis,
                                  ),
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
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Icon(Icons.description_outlined, size: 18, color: AppColors.primary),
                                Text(
                                  profile?.resumeUrl.isNotEmpty == true ? 'Uploaded' : 'Pending',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: profile?.resumeUrl.isNotEmpty == true ? AppColors.primary : AppColors.outline,
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
                                children: [
                                  TextSpan(text: '${profile?.atsScore ?? 0}'),
                                  const TextSpan(
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
                            Row(
                              children: [
                                Icon(
                                  profile?.resumeUrl.isNotEmpty == true ? Icons.check_circle_rounded : Icons.radio_button_unchecked,
                                  size: 12,
                                  color: profile?.resumeUrl.isNotEmpty == true ? AppColors.emerald : AppColors.outline,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  profile?.resumeUrl.isNotEmpty == true ? 'Verified' : 'Not Uploaded',
                                  style: const TextStyle(fontSize: 10, color: AppColors.onSurfaceVariant),
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
                                  'Academic',
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
                              (profile?.cgpa ?? 0.0) > 0 ? (profile!.cgpa).toStringAsFixed(2) : '—',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                                color: AppColors.onSurface,
                              ),
                            ),
                            Text(
                              'CGPA',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 10,
                                color: AppColors.outline,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Icon(Icons.batch_prediction_rounded, size: 11, color: Color(0xFF006E4C)),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    profile?.graduationYear.isNotEmpty == true ? '${profile!.graduationYear} Batch' : 'Batch',
                                    style: const TextStyle(fontSize: 10, color: AppColors.onSurfaceVariant),
                                    overflow: TextOverflow.ellipsis,
                                  ),
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

                // Top Opportunities / Active Drives (LIVE Backend Jobs)
                SectionHeader(
                  title: 'Active Recruitment Drives',
                  badge: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.primaryFixed,
                      borderRadius: AppRadius.fullRadius,
                    ),
                    child: Text(
                      '${oppsAsync.value?.length ?? 0}',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppColors.onPrimaryFixed,
                      ),
                    ),
                  ),
                  actionLabel: 'View All Drives',
                  onActionTap: () => context.go('/opportunities'),
                ),
                const SizedBox(height: 10),

                if (topJobs.isNotEmpty)
                  ...topJobs.map((job) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: SipsCard(
                      padding: const EdgeInsets.all(16),
                      onTap: () => context.push('/opportunities/${job.id}'),
                      child: Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: AppColors.primaryFixed,
                              borderRadius: AppRadius.mdRadius,
                            ),
                            child: Center(
                              child: Text(
                                job.company.isNotEmpty ? job.company[0].toUpperCase() : 'J',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.onPrimaryFixed,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        job.company,
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.onSurface,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    SipsBadge(
                                      label: '${job.matchScore}% Match',
                                      variant: job.matchScore >= 80 ? SipsBadgeVariant.emerald : SipsBadgeVariant.primary,
                                      isSmall: true,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  job.role,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 12,
                                    color: AppColors.onSurfaceVariant,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${job.ctc} • ${job.deadlineText}',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 11,
                                    color: AppColors.outline,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.outline),
                        ],
                      ),
                    ),
                  ))
                else
                  SipsCard(
                    padding: const EdgeInsets.all(20),
                    child: Center(
                      child: Column(
                        children: [
                          const Icon(Icons.work_outline_rounded, size: 32, color: AppColors.outline),
                          const SizedBox(height: 8),
                          Text(
                            'No placement drives available right now.',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              color: AppColors.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                const SizedBox(height: 24),

                // Domain Competency Radar (LIVE Scores)
                SectionHeader(
                  title: 'Domain Competency Assessment',
                  actionLabel: 'View Skills',
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
                                  domain.score >= 80
                                      ? AppColors.emerald
                                      : (domain.score >= 50 ? AppColors.primary : AppColors.secondary),
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

                // Placement Cell Advisor Note Card (Dynamic guidance)
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
                              'Placement Guidance Note',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.onSurface,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              profile?.skills.isEmpty == true
                                  ? 'Add your verified technical skills in your Profile to calculate company drive match scores.'
                                  : (profile?.resumeUrl.isEmpty == true
                                      ? 'Upload your PDF resume in your Profile to unlock one-click campus drive applications.'
                                      : 'Your student profile is synchronized with the placement server for live recruitment drives.'),
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
