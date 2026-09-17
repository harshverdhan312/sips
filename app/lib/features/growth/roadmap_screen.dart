import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/widgets/sips_badge.dart';
import '../../core/widgets/sips_button.dart';
import '../../core/widgets/sips_card.dart';
import '../../models/roadmap_milestone.dart';
import '../../providers/sips_providers.dart';

class RoadmapScreen extends ConsumerWidget {
  const RoadmapScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final roadmapAsync = ref.watch(roadmapProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        title: const Text('Placement Sprint Roadmap'),
      ),
      body: roadmapAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(child: Text('Error loading roadmap: $err')),
        data: (milestones) {
          if (milestones.isEmpty) {
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
                      child: const Icon(Icons.route_rounded, size: 32, color: AppColors.primary),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'Personalized Roadmap',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.onSurface,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Personalized roadmap not available yet.\n\nYour roadmap will appear here once backend intelligence is connected.',
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
                            label: 'INTELLIGENCE ROADMAP',
                            variant: SipsBadgeVariant.neutral,
                            isSmall: true,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            'Upcoming capabilities:',
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
                                  'Curated milestone timelines tailored to your branch and skill gaps',
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
                                  'Company-specific target criteria matching',
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
                      label: 'Explore Opportunities',
                      isFullWidth: true,
                      onPressed: () => context.go('/opportunities'),
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
                // Top Trajectory Header Card
                SipsCard(
                  hasGlow: true,
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SipsBadge(
                        label: 'SPRINT TRAJECTORY',
                        variant: SipsBadgeVariant.primary,
                        isSmall: true,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Tier-1 Campus Readiness Sprint',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'A structured 4-phase preparation sprint guiding you from DSA fundamentals through high-scale architecture and live mock drills.',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          color: AppColors.onSurfaceVariant,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Vertical Milestone Timeline
                ...milestones.asMap().entries.map((entry) {
                  final index = entry.key;
                  final milestone = entry.value;
                  final isLast = index == milestones.length - 1;

                  return _buildTimelineNode(milestone, isLast);
                }),

                const SizedBox(height: 16),

                // Recommended Next Action
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerHigh,
                    borderRadius: AppRadius.xlRadius,
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.25), width: 1),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.bolt_rounded, color: AppColors.primary, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'RECOMMENDED NEXT SPRINT ACTION',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Complete Distributed Caching Mock Drill',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Advances Phase 02 completion to 85% and bridges the Atlassian SDE requirement.',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SipsButton(
                        label: 'Launch Live Mock Simulator',
                        isFullWidth: true,
                        trailingIcon: Icons.arrow_forward_rounded,
                        onPressed: () => context.push('/mock-interview'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildTimelineNode(RoadmapMilestone milestone, bool isLast) {
    Color nodeColor;
    IconData nodeIcon;

    switch (milestone.state) {
      case MilestoneState.completed:
        nodeColor = const Color(0xFF047857);
        nodeIcon = Icons.check_circle_rounded;
        break;
      case MilestoneState.inProgress:
        nodeColor = AppColors.primary;
        nodeIcon = Icons.timelapse_rounded;
        break;
      case MilestoneState.locked:
        nodeColor = AppColors.outline;
        nodeIcon = Icons.lock_outline_rounded;
        break;
    }

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left Column: Node & Connector Line
          SizedBox(
            width: 32,
            child: Column(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: nodeColor.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                    border: Border.all(color: nodeColor, width: 2),
                  ),
                  child: Center(
                    child: Icon(nodeIcon, size: 14, color: nodeColor),
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: nodeColor.withValues(alpha: 0.3),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Right Column: Milestone Card
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: SipsCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          milestone.phaseNumber,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: nodeColor,
                            letterSpacing: 0.5,
                          ),
                        ),
                        Text(
                          milestone.deadline,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.outline,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      milestone.title,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.onSurface,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      milestone.description,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        color: AppColors.onSurfaceVariant,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Progress Bar
                    Row(
                      children: [
                        Expanded(
                          child: ClipRRect(
                            borderRadius: AppRadius.fullRadius,
                            child: LinearProgressIndicator(
                              value: milestone.progressPercent / 100,
                              minHeight: 6,
                              backgroundColor: AppColors.surfaceContainerLow,
                              valueColor: AlwaysStoppedAnimation<Color>(nodeColor),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${milestone.progressPercent}%',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppColors.onSurface,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Checklist items
                    Column(
                      children: milestone.checklist.map((item) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            children: [
                              Icon(
                                milestone.state == MilestoneState.completed
                                    ? Icons.check_rounded
                                    : Icons.circle_outlined,
                                size: 12,
                                color: milestone.state == MilestoneState.completed
                                    ? AppColors.emerald
                                    : AppColors.outline,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  item,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 11,
                                    color: AppColors.onSurfaceVariant,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
