import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/network/api_exception.dart';
import '../../core/widgets/readiness_gauge.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/sips_badge.dart';
import '../../core/widgets/sips_button.dart';
import '../../core/widgets/sips_card.dart';
import '../../core/widgets/skill_chip.dart';
import '../../models/job_opportunity.dart';
import '../../providers/sips_providers.dart';

class JobDetailScreen extends ConsumerStatefulWidget {
  final String jobId;

  const JobDetailScreen({super.key, required this.jobId});

  @override
  ConsumerState<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends ConsumerState<JobDetailScreen> {
  bool _isApplying = false;

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

    setState(() => _isApplying = true);
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
        setState(() => _isApplying = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final jobsAsync = ref.watch(opportunitiesProvider);
    final mlMatchAsync = ref.watch(jobMatchAnalysisProvider(widget.jobId));

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
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Re-analyze Match',
            onPressed: () => ref.refresh(jobMatchAnalysisProvider(widget.jobId)),
          ),
        ],
      ),
      body: jobsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(child: Text('Error: $err')),
        data: (jobs) {
          final job = jobs.firstWhere(
            (j) => j.id == widget.jobId,
            orElse: () => jobs.first,
          );

          final mlMatch = mlMatchAsync.valueOrNull;
          final effectiveScore = mlMatch != null
              ? mlMatch.hybridMatchScore.round()
              : job.matchScore;
          final effectiveMatchedSkills = mlMatch != null && mlMatch.matchedSkills.isNotEmpty
              ? mlMatch.matchedSkills
              : job.matchedSkills;
          final effectiveMissingSkills = mlMatch != null
              ? mlMatch.missingSkills
              : job.missingSkills;

          final hasApplied = job.hasApplied;
          final isEligible = job.isEligible;
          final isDriveActive = job.isActive;
          final isExpired = job.isExpired;

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
                                  label: isExpired
                                      ? 'DEADLINE PASSED'
                                      : !isDriveActive
                                          ? 'DRIVE CLOSED'
                                          : !isEligible
                                              ? 'NOT ELIGIBLE'
                                              : hasApplied
                                                  ? 'APPLIED'
                                                  : mlMatch?.mlStatus == 'completed'
                                                      ? 'AI HYBRID MATCH'
                                                      : job.deadlineText,
                                  variant: (!isEligible || isExpired)
                                      ? SipsBadgeVariant.amber
                                      : (hasApplied || mlMatch?.mlStatus == 'completed')
                                          ? SipsBadgeVariant.emerald
                                          : SipsBadgeVariant.neutral,
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
                              score: effectiveScore.toDouble(),
                              size: 140,
                              subtitle: mlMatch?.mlStatus == 'completed' ? 'Hybrid Match' : 'Profile Affinity',
                            ),
                            const SizedBox(height: 8),
                            Text(
                              effectiveScore >= 75 ? 'High Placement Affinity' : 'Moderate Placement Affinity',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: AppColors.onSurface,
                              ),
                            ),
                            if (mlMatch != null) ...[
                              const SizedBox(height: 14),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceContainerLow,
                                  borderRadius: AppRadius.mdRadius,
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                                  children: [
                                    Column(
                                      children: [
                                        Text(
                                          'Keyword Score',
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 10,
                                            color: AppColors.onSurfaceVariant,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${mlMatch.skillCoverageScore.toStringAsFixed(0)}%',
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w800,
                                            color: AppColors.onSurface,
                                          ),
                                        ),
                                      ],
                                    ),
                                    Container(width: 1, height: 20, color: AppColors.outlineVariant),
                                    Column(
                                      children: [
                                        Text(
                                          'Semantic Score',
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 10,
                                            color: AppColors.onSurfaceVariant,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          mlMatch.semanticSimilarity != null
                                              ? '${(mlMatch.semanticSimilarity! * 100).toStringAsFixed(0)}%'
                                              : 'N/A',
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w800,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Ineligibility Alert Banner if Not Eligible
                      if (!isEligible)
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF1F2),
                            borderRadius: AppRadius.lgRadius,
                            border: Border.all(color: const Color(0xFFFECDD3), width: 1),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.error_outline_rounded, color: Color(0xFFE11D48), size: 18),
                                  const SizedBox(width: 8),
                                  Text(
                                    'You are not eligible for this campus drive',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF9F1239),
                                    ),
                                  ),
                                ],
                              ),
                              if (job.eligibilityReasons.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                ...job.eligibilityReasons.map(
                                  (r) => Padding(
                                    padding: const EdgeInsets.only(left: 26, bottom: 4),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('• ', style: TextStyle(color: Color(0xFFE11D48), fontWeight: FontWeight.bold)),
                                        Expanded(
                                          child: Text(
                                            r,
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 12,
                                              color: const Color(0xFFBE123C),
                                              fontWeight: FontWeight.w600,
                                            ),
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

                      if (!isEligible) const SizedBox(height: 20),

                      // Matched Skills Section
                      SectionHeader(
                        title: 'Matched Skills (${effectiveMatchedSkills.length})',
                        badge: const SipsBadge(
                          label: 'VERIFIED',
                          variant: SipsBadgeVariant.emerald,
                          isSmall: true,
                        ),
                      ),
                      const SizedBox(height: 10),
                      SipsCard(
                        padding: const EdgeInsets.all(16),
                        child: effectiveMatchedSkills.isNotEmpty
                            ? Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: effectiveMatchedSkills
                                    .map((s) => SkillChip(label: s, status: SkillStatus.strong))
                                    .toList(),
                              )
                            : Text(
                                'No matching skills found.',
                                style: GoogleFonts.plusJakartaSans(fontSize: 12, color: AppColors.onSurfaceVariant),
                              ),
                      ),

                      const SizedBox(height: 20),

                      // Skill Gaps & Bridge Section
                      SectionHeader(
                        title: 'Identified Skill Gaps (${effectiveMissingSkills.length})',
                        badge: SipsBadge(
                          label: effectiveMissingSkills.isEmpty ? 'NONE' : 'INTERVENTION NEEDED',
                          variant: effectiveMissingSkills.isEmpty ? SipsBadgeVariant.emerald : SipsBadgeVariant.amber,
                          isSmall: true,
                        ),
                      ),
                      const SizedBox(height: 10),
                      SipsCard(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (effectiveMissingSkills.isNotEmpty)
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: effectiveMissingSkills
                                    .map((s) => SkillChip(label: s, status: SkillStatus.gap))
                                    .toList(),
                              )
                            else
                              Text(
                                'All required skills matched for this opportunity!',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  color: const Color(0xFF047857),
                                  fontWeight: FontWeight.w600,
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
                          job.description.isNotEmpty ? job.description : 'No description provided.',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 13,
                            color: AppColors.onSurfaceVariant,
                            height: 1.5,
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Placement Cell Eligibility Checklist
                      SectionHeader(title: 'Placement Cell Eligibility Criteria'),
                      const SizedBox(height: 8),
                      SipsCard(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            if (job.minCgpa > 0)
                              _buildEligibilityRow(
                                title: 'Minimum CGPA Required: ${job.minCgpa}',
                                isMet: isEligible || !job.eligibilityReasons.any((r) => r.toLowerCase().contains('cgpa')),
                              ),
                            if (job.allowedBranches.isNotEmpty)
                              _buildEligibilityRow(
                                title: 'Allowed Branches: ${job.allowedBranches.join(', ')}',
                                isMet: isEligible || !job.eligibilityReasons.any((r) => r.toLowerCase().contains('branch')),
                              ),
                            _buildEligibilityRow(
                              title: 'Application Deadline: ${job.deadline}',
                              isMet: !isExpired,
                            ),
                            _buildEligibilityRow(
                              title: 'Drive Status: ${job.status}',
                              isMet: isDriveActive,
                            ),
                          ],
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
                        label: hasApplied
                            ? 'Applied'
                            : isExpired
                                ? 'Deadline Passed'
                                : !isDriveActive
                                    ? 'Drive Closed'
                                    : !isEligible
                                        ? 'Not Eligible'
                                        : 'Apply via Campus',
                        variant: hasApplied
                            ? SipsButtonVariant.emerald
                            : (!isEligible || !isDriveActive || isExpired)
                                ? SipsButtonVariant.secondary
                                : SipsButtonVariant.primary,
                        size: SipsButtonSize.large,
                        isLoading: _isApplying,
                        onPressed: (hasApplied || !isEligible || !isDriveActive || isExpired || _isApplying)
                            ? null
                            : () => _handleApply(job),
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

  Widget _buildEligibilityRow({required String title, required bool isMet}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            isMet ? Icons.check_circle_rounded : Icons.cancel_rounded,
            color: isMet ? AppColors.emerald : const Color(0xFFE11D48),
            size: 16,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              title,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: isMet ? AppColors.onSurface : const Color(0xFFBE123C),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
