import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/widgets/sips_button.dart';
import '../../core/widgets/sips_card.dart';
import '../../core/widgets/skill_chip.dart';
import '../../models/job_opportunity.dart';
import '../../providers/sips_providers.dart';

class OpportunitiesScreen extends ConsumerStatefulWidget {
  const OpportunitiesScreen({super.key});

  @override
  ConsumerState<OpportunitiesScreen> createState() => _OpportunitiesScreenState();
}

class _OpportunitiesScreenState extends ConsumerState<OpportunitiesScreen> {
  String _searchQuery = '';
  int _selectedFilter = 0; // 0: All Drives, 1: High Match (85%+), 2: Urgent (Closes Soon), 3: Bookmarked

  @override
  Widget build(BuildContext context) {
    final jobsAsync = ref.watch(opportunitiesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: jobsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.cloud_off_rounded, size: 48, color: AppColors.outline),
                const SizedBox(height: 12),
                Text(
                  'Unable to load campus opportunities',
                  style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text(
                  err.toString(),
                  textAlign: TextAlign.center,
                  style: GoogleFonts.plusJakartaSans(fontSize: 12, color: AppColors.onSurfaceVariant),
                ),
                const SizedBox(height: 16),
                SipsButton(
                  label: 'Retry',
                  size: SipsButtonSize.small,
                  onPressed: () => ref.read(opportunitiesProvider.notifier).loadJobs(),
                ),
              ],
            ),
          ),
        ),
        data: (jobs) {
          final filteredJobs = jobs.where((job) {
            if (_selectedFilter == 1 && job.matchScore < 85) return false;
            if (_selectedFilter == 2 && !job.deadlineText.toLowerCase().contains('24h')) return false;
            if (_selectedFilter == 3 && !job.isBookmarked) return false;
            if (_searchQuery.isNotEmpty) {
              final q = _searchQuery.toLowerCase();
              final matchesComp = job.company.toLowerCase().contains(q);
              final matchesRole = job.role.toLowerCase().contains(q);
              if (!matchesComp && !matchesRole) return false;
            }
            return true;
          }).toList();

          return RefreshIndicator(
            onRefresh: () => ref.read(opportunitiesProvider.notifier).loadJobs(),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                // Top Affinity Banner
                SipsCard(
                  padding: const EdgeInsets.all(18),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.primaryFixed,
                          borderRadius: AppRadius.lgRadius,
                        ),
                        child: const Icon(Icons.work_outline_rounded, color: AppColors.primary, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Verified Campus Drives',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: AppColors.onSurface,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${jobs.length} active opportunities calibrated to your 78/100 readiness telemetry.',
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

                const SizedBox(height: 16),

                // Search Bar
                TextField(
                  onChanged: (val) => setState(() => _searchQuery = val),
                  style: GoogleFonts.plusJakartaSans(fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Search company (e.g. Google, Atlassian, Uber)...',
                    prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppColors.outline),
                    filled: true,
                    fillColor: AppColors.surfaceContainerLowest,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    border: OutlineInputBorder(
                      borderRadius: AppRadius.lgRadius,
                      borderSide: const BorderSide(color: AppColors.outlineVariant, width: 1),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: AppRadius.lgRadius,
                      borderSide: const BorderSide(color: AppColors.outlineVariant, width: 1),
                    ),
                  ),
                ),

                const SizedBox(height: 12),

                // Filter Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip(0, 'All Drives (${jobs.length})'),
                      const SizedBox(width: 8),
                      _buildFilterChip(1, '85%+ High Match'),
                      const SizedBox(width: 8),
                      _buildFilterChip(2, 'Closing Soon'),
                      const SizedBox(width: 8),
                      _buildFilterChip(3, 'Saved'),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Jobs List
                ...filteredJobs.map((job) => _buildJobCard(job)),
              ],
            ),
          ),
        );
      },
      ),
    );
  }

  Widget _buildFilterChip(int index, String label) {
    final isSelected = _selectedFilter == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedFilter = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surfaceContainerLowest,
          borderRadius: AppRadius.fullRadius,
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.outlineVariant,
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
            color: isSelected ? Colors.white : AppColors.onSurfaceVariant,
          ),
        ),
      ),
    );
  }

  Widget _buildJobCard(JobOpportunity job) {
    final matchColor = job.matchScore >= 90
        ? const Color(0xFF047857)
        : (job.matchScore >= 80 ? AppColors.primary : AppColors.amberDark);

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: SipsCard(
        padding: const EdgeInsets.all(18),
        onTap: () => context.push('/job-detail/${job.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Company & Match Score Badge
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerLow,
                    borderRadius: AppRadius.mdRadius,
                    border: Border.all(color: AppColors.outlineVariant, width: 0.8),
                  ),
                  child: Center(
                    child: Text(
                      job.company.substring(0, 1),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
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
                          Text(
                            job.company,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (job.deadlineText.contains('24h'))
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEE2E2),
                                borderRadius: AppRadius.fullRadius,
                              ),
                              child: Text(
                                job.deadlineText,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF991B1B),
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        job.role,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.onSurface,
                        ),
                      ),
                    ],
                  ),
                ),
                // Match % Indicator
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: matchColor.withValues(alpha: 0.12),
                    borderRadius: AppRadius.fullRadius,
                    border: Border.all(color: matchColor.withValues(alpha: 0.3), width: 1),
                  ),
                  child: Text(
                    '${job.matchScore}% Match',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: matchColor,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Meta row: Location & CTC
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 14, color: AppColors.outline),
                const SizedBox(width: 4),
                Text(
                  job.location,
                  style: GoogleFonts.plusJakartaSans(fontSize: 11, color: AppColors.onSurfaceVariant),
                ),
                const SizedBox(width: 14),
                const Icon(Icons.payments_outlined, size: 14, color: AppColors.outline),
                const SizedBox(width: 4),
                Text(
                  job.ctc,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.onSurface,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Matched & Gap Chips Preview
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                ...job.matchedSkills.take(2).map(
                      (s) => SkillChip(label: s, status: SkillStatus.strong),
                    ),
                if (job.missingSkills.isNotEmpty)
                  SkillChip(label: job.missingSkills.first, status: SkillStatus.gap),
              ],
            ),

            const SizedBox(height: 14),

            // Actions Bottom Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: Icon(
                    job.isBookmarked ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                    color: job.isBookmarked ? AppColors.primary : AppColors.outline,
                    size: 20,
                  ),
                  onPressed: () => ref.read(opportunitiesProvider.notifier).toggleBookmark(job.id),
                  tooltip: 'Bookmark Drive',
                ),
                Row(
                  children: [
                    SipsButton(
                      label: 'Match Breakdown',
                      variant: SipsButtonVariant.outline,
                      size: SipsButtonSize.small,
                      onPressed: () => context.push('/job-detail/${job.id}'),
                    ),
                    const SizedBox(width: 8),
                    SipsButton(
                      label: job.hasApplied ? 'Applied' : '1-Click Apply',
                      variant: job.hasApplied ? SipsButtonVariant.emerald : SipsButtonVariant.primary,
                      size: SipsButtonSize.small,
                      onPressed: () {
                        ref.read(opportunitiesProvider.notifier).apply(job.id);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Successfully applied for ${job.role} at ${job.company}!'),
                            backgroundColor: AppColors.emerald,
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
