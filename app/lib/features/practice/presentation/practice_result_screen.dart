import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/sips_badge.dart';
import '../../../core/widgets/sips_card.dart';
import '../data/models/practice_result.dart';
import '../providers/practice_providers.dart';

class PracticeResultScreen extends ConsumerWidget {
  final String attemptId;

  const PracticeResultScreen({
    super.key,
    required this.attemptId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final resultAsync = ref.watch(practiceResultProvider(attemptId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: Text(
          'Practice Scorecard',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.onSurface),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.onSurface),
          onPressed: () => context.go('/practice'),
        ),
      ),
      body: resultAsync.when(
        loading: () => const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: AppColors.primary),
              SizedBox(height: 16),
              Text('Calculating your official score...'),
            ],
          ),
        ),
        error: (err, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
                const SizedBox(height: 16),
                Text('Failed to load result: $err', textAlign: TextAlign.center),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => ref.invalidate(practiceResultProvider(attemptId)),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
        data: (result) {
          final isHighPass = result.accuracyPercentage >= 70;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Hero Score Banner
                SipsCard(
                  hasGlow: true,
                  padding: const EdgeInsets.all(22),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          SipsBadge(
                            label: result.category,
                            icon: Icons.category_rounded,
                            variant: SipsBadgeVariant.neutral,
                          ),
                          SipsBadge(
                            label: isHighPass ? 'Great Mastery' : 'Needs Practice',
                            icon: isHighPass ? Icons.stars_rounded : Icons.info_outline_rounded,
                            variant: isHighPass ? SipsBadgeVariant.emerald : SipsBadgeVariant.amber,
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Text(
                        '${result.score.toStringAsFixed(0)} / ${result.totalMarks.toStringAsFixed(0)}',
                        style: GoogleFonts.inter(
                          fontSize: 38,
                          fontWeight: FontWeight.w900,
                          color: isHighPass ? AppColors.emeraldDark : AppColors.primary,
                        ),
                      ),
                      Text(
                        'Accuracy: ${result.accuracyPercentage.toStringAsFixed(0)}%',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Divider(height: 1, color: AppColors.borderStroke),
                      const SizedBox(height: 14),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildStatItem('Correct', '${result.correctCount}', Icons.check_circle_rounded, AppColors.emerald),
                          _buildStatItem('Incorrect', '${result.totalQuestions - result.correctCount}', Icons.cancel_rounded, AppColors.error),
                          _buildStatItem('Total Qs', '${result.totalQuestions}', Icons.format_list_numbered_rounded, AppColors.primary),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // 2. Solutions & Detailed Explanations
                const SectionHeader(
                  title: 'Question-by-Question Review',
                  subtitle: 'Inspect answer keys and step-by-step explanations',
                ),

                const SizedBox(height: 12),

                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: result.questions.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (ctx, idx) {
                    final q = result.questions[idx];
                    return _buildQuestionReviewCard(idx + 1, q);
                  },
                ),

                const SizedBox(height: 32),

                // 3. Action Buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => context.go('/practice'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: const Text('Back to Hub'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => context.go('/practice'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                        child: Text(
                          'Practice Another',
                          style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.onSurface)),
            Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.onSurfaceVariant)),
          ],
        ),
      ],
    );
  }

  Widget _buildQuestionReviewCard(int qNumber, QuestionResultItem item) {
    final isCorrect = item.isCorrect;

    return SipsCard(
      padding: const EdgeInsets.all(16),
      child: ExpansionTile(
        tilePadding: EdgeInsets.zero,
        childrenPadding: const EdgeInsets.only(top: 12),
        leading: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: isCorrect ? AppColors.emerald.withValues(alpha: 0.15) : AppColors.error.withValues(alpha: 0.15),
            shape: BoxShape.circle,
          ),
          child: Icon(
            isCorrect ? Icons.check_rounded : Icons.close_rounded,
            color: isCorrect ? AppColors.emeraldDark : AppColors.error,
            size: 18,
          ),
        ),
        title: Text(
          'Q$qNumber: ${item.title}',
          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.onSurface),
        ),
        subtitle: Text(
          isCorrect ? 'Correct (+${item.marksAwarded.toStringAsFixed(0)} marks)' : 'Incorrect (0 marks)',
          style: GoogleFonts.inter(
            fontSize: 12,
            color: isCorrect ? AppColors.emeraldDark : AppColors.error,
            fontWeight: FontWeight.w600,
          ),
        ),
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              item.statement,
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.onSurface, height: 1.4),
            ),
          ),
          const SizedBox(height: 12),

          // Chosen vs Correct Answer Pill
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text('Your Answer: ', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    Text(
                      item.chosenOptionId ?? 'None (Skipped)',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isCorrect ? AppColors.emeraldDark : AppColors.error,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Text('Correct Answer: ', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    Text(
                      item.correctOptionId ?? 'N/A',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.emeraldDark),
                    ),
                  ],
                ),
              ],
            ),
          ),

          if (item.explanation != null && item.explanation!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.info_outline_rounded, size: 16, color: AppColors.primary),
                      const SizedBox(width: 6),
                      Text('Explanation', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.explanation!,
                    style: GoogleFonts.inter(fontSize: 12, color: AppColors.onSurface, height: 1.4),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
