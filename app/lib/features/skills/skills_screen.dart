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
import '../../models/skill_intelligence.dart';
import '../../providers/sips_providers.dart';

class SkillsScreen extends ConsumerStatefulWidget {
  const SkillsScreen({super.key});

  @override
  ConsumerState<SkillsScreen> createState() => _SkillsScreenState();
}

class _SkillsScreenState extends ConsumerState<SkillsScreen> {
  int _selectedFilter = 0; // 0: All, 1: Strong, 2: Developing, 3: Gaps
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final skillsAsync = ref.watch(skillsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: skillsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 40),
              const SizedBox(height: 12),
              Text('Unable to load skills: $err', style: GoogleFonts.plusJakartaSans(color: AppColors.onSurfaceVariant)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(skillsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (skills) {
          if (skills.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: AppColors.primaryFixed,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.radar_rounded, size: 32, color: AppColors.primary),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No verified technical skills yet.',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.onSurface,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Add verified technical skills from your Profile to calibrate job matching and calculate readiness scores.',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        color: AppColors.onSurfaceVariant,
                        height: 1.4,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    SipsButton(
                      label: 'Add Skills in Profile',
                      trailingIcon: Icons.arrow_forward_rounded,
                      onPressed: () => context.go('/profile'),
                    ),
                  ],
                ),
              ),
            );
          }

          final strongCount = skills.where((s) => s.status == SkillStatus.strong).length;
          final devCount = skills.where((s) => s.status == SkillStatus.developing).length;
          final gapCount = skills.where((s) => s.status == SkillStatus.gap).length;

          final filteredSkills = skills.where((s) {
            if (_selectedFilter == 1 && s.status != SkillStatus.strong) return false;
            if (_selectedFilter == 2 && s.status != SkillStatus.developing) return false;
            if (_selectedFilter == 3 && s.status != SkillStatus.gap) return false;
            if (_searchQuery.isNotEmpty && !s.name.toLowerCase().contains(_searchQuery.toLowerCase())) {
              return false;
            }
            return true;
          }).toList();

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Banner
                SipsCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const SipsBadge(
                            label: 'VERIFIED SKILLS MATRIX',
                            variant: SipsBadgeVariant.primary,
                            isSmall: true,
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceContainerLow,
                              borderRadius: AppRadius.fullRadius,
                            ),
                            child: Text(
                              '${skills.length} Verified',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: AppColors.onSurface,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Verified Technical Competencies',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppColors.onSurface,
                          letterSpacing: -0.4,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Skills listed in your student profile are matched dynamically against recruiter job requirements.',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          color: AppColors.onSurfaceVariant,
                          height: 1.35,
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
                    hintText: 'Search skills...',
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

                const SizedBox(height: 14),

                // Filter Tabs
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip(0, 'All (${skills.length})'),
                      const SizedBox(width: 8),
                      _buildFilterChip(1, 'Strong ($strongCount)'),
                      if (devCount > 0) ...[
                        const SizedBox(width: 8),
                        _buildFilterChip(2, 'Developing ($devCount)'),
                      ],
                      if (gapCount > 0) ...[
                        const SizedBox(width: 8),
                        _buildFilterChip(3, 'Gaps ($gapCount)'),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Skills List
                ...filteredSkills.map((skill) => _buildSkillCard(skill)),

                const SizedBox(height: 12),

                // CTA to manage in profile
                Center(
                  child: TextButton.icon(
                    onPressed: () => context.go('/profile'),
                    icon: const Icon(Icons.edit_note_rounded, size: 18),
                    label: const Text('Edit or Add More Skills in Profile'),
                  ),
                ),
              ],
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

  Widget _buildSkillCard(SkillItem skill) {
    Color statusColor;
    String statusLabel;
    switch (skill.status) {
      case SkillStatus.strong:
        statusColor = const Color(0xFF047857);
        statusLabel = 'STRONG';
        break;
      case SkillStatus.developing:
        statusColor = const Color(0xFF4338CA);
        statusLabel = 'DEVELOPING';
        break;
      case SkillStatus.gap:
        statusColor = const Color(0xFFB45309);
        statusLabel = 'IDENTIFIED GAP';
        break;
      default:
        statusColor = AppColors.outline;
        statusLabel = 'NEUTRAL';
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: SipsCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.12),
                          borderRadius: AppRadius.fullRadius,
                        ),
                        child: Text(
                          statusLabel,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            color: statusColor,
                            letterSpacing: 0.4,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        skill.category,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11,
                          color: AppColors.outline,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '+${skill.readinessImpact}% Boost',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              skill.name,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            // Progress Bar
            Row(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: AppRadius.fullRadius,
                    child: LinearProgressIndicator(
                      value: skill.proficiency / 100,
                      minHeight: 7,
                      backgroundColor: AppColors.surfaceContainerLow,
                      valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  '${skill.proficiency}%',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: AppColors.onSurface,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: AppRadius.mdRadius,
              ),
              child: Row(
                children: [
                  const Icon(Icons.lightbulb_outline_rounded, size: 16, color: AppColors.amberDark),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      skill.recommendation,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        color: AppColors.onSurfaceVariant,
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
    );
  }
}
