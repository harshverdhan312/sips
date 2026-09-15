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
import '../../core/widgets/skill_chip.dart';
import '../../providers/sips_providers.dart';

class JobDetailScreen extends ConsumerWidget {
  final String jobId;

  const JobDetailScreen({super.key, required this.jobId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobsAsync = ref.watch(opportunitiesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        title: const Text('Job Detail & Match'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: jobsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(child: Text('Error: $err')),
        data: (jobs) {
          final job = jobs.firstWhere(
            (j) => j.id == jobId,
            orElse: () => jobs.first,
          );

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Hero Match Breakdown Card
                      SipsCard(
                        hasGlow: true,
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                SipsBadge(
                                  label: job.company,
                                  variant: SipsBadgeVariant.primary,
                                  isSmall: true,
                                ),
                                SipsBadge(
                                  label: job.deadlineText,
                                  variant: SipsBadgeVariant.neutral,
                                  isSmall: true,
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              job.role,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: AppColors.onSurface,
                                letterSpacing: -0.4,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${job.location} • ${job.ctc}',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.onSurfaceVariant,
                              ),
                            ),
                            const SizedBox(height: 16),
                            // Match Telemetry Circle
                            ReadinessGauge(
                              score: job.matchScore.toDouble(),
                              size: 140,
                              subtitle: 'Profile Affinity',
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'High Placement Affinity',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: AppColors.onSurface,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Matched Skills Section
                      SectionHeader(
                        title: 'Matched Skills (${job.matchedSkills.length})',
                        badge: const SipsBadge(
                          label: 'VERIFIED',
                          variant: SipsBadgeVariant.emerald,
                          isSmall: true,
                        ),
                      ),
                      const SizedBox(height: 10),
                      SipsCard(
                        padding: const EdgeInsets.all(16),
                        child: Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: job.matchedSkills
                              .map((s) => SkillChip(label: s, status: SkillStatus.strong))
                              .toList(),
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Skill Gaps & Bridge Section
                      SectionHeader(
                        title: 'Identified Skill Gaps (${job.missingSkills.length})',
                        badge: const SipsBadge(
                          label: 'INTERVENTION NEEDED',
                          variant: SipsBadgeVariant.amber,
                          isSmall: true,
                        ),
                      ),
                      const SizedBox(height: 10),
                      SipsCard(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: job.missingSkills
                                  .map((s) => SkillChip(label: s, status: SkillStatus.gap))
                                  .toList(),
                            ),
                            const SizedBox(height: 14),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFFBEB),
                                borderRadius: AppRadius.mdRadius,
                                border: Border.all(color: const Color(0xFFFDE68A), width: 0.8),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.flash_on_rounded, color: Color(0xFFD97706), size: 18),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Addressing these 2 gaps will boost your match score to 96% and unlock direct interview scheduling.',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 11,
                                        color: const Color(0xFF92400E),
                                        height: 1.35,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Job Description
                      SectionHeader(title: 'Role Overview'),
                      const SizedBox(height: 8),
                      SipsCard(
                        padding: const EdgeInsets.all(16),
                        child: Text(
                          job.description,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 13,
                            color: AppColors.onSurfaceVariant,
                            height: 1.5,
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Eligibility Checklist
                      SectionHeader(title: 'Placement Cell Eligibility'),
                      const SizedBox(height: 8),
                      SipsCard(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: job.eligibilityCriteria.map((item) {
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.check_circle_rounded, color: AppColors.emerald, size: 16),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      item,
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                        color: AppColors.onSurface,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ),

                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),

              // Bottom Fixed Action Dock
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: AppColors.surfaceContainerLowest,
                  border: Border(top: BorderSide(color: AppColors.borderStroke, width: 1)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: SipsButton(
                        label: 'Bridge Skill Gaps',
                        variant: SipsButtonVariant.outline,
                        size: SipsButtonSize.large,
                        onPressed: () => context.go('/growth'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: SipsButton(
                        label: job.hasApplied ? 'Applied' : 'Apply via Campus',
                        variant: job.hasApplied ? SipsButtonVariant.emerald : SipsButtonVariant.primary,
                        size: SipsButtonSize.large,
                        onPressed: () {
                          ref.read(opportunitiesProvider.notifier).apply(job.id);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Applied for ${job.role} at ${job.company}!'),
                              backgroundColor: AppColors.emerald,
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
