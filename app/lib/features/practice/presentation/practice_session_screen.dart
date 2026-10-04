import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../app/theme/app_colors.dart';
import '../../../core/widgets/sips_badge.dart';
import '../../../core/widgets/sips_card.dart';
import '../providers/practice_providers.dart';

class PracticeSessionScreen extends ConsumerWidget {
  final String attemptId;

  const PracticeSessionScreen({
    super.key,
    required this.attemptId,
  });

  void _confirmFinish(BuildContext context, WidgetRef ref, PracticeSessionState state) {
    final unanswered = state.totalQuestions - state.answeredCount;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          'Submit Practice Set?',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'You have answered ${state.answeredCount} out of ${state.totalQuestions} questions.',
              style: GoogleFonts.inter(fontSize: 14, color: AppColors.onSurfaceVariant),
            ),
            if (unanswered > 0) ...[
              const SizedBox(height: 8),
              Text(
                '⚠️ $unanswered questions are still unanswered.',
                style: GoogleFonts.inter(fontSize: 13, color: AppColors.amberDark, fontWeight: FontWeight.w600),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Review More', style: GoogleFonts.inter(color: AppColors.onSurfaceVariant)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await ref.read(practiceSessionProvider(attemptId).notifier).submit();
              if (success && context.mounted) {
                context.pushReplacement('/practice/result/$attemptId');
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('Submit Now', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(practiceSessionProvider(attemptId));
    final notifier = ref.read(practiceSessionProvider(attemptId).notifier);

    if (state.isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: AppColors.primary),
              SizedBox(height: 16),
              Text('Delivering practice questions...'),
            ],
          ),
        ),
      );
    }

    if (state.error != null && state.questions.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('Practice Set')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
                const SizedBox(height: 16),
                Text(state.error!, textAlign: TextAlign.center),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => notifier.loadSession(),
                  child: const Text('Try Again'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final currentQ = state.currentQuestion;
    if (currentQ == null) {
      return const Scaffold(body: Center(child: Text('No questions found.')));
    }

    final selectedOptId = state.answers[currentQ.questionVersionId];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: AppColors.onSurface),
          onPressed: () {
            showDialog(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text('Leave Practice Session?'),
                content: const Text('Your saved answers will remain saved, and you can resume anytime.'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                  TextButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      context.pop();
                    },
                    child: const Text('Leave', style: TextStyle(color: AppColors.error)),
                  ),
                ],
              ),
            );
          },
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Question ${state.currentIndex + 1}/${state.totalQuestions}',
              style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.onSurface),
            ),
            if (state.isSaving) ...[
              const SizedBox(width: 8),
              const SizedBox(
                width: 12,
                height: 12,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => _confirmFinish(context, ref, state),
            child: Text(
              'Finish',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: AppColors.primary),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Top Progress Bar
          LinearProgressIndicator(
            value: (state.currentIndex + 1) / state.totalQuestions,
            backgroundColor: AppColors.surfaceContainerLow,
            color: AppColors.primary,
            minHeight: 4,
          ),

          // Horizontal Question Carousel Navigator Pills
          Container(
            height: 52,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: state.totalQuestions,
              separatorBuilder: (context, index) => const SizedBox(width: 8),
              itemBuilder: (ctx, i) {
                final isCurrent = i == state.currentIndex;
                final qvId = state.questions[i].questionVersionId;
                final isAnswered = state.answers.containsKey(qvId);

                return InkWell(
                  onTap: () => notifier.goToQuestion(i),
                  borderRadius: BorderRadius.circular(18),
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: isCurrent
                          ? AppColors.primary
                          : (isAnswered ? AppColors.emerald.withValues(alpha: 0.15) : AppColors.surfaceContainerLow),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: isCurrent
                            ? AppColors.primary
                            : (isAnswered ? AppColors.emerald : Colors.transparent),
                        width: 1.5,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        '${i + 1}',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: isCurrent || isAnswered ? FontWeight.bold : FontWeight.w500,
                          color: isCurrent
                              ? Colors.white
                              : (isAnswered ? AppColors.emeraldDark : AppColors.onSurfaceVariant),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          const Divider(height: 1, color: AppColors.borderStroke),

          // Main Question Card & Options
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Meta Pill & Difficulty
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      SipsBadge(
                        label: currentQ.category,
                        icon: Icons.category_rounded,
                        variant: SipsBadgeVariant.neutral,
                      ),
                      SipsBadge(
                        label: currentQ.difficulty,
                        variant: currentQ.difficulty == 'EASY'
                            ? SipsBadgeVariant.emerald
                            : (currentQ.difficulty == 'HARD' ? SipsBadgeVariant.error : SipsBadgeVariant.amber),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Question Title & Statement
                  SipsCard(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          currentQ.title,
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.onSurface,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          currentQ.statement,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            height: 1.5,
                            color: AppColors.onSurface,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  Text(
                    'Select Answer',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Options List
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: currentQ.options.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 10),
                    itemBuilder: (ctx, idx) {
                      final opt = currentQ.options[idx];
                      final isSelected = selectedOptId == opt.id;

                      return InkWell(
                        onTap: () {
                          notifier.selectOption(currentQ.questionVersionId, opt.id);
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.primary.withValues(alpha: 0.08) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSelected ? AppColors.primary : AppColors.borderStroke,
                              width: isSelected ? 2.0 : 1.0,
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: isSelected ? AppColors.primary : AppColors.surfaceContainerLow,
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    opt.id,
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: isSelected ? Colors.white : AppColors.onSurfaceVariant,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Text(
                                  opt.text,
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                    color: isSelected ? AppColors.primary : AppColors.onSurface,
                                  ),
                                ),
                              ),
                              if (isSelected)
                                const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 20),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),

          // Bottom Bar (Previous / Next / Finish)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  offset: const Offset(0, -2),
                  blurRadius: 10,
                ),
              ],
            ),
            child: Row(
              children: [
                // Previous
                Expanded(
                  child: OutlinedButton(
                    onPressed: state.currentIndex > 0 ? notifier.previousQuestion : null,
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Previous'),
                  ),
                ),
                const SizedBox(width: 12),
                // Next or Finish
                Expanded(
                  child: ElevatedButton(
                    onPressed: state.currentIndex < state.totalQuestions - 1
                        ? notifier.nextQuestion
                        : () => _confirmFinish(context, ref, state),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      elevation: 0,
                    ),
                    child: Text(
                      state.currentIndex < state.totalQuestions - 1 ? 'Next' : 'Submit',
                      style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
