import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/widgets/sips_badge.dart';
import '../../core/widgets/sips_button.dart';
import '../../core/widgets/sips_card.dart';
import '../../core/widgets/skill_chip.dart';
import '../../models/peer_match.dart';
import '../../providers/sips_providers.dart';

class PeerMatchingScreen extends ConsumerWidget {
  const PeerMatchingScreen({super.key});

  void _showPracticeModal(BuildContext context, PeerMatch peer) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceContainerLowest,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Schedule Peer Mock Drill',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppColors.onSurface,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Pair with ${peer.name} (${peer.roleOrBadge}) for a 45-minute technical simulation.',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  color: AppColors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLow,
                  borderRadius: AppRadius.lgRadius,
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_month_rounded, color: AppColors.primary, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Today, 6:30 PM — 7:15 PM',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.onSurface,
                            ),
                          ),
                          Text(
                            'Focus: Distributed Caching & CAP Theorem',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 11,
                              color: AppColors.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SipsButton(
                label: 'Confirm & Enter Room',
                isFullWidth: true,
                size: SipsButtonSize.large,
                trailingIcon: Icons.arrow_forward_rounded,
                onPressed: () {
                  Navigator.pop(ctx);
                  context.push('/mock-interview');
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final peersAsync = ref.watch(peerMatchingProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        title: const Text('Peer Matching & Practice'),
      ),
      body: peersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(child: Text('Error loading peers: $err')),
        data: (peers) {
          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Affinity Banner
                SipsCard(
                  hasGlow: true,
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SipsBadge(
                        label: 'COMPLEMENTARY TALENT RADAR',
                        variant: SipsBadgeVariant.secondary,
                        isSmall: true,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Collaborative Placement Drills',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Matches candidate strengths with your identified skill gaps to maximize interview simulation effectiveness.',
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

                // Peer Cards
                ...peers.map((peer) => _buildPeerCard(context, peer)),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildPeerCard(BuildContext context, PeerMatch peer) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: SipsCard(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Avatar, Name, Affinity
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.primaryFixed,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.2), width: 1),
                  ),
                  child: Center(
                    child: Text(
                      peer.name.split(' ').map((n) => n[0]).join(),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
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
                      Text(
                        peer.name,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.onSurface,
                        ),
                      ),
                      Text(
                        '${peer.roleOrBadge} • ${peer.college}',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11,
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE6F8F0),
                    borderRadius: AppRadius.fullRadius,
                    border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3), width: 0.8),
                  ),
                  child: Text(
                    '${peer.matchAffinity}% Match',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF047857),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),

            // Strong Skills
            Text(
              'Strong In (Can Mentor):',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.outline,
              ),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: peer.strongSkills.map((s) => SkillChip(label: s, status: SkillStatus.strong)).toList(),
            ),

            const SizedBox(height: 10),

            // Learning Skills
            Text(
              'Practicing (Mutual Learning):',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.outline,
              ),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: peer.learningSkills.map((s) => SkillChip(label: s, status: SkillStatus.developing)).toList(),
            ),

            const SizedBox(height: 14),

            // Actions Row
            Row(
              children: [
                Expanded(
                  child: SipsButton(
                    label: 'Schedule Practice Drill',
                    size: SipsButtonSize.small,
                    trailingIcon: Icons.video_camera_front_rounded,
                    onPressed: () => _showPracticeModal(context, peer),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
