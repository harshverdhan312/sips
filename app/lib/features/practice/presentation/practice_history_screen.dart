import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/widgets/sips_badge.dart';
import '../../../core/widgets/sips_card.dart';
import '../data/models/practice_history_item.dart';
import '../providers/practice_providers.dart';

class PracticeHistoryScreen extends ConsumerStatefulWidget {
  const PracticeHistoryScreen({super.key});

  @override
  ConsumerState<PracticeHistoryScreen> createState() => _PracticeHistoryScreenState();
}

class _PracticeHistoryScreenState extends ConsumerState<PracticeHistoryScreen> {
  String _selectedCategory = 'ALL';

  final List<String> _categories = [
    'ALL',
    'QUANTITATIVE',
    'LOGICAL',
    'VERBAL',
    'DSA',
    'DBMS',
    'OS',
    'NETWORKS',
    'OOP',
  ];

  @override
  Widget build(BuildContext context) {
    final historyAsync = ref.watch(practiceHistoryProvider(_selectedCategory == 'ALL' ? null : _selectedCategory));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: Text(
          'Practice History',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.onSurface),
        ),
      ),
      body: Column(
        children: [
          // Category Filter Chips
          Container(
            height: 48,
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _categories.length,
              separatorBuilder: (context, index) => const SizedBox(width: 8),
              itemBuilder: (ctx, i) {
                final cat = _categories[i];
                final isSelected = _selectedCategory == cat;

                return InkWell(
                  onTap: () {
                    setState(() => _selectedCategory = cat);
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary : AppColors.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Center(
                      child: Text(
                        cat,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                          color: isSelected ? Colors.white : AppColors.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          const Divider(height: 1, color: AppColors.borderStroke),

          // History List
          Expanded(
            child: historyAsync.when(
              loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
              error: (err, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline_rounded, size: 40, color: AppColors.error),
                      const SizedBox(height: 12),
                      Text('Failed to load history: $err', textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => ref.invalidate(practiceHistoryProvider),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
              data: (history) {
                if (history.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceContainerLow,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.history_toggle_off_rounded, size: 48, color: AppColors.outline),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No practice attempts yet',
                          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.onSurface),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Start your first practice set from the hub!',
                          style: GoogleFonts.inter(fontSize: 13, color: AppColors.onSurfaceVariant),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: () => context.go('/practice'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Go to Practice Hub', style: TextStyle(color: Colors.white)),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: history.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (ctx, i) {
                    final item = history[i];
                    return _buildHistoryCard(context, item);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryCard(BuildContext context, PracticeHistoryItem item) {
    final dateFormat = item.createdAt != null ? DateFormat('MMM d, yyyy • h:mm a').format(item.createdAt!) : 'Recently';
    final isHighPass = item.accuracy >= 70;

    return SipsCard(
      onTap: () {
        context.push('/practice/result/${item.id}');
      },
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: isHighPass ? AppColors.emerald.withValues(alpha: 0.12) : AppColors.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isHighPass ? Icons.verified_rounded : Icons.quiz_rounded,
              color: isHighPass ? AppColors.emeraldDark : AppColors.primary,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      item.category,
                      style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.onSurface),
                    ),
                    SipsBadge(
                      label: '${item.score.toStringAsFixed(0)}/${item.totalMarks.toStringAsFixed(0)} (${item.accuracy.toStringAsFixed(0)}%)',
                      variant: isHighPass ? SipsBadgeVariant.emerald : SipsBadgeVariant.neutral,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  dateFormat,
                  style: GoogleFonts.inter(fontSize: 12, color: AppColors.onSurfaceVariant),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(Icons.chevron_right_rounded, color: AppColors.outline, size: 20),
        ],
      ),
    );
  }
}
