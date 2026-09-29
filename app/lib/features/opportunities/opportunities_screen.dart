import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/network/api_exception.dart';
import '../../core/widgets/sips_badge.dart';
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
  String _statusFilter = 'all'; // 'all', 'active', 'closed'
  String _matchFilter = 'all'; // 'all', 'high', 'moderate', 'low'
  String _typeFilter = 'all'; // 'all', 'full-time', 'internship'
  bool _onlySaved = false;

  final Set<String> _applyingJobIds = {};

  Future<void> _handleApply(JobOpportunity job) async {
    if (job.hasApplied || !job.isEligible || !job.isActive) {
      if (!job.isEligible && job.eligibilityReasons.isNotEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(job.eligibilityReasons.join('. ')),
            backgroundColor: const Color(0xFFE11D48),
          ),
        );
      }
      return;
    }

    setState(() => _applyingJobIds.add(job.id));
    try {
      await ref.read(opportunitiesProvider.notifier).apply(job.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Application submitted successfully for ${job.company} (${job.role})!'),
            backgroundColor: AppColors.emerald,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        String msg = 'Failed to submit application.';
        if (e is ApiException) {
          if (e.details is Map && (e.details as Map)['reasons'] is List) {
            final reasons = (e.details as Map)['reasons'] as List;
            msg = reasons.join('. ');
          } else {
            msg = e.message;
          }
        } else {
          msg = e.toString();
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: const Color(0xFFE11D48),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _applyingJobIds.remove(job.id));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final jobsAsync = ref.watch(opportunitiesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: jobsAsync.when(
        loading: () => const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: AppColors.primary),
              SizedBox(height: 12),
              Text(
                'Loading opportunities...',
                style: TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant),
              ),
            ],
          ),
        ),
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
          final activeDrivesCount = jobs.where((j) => j.isActive).length;
          final highMatchCount = jobs.where((j) => j.matchScore >= 80).length;
          final appliedCount = jobs.where((j) => j.hasApplied).length;

          // Parity filtering logic identical to React
          final filteredJobs = jobs.where((job) {
            // Search matching
            final query = _searchQuery.toLowerCase().trim();
            final matchesSearch = query.isEmpty ||
                job.company.toLowerCase().contains(query) ||
                job.role.toLowerCase().contains(query) ||
                job.location.toLowerCase().contains(query) ||
                job.requiredSkills.any((s) => s.toLowerCase().contains(query));

            // Match Score Tier filtering
            bool matchesTier = true;
            if (_matchFilter == 'high') {
              matchesTier = job.matchScore >= 80;
            } else if (_matchFilter == 'moderate') {
              matchesTier = job.matchScore >= 60 && job.matchScore < 80;
            } else if (_matchFilter == 'low') {
              matchesTier = job.matchScore < 60;
            }

            // Job Type filtering
            bool matchesType = true;
            if (_typeFilter != 'all') {
              matchesType = job.type.toLowerCase().contains(_typeFilter.toLowerCase());
            }

            // Drive Status filtering
            bool matchesStatus = true;
            if (_statusFilter == 'active') {
              matchesStatus = job.isActive;
            } else if (_statusFilter == 'closed') {
              matchesStatus = !job.isActive;
            }

            // Bookmark filtering
            bool matchesBookmark = true;
            if (_onlySaved) {
              matchesBookmark = job.isBookmarked;
            }

            return matchesSearch && matchesTier && matchesType && matchesStatus && matchesBookmark;
          }).toList();

          return RefreshIndicator(
            onRefresh: () => ref.read(opportunitiesProvider.notifier).loadJobs(),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Page Header Banner
                  SipsCard(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
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
                                    'Campus Placement Drives & Opportunities',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.onSurface,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Explore active recruitment drives calibrated with verified technical skills and eligibility criteria.',
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
                        const SizedBox(height: 14),
                        // Quick Metric Badges
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: [
                            SipsBadge(
                              label: '$activeDrivesCount Active Drive${activeDrivesCount == 1 ? '' : 's'}',
                              variant: SipsBadgeVariant.primary,
                            ),
                            SipsBadge(
                              label: '$highMatchCount High Matches (≥80%)',
                              variant: SipsBadgeVariant.emerald,
                            ),
                            if (appliedCount > 0)
                              SipsBadge(
                                label: '$appliedCount Applied',
                                variant: SipsBadgeVariant.neutral,
                              ),
                          ],
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
                      hintText: 'Search company, role, location, or skill...',
                      prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppColors.outline),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded, size: 18),
                              onPressed: () => setState(() => _searchQuery = ''),
                            )
                          : null,
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

                  // Filter Row 1: Drive Status & Saved Chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildChip(
                          label: 'All Drives (${jobs.length})',
                          isSelected: _statusFilter == 'all' && !_onlySaved,
                          onTap: () => setState(() {
                            _statusFilter = 'all';
                            _onlySaved = false;
                          }),
                        ),
                        const SizedBox(width: 8),
                        _buildChip(
                          label: 'Active / Running ($activeDrivesCount)',
                          isSelected: _statusFilter == 'active',
                          onTap: () => setState(() {
                            _statusFilter = _statusFilter == 'active' ? 'all' : 'active';
                            _onlySaved = false;
                          }),
                        ),
                        const SizedBox(width: 8),
                        _buildChip(
                          label: 'Closed / Expired (${jobs.length - activeDrivesCount})',
                          isSelected: _statusFilter == 'closed',
                          onTap: () => setState(() {
                            _statusFilter = _statusFilter == 'closed' ? 'all' : 'closed';
                            _onlySaved = false;
                          }),
                        ),
                        const SizedBox(width: 8),
                        _buildChip(
                          label: 'Saved',
                          isSelected: _onlySaved,
                          icon: Icons.bookmark_rounded,
                          onTap: () => setState(() => _onlySaved = !_onlySaved),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 10),

                  // Filter Row 2: Match Score & Job Type Dropdown / Chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        // Match Dropdown
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                          decoration: BoxDecoration(
                            color: _matchFilter != 'all' ? AppColors.primaryFixed : AppColors.surfaceContainerLowest,
                            borderRadius: AppRadius.fullRadius,
                            border: Border.all(
                              color: _matchFilter != 'all' ? AppColors.primary : AppColors.outlineVariant,
                              width: 1,
                            ),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _matchFilter,
                              isDense: true,
                              icon: const Icon(Icons.arrow_drop_down, size: 18),
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                fontWeight: _matchFilter != 'all' ? FontWeight.w700 : FontWeight.w600,
                                color: _matchFilter != 'all' ? AppColors.primary : AppColors.onSurfaceVariant,
                              ),
                              items: const [
                                DropdownMenuItem(value: 'all', child: Text('All Match Scores')),
                                DropdownMenuItem(value: 'high', child: Text('High Match (80%+)')),
                                DropdownMenuItem(value: 'moderate', child: Text('Moderate Match (60-79%)')),
                                DropdownMenuItem(value: 'low', child: Text('Developing (<60%)')),
                              ],
                              onChanged: (val) => setState(() => _matchFilter = val ?? 'all'),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Job Type Dropdown
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                          decoration: BoxDecoration(
                            color: _typeFilter != 'all' ? AppColors.primaryFixed : AppColors.surfaceContainerLowest,
                            borderRadius: AppRadius.fullRadius,
                            border: Border.all(
                              color: _typeFilter != 'all' ? AppColors.primary : AppColors.outlineVariant,
                              width: 1,
                            ),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _typeFilter,
                              isDense: true,
                              icon: const Icon(Icons.arrow_drop_down, size: 18),
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                fontWeight: _typeFilter != 'all' ? FontWeight.w700 : FontWeight.w600,
                                color: _typeFilter != 'all' ? AppColors.primary : AppColors.onSurfaceVariant,
                              ),
                              items: const [
                                DropdownMenuItem(value: 'all', child: Text('All Types')),
                                DropdownMenuItem(value: 'full-time', child: Text('Full-time')),
                                DropdownMenuItem(value: 'internship', child: Text('Internship')),
                              ],
                              onChanged: (val) => setState(() => _typeFilter = val ?? 'all'),
                            ),
                          ),
                        ),
                        if (_searchQuery.isNotEmpty || _statusFilter != 'all' || _matchFilter != 'all' || _typeFilter != 'all' || _onlySaved) ...[
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: () => setState(() {
                              _searchQuery = '';
                              _statusFilter = 'all';
                              _matchFilter = 'all';
                              _typeFilter = 'all';
                              _onlySaved = false;
                            }),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppColors.surfaceContainerLow,
                                borderRadius: AppRadius.fullRadius,
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.restart_alt_rounded, size: 14, color: AppColors.outline),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Reset',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Jobs List or Empty States
                  if (filteredJobs.isEmpty)
                    SipsCard(
                      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
                      child: Center(
                        child: Column(
                          children: [
                            const Icon(Icons.work_outline_rounded, size: 40, color: AppColors.outline),
                            const SizedBox(height: 12),
                            Text(
                              jobs.isEmpty
                                  ? 'No active opportunities available.'
                                  : 'No matching recruitment drives',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: AppColors.onSurface,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              jobs.isEmpty
                                  ? 'Campus placement drives will appear here when published.'
                                  : 'Try adjusting your search terms or filter criteria to discover more campus opportunities.',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                color: AppColors.onSurfaceVariant,
                              ),
                            ),
                            if (jobs.isNotEmpty) ...[
                              const SizedBox(height: 14),
                              SipsButton(
                                label: 'Reset Filters',
                                variant: SipsButtonVariant.outline,
                                size: SipsButtonSize.small,
                                onPressed: () => setState(() {
                                  _searchQuery = '';
                                  _statusFilter = 'all';
                                  _matchFilter = 'all';
                                  _typeFilter = 'all';
                                  _onlySaved = false;
                                }),
                              ),
                            ],
                          ],
                        ),
                      ),
                    )
                  else
                    ...filteredJobs.map((job) => _buildJobCard(job)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    IconData? icon,
  }) {
    return GestureDetector(
      onTap: onTap,
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
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 14,
                color: isSelected ? Colors.white : AppColors.onSurfaceVariant,
              ),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                color: isSelected ? Colors.white : AppColors.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildJobCard(JobOpportunity job) {
    final hasApplied = job.hasApplied;
    final isEligible = job.isEligible;
    final isDriveActive = job.isActive;
    final isExpired = job.isExpired;
    final isApplying = _applyingJobIds.contains(job.id);

    final matchColor = job.matchScore >= 80
        ? const Color(0xFF047857) // Emerald
        : (job.matchScore >= 60 ? AppColors.primary : const Color(0xFFD97706)); // Amber

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: SipsCard(
        padding: const EdgeInsets.all(18),
        onTap: () => context.push('/job-detail/${job.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Company Avatar + Name & Status/Match Badges
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerLow,
                    borderRadius: AppRadius.mdRadius,
                    border: Border.all(color: AppColors.outlineVariant, width: 0.8),
                  ),
                  child: Center(
                    child: Text(
                      job.company.isNotEmpty ? job.company.substring(0, 1).toUpperCase() : 'J',
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
                      Text(
                        job.company,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: AppColors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        job.role,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined, size: 13, color: AppColors.outline),
                          const SizedBox(width: 3),
                          Text(
                            job.location,
                            style: GoogleFonts.plusJakartaSans(fontSize: 11, color: AppColors.onSurfaceVariant),
                          ),
                          const SizedBox(width: 8),
                          const Text('•', style: TextStyle(color: AppColors.outline, fontSize: 11)),
                          const SizedBox(width: 8),
                          Text(
                            job.type,
                            style: GoogleFonts.plusJakartaSans(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.onSurfaceVariant),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Match Score & Eligibility / Status Badge
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
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
                    const SizedBox(height: 4),
                    if (isExpired)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: AppRadius.mdRadius,
                          border: Border.all(color: const Color(0xFFFDE68A), width: 0.8),
                        ),
                        child: Text(
                          'Deadline Passed',
                          style: GoogleFonts.plusJakartaSans(fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFFB45309)),
                        ),
                      )
                    else if (!isDriveActive)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceContainerLow,
                          borderRadius: AppRadius.mdRadius,
                          border: Border.all(color: AppColors.outlineVariant, width: 0.8),
                        ),
                        child: Text(
                          'Drive Closed',
                          style: GoogleFonts.plusJakartaSans(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.outline),
                        ),
                      )
                    else if (!isEligible)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF1F2),
                          borderRadius: AppRadius.mdRadius,
                          border: Border.all(color: const Color(0xFFFECDD3), width: 0.8),
                        ),
                        child: Text(
                          'Not Eligible',
                          style: GoogleFonts.plusJakartaSans(fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFFE11D48)),
                        ),
                      )
                    else if (hasApplied)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: AppRadius.mdRadius,
                          border: Border.all(color: const Color(0xFFA7F3D0), width: 0.8),
                        ),
                        child: Text(
                          'Applied',
                          style: GoogleFonts.plusJakartaSans(fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFF047857)),
                        ),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: AppRadius.mdRadius,
                          border: Border.all(color: const Color(0xFFA7F3D0), width: 0.8),
                        ),
                        child: Text(
                          'Active Drive',
                          style: GoogleFonts.plusJakartaSans(fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFF047857)),
                        ),
                      ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Compensation & Eligibility Banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: AppRadius.mdRadius,
                border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.5), width: 0.8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'PACKAGE',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: AppColors.outline,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        job.ctc,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF047857),
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'ELIGIBILITY',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: AppColors.outline,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      if (isEligible)
                        Text(
                          job.minCgpa > 0 ? 'Min CGPA: ${job.minCgpa}' : 'Eligible',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF047857),
                          ),
                        )
                      else
                        Text(
                          job.eligibilityReasons.isNotEmpty
                              ? job.eligibilityReasons.first
                              : 'Requirements not met',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFFE11D48),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Matched & Gap Skills Breakdown
            if (job.matchedSkills.isNotEmpty || job.missingSkills.isNotEmpty) ...[
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  ...job.matchedSkills.map(
                    (s) => SkillChip(label: s, status: SkillStatus.strong),
                  ),
                  ...job.missingSkills.map(
                    (s) => SkillChip(label: s, status: SkillStatus.gap),
                  ),
                ],
              ),
              const SizedBox(height: 12),
            ],

            // Card Footer: Deadline + Action Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.schedule_rounded, size: 14, color: AppColors.outline),
                    const SizedBox(width: 4),
                    Text(
                      job.deadlineText,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        fontWeight: isExpired ? FontWeight.w700 : FontWeight.w500,
                        color: isExpired ? const Color(0xFFB45309) : AppColors.outline,
                      ),
                    ),
                  ],
                ),
                Row(
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
                    const SizedBox(width: 4),
                    SipsButton(
                      label: 'View Details',
                      variant: SipsButtonVariant.outline,
                      size: SipsButtonSize.small,
                      onPressed: () => context.push('/job-detail/${job.id}'),
                    ),
                    const SizedBox(width: 8),
                    // Action button reflecting authoritative state
                    SipsButton(
                      label: hasApplied
                          ? 'Applied'
                          : isExpired
                              ? 'Deadline Passed'
                              : !isDriveActive
                                  ? 'Drive Closed'
                                  : !isEligible
                                      ? 'Not Eligible'
                                      : 'Apply Now',
                      variant: hasApplied
                          ? SipsButtonVariant.emerald
                          : (!isEligible || !isDriveActive || isExpired)
                              ? SipsButtonVariant.secondary
                              : SipsButtonVariant.primary,
                      size: SipsButtonSize.small,
                      isLoading: isApplying,
                      onPressed: (hasApplied || !isEligible || !isDriveActive || isExpired || isApplying)
                          ? null
                          : () => _handleApply(job),
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
