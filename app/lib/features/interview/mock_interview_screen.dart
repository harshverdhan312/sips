import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/widgets/sips_badge.dart';
import '../../core/widgets/sips_button.dart';
import '../../core/widgets/sips_card.dart';
import '../../core/widgets/sips_text_field.dart';
import '../../providers/sips_providers.dart';

class MockInterviewScreen extends ConsumerStatefulWidget {
  const MockInterviewScreen({super.key});

  @override
  ConsumerState<MockInterviewScreen> createState() => _MockInterviewScreenState();
}

class _MockInterviewScreenState extends ConsumerState<MockInterviewScreen> {
  Timer? _timer;
  int _seconds = 14 * 60 + 35; // 14:35 countdown
  final _answerController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (mounted && _seconds > 0) {
        setState(() => _seconds--);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _answerController.dispose();
    super.dispose();
  }

  String _formatTimer(int totalSeconds) {
    final minutes = (totalSeconds ~/ 60).toString().padLeft(2, '0');
    final seconds = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(interviewSessionProvider);
    final currentQ = session.questions.isNotEmpty
        ? session.questions[session.currentQuestionIndex.clamp(0, session.questions.length - 1)]
        : null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => context.pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Technical Mock Panel',
              style: GoogleFonts.plusJakartaSans(fontSize: 15, fontWeight: FontWeight.w700),
            ),
            Text(
              'Session #4 • SDE-1 Tier-1 Standard',
              style: GoogleFonts.plusJakartaSans(fontSize: 10, color: AppColors.onSurfaceVariant),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFFEE2E2),
              borderRadius: AppRadius.fullRadius,
            ),
            child: Row(
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: Color(0xFFDC2626),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  _formatTimer(_seconds),
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF991B1B),
                    fontFeatures: const [FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: currentQ == null
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Question Header & Tag
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            SipsBadge(
                              label: 'QUESTION ${session.currentQuestionIndex + 1} OF ${session.questions.length}',
                              variant: SipsBadgeVariant.primary,
                              isSmall: true,
                            ),
                            Text(
                              currentQ.category,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppColors.outline,
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 12),

                        // Question Prompt Card
                        SipsCard(
                          hasGlow: true,
                          padding: const EdgeInsets.all(18),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                currentQ.title,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.onSurface,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                currentQ.prompt,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 13,
                                  color: AppColors.onSurfaceVariant,
                                  height: 1.45,
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Video / Voice Simulator Box
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceContainerLowest,
                            borderRadius: AppRadius.xlRadius,
                            border: Border.all(color: AppColors.borderStroke, width: 1),
                          ),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  Container(
                                    width: 32,
                                    height: 32,
                                    decoration: BoxDecoration(
                                      color: AppColors.primaryFixed,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Center(
                                      child: Text(
                                        'AI',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.onPrimaryFixed,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'SIPS Diagnostic Telemetry Listener',
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.onSurface,
                                          ),
                                        ),
                                        Text(
                                          session.isRecording ? 'Listening & Analyzing Speech STAR Structure...' : 'Microphone Muted',
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 10,
                                            color: session.isRecording ? AppColors.emerald : AppColors.outline,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    icon: Icon(
                                      session.isRecording ? Icons.mic_rounded : Icons.mic_off_rounded,
                                      color: session.isRecording ? AppColors.primary : AppColors.error,
                                      size: 20,
                                    ),
                                    onPressed: () => ref.read(interviewSessionProvider.notifier).toggleRecording(),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              // Waveform Visualizer
                              Container(
                                height: 32,
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceContainerLow,
                                  borderRadius: AppRadius.mdRadius,
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                  children: List.generate(
                                    24,
                                    (i) => Container(
                                      width: 3,
                                      height: ((i * 7) % 22 + 6).toDouble(),
                                      decoration: BoxDecoration(
                                        color: session.isRecording
                                            ? AppColors.primary.withValues(alpha: 0.7)
                                            : AppColors.outlineVariant,
                                        borderRadius: AppRadius.fullRadius,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Key Talking Points (Hints / Rubric)
                        Text(
                          'Evaluation Rubric & Key Points',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.onSurface,
                          ),
                        ),
                        const SizedBox(height: 8),
                        SipsCard(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            children: currentQ.keyTalkingPoints.map((point) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 6),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Icon(Icons.check_circle_outline_rounded,
                                        size: 14, color: AppColors.secondary),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        point,
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
                        ),

                        const SizedBox(height: 16),

                        // Real-time Candidate Notes / Code Input
                        SipsTextField(
                          label: 'Live Notes & Structured Response',
                          hint: 'Type your architectural decomposition or pseudocode notes...',
                          controller: _answerController..text = currentQ.userNotesOrAnswer,
                          maxLines: 4,
                          onChanged: (val) {
                            ref.read(interviewSessionProvider.notifier).updateAnswerNotes(val);
                          },
                        ),
                      ],
                    ),
                  ),
                ),

                // Bottom Navigation Action Bar
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(
                    color: AppColors.surfaceContainerLowest,
                    border: Border(top: BorderSide(color: AppColors.borderStroke, width: 1)),
                  ),
                  child: Row(
                    children: [
                      if (session.currentQuestionIndex > 0) ...[
                        SipsButton(
                          label: 'Previous',
                          variant: SipsButtonVariant.outline,
                          onPressed: () =>
                              ref.read(interviewSessionProvider.notifier).previousQuestion(),
                        ),
                        const SizedBox(width: 10),
                      ],
                      Expanded(
                        child: SipsButton(
                          label: session.currentQuestionIndex == session.questions.length - 1
                              ? 'Finish & View Diagnostic'
                              : 'Next Question',
                          isFullWidth: true,
                          size: SipsButtonSize.large,
                          trailingIcon: Icons.arrow_forward_rounded,
                          onPressed: () {
                            if (session.currentQuestionIndex < session.questions.length - 1) {
                              ref.read(interviewSessionProvider.notifier).nextQuestion();
                            } else {
                              context.push('/interview-diagnostic');
                            }
                          },
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
