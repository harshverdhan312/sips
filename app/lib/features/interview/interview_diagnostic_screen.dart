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

class InterviewDiagnosticScreen extends ConsumerWidget {
  const InterviewDiagnosticScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reportAsync = ref.watch(interviewDiagnosticProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => context.go('/home'),
        ),
        title: const Text('Diagnostic & Soft Skills'),
        actions: [
          IconButton(
            icon: const Icon(Icons.download_outlined),
            onPressed: () {},
            tooltip: 'Download PDF Report',
          ),
        ],
      ),
      body: reportAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(child: Text('Error loading diagnostic: $err')),
        data: (report) {
          if (report.overallScore == 0) {
            return Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: const BoxDecoration(
                        color: AppColors.primaryFixed,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.analytics_outlined, size: 32, color: AppColors.primary),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'Interview Diagnostics',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.onSurface,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Interview diagnostic reports are not available yet.\n\nDiagnostic reports will appear here once the interview intelligence service is connected.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        color: AppColors.onSurfaceVariant,
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 24),
                    SipsCard(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SipsBadge(
                            label: 'DIAGNOSTIC TELEMETRY',
                            variant: SipsBadgeVariant.neutral,
                            isSmall: true,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            'What will be evaluated:',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.onSurface,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.check_circle_outline, size: 16, color: AppColors.primary),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Technical accuracy, structural decomposition, and STAR method usage',
                                  style: GoogleFonts.plusJakartaSans(fontSize: 12, color: AppColors.onSurfaceVariant),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.check_circle_outline, size: 16, color: AppColors.primary),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Verbal communication clarity, latency handling, and actionable gap analysis',
                                  style: GoogleFonts.plusJakartaSans(fontSize: 12, color: AppColors.onSurfaceVariant),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    SipsButton(
                      label: 'Back to Home',
                      isFullWidth: true,
                      onPressed: () => context.go('/home'),
                    ),
                  ],
                ),
              ),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Scorecard Card
                SipsCard(
                  hasGlow: true,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const SipsBadge(
                            label: 'DIAGNOSTIC AUDIT COMPLETE',
                            variant: SipsBadgeVariant.emerald,
                            isSmall: true,
                          ),
                          Text(
                            report.date,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 11,
                              color: AppColors.outline,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        report.interviewTitle,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.onSurface,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 16),
                      ReadinessGauge(
                        score: report.overallScore.toDouble(),
                        size: 150,
                        subtitle: 'Interview Score',
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Tier-1 Competitive Score',
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

                // Pillar Telemetry Metrics
                SectionHeader(title: 'Evaluation Dimensions'),
                const SizedBox(height: 10),
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildMetricBar('Technical Accuracy & Trade-offs', report.technicalScore, AppColors.primary),
                      _buildMetricBar('STAR Method & Response Structure', report.starMethodScore, AppColors.secondary),
                      _buildMetricBar('Communication & Speech Clarity', report.communicationScore, const Color(0xFF047857)),
                      _buildMetricBar('Structural Decomposition', report.structureScore, AppColors.primary),
                      _buildMetricBar('Confidence & Latency Handling', report.confidenceScore, const Color(0xFF047857)),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Summary Verdict
                SectionHeader(title: 'AI Diagnostic Verdict'),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerLow,
                    borderRadius: AppRadius.xlRadius,
                    border: Border.all(color: AppColors.borderStroke, width: 1),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.analytics_rounded, color: AppColors.primary, size: 22),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          report.summaryVerdict,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 13,
                            color: AppColors.onSurface,
                            height: 1.45,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Top Strengths
                SectionHeader(
                  title: 'Demonstrated Strengths',
                  badge: const SipsBadge(
                    label: 'BENCHMARK MET',
                    variant: SipsBadgeVariant.emerald,
                    isSmall: true,
                  ),
                ),
                const SizedBox(height: 8),
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: report.topStrengths.map((str) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.check_circle_rounded, color: AppColors.emerald, size: 16),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                str,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  color: AppColors.onSurface,
                                  height: 1.35,
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

                // High-Priority Gaps
                SectionHeader(
                  title: 'Identified Improvement Gaps',
                  badge: const SipsBadge(
                    label: 'FOCUS AREA',
                    variant: SipsBadgeVariant.amber,
                    isSmall: true,
                  ),
                ),
                const SizedBox(height: 8),
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: report.highPriorityGaps.map((gap) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.warning_amber_rounded, color: AppColors.amberDark, size: 16),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                gap,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  color: AppColors.onSurface,
                                  height: 1.35,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),

                const SizedBox(height: 24),

                // Bottom Action Buttons
                SipsButton(
                  label: 'Bridge Gaps in Growth Sprint',
                  isFullWidth: true,
                  size: SipsButtonSize.large,
                  trailingIcon: Icons.arrow_forward_rounded,
                  onPressed: () => context.go('/growth'),
                ),
                const SizedBox(height: 10),
                SipsButton(
                  label: 'Return to Placement Hub',
                  variant: SipsButtonVariant.outline,
                  isFullWidth: true,
                  size: SipsButtonSize.large,
                  onPressed: () => context.go('/home'),
                ),
                const SizedBox(height: 16),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildMetricBar(String label, int value, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.onSurface,
                ),
              ),
              Text(
                '$value%',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: AppRadius.fullRadius,
            child: LinearProgressIndicator(
              value: value / 100,
              minHeight: 6,
              backgroundColor: AppColors.surfaceContainerLow,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ),
    );
  }
}
