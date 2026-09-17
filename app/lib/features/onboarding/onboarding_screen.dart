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
import '../../models/student_profile.dart';
import '../../providers/sips_providers.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  int _currentStep = 0;

  final _nameController = TextEditingController();
  final _collegeController = TextEditingController();
  final _branchController = TextEditingController();
  final _cgpaController = TextEditingController();
  final _leetcodeController = TextEditingController();
  final _githubController = TextEditingController();

  final List<String> _availableRoles = [
    'Software Development Engineer (SDE-1)',
    'Distributed Systems Engineer',
    'Full Stack Web Developer',
    'Cloud & DevOps Engineer',
    'Data Platform Engineer',
    'Mobile Application Engineer',
  ];

  final Set<String> _selectedRoles = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final profile = ref.read(studentProfileProvider).value;
      if (profile != null) {
        if (profile.name.isNotEmpty) _nameController.text = profile.name;
        if (profile.college.isNotEmpty) _collegeController.text = profile.college;
        if (profile.branch.isNotEmpty) _branchController.text = profile.branch;
        if (profile.cgpa > 0) _cgpaController.text = profile.cgpa.toString();
        if (profile.githubHandle.isNotEmpty) _githubController.text = profile.githubHandle;
        if (profile.leetcodeHandle.isNotEmpty) _leetcodeController.text = profile.leetcodeHandle;
        if (profile.targetRoles.isNotEmpty) {
          setState(() {
            _selectedRoles.addAll(profile.targetRoles);
          });
        }
      }
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _collegeController.dispose();
    _branchController.dispose();
    _cgpaController.dispose();
    _leetcodeController.dispose();
    _githubController.dispose();
    super.dispose();
  }

  void _handleComplete() {
    final authState = ref.read(authProvider);
    final existingProfile = ref.read(studentProfileProvider).value;
    final baseProfile = existingProfile ?? const StudentProfile();
    final updatedProfile = baseProfile.copyWith(
      name: _nameController.text.trim().isNotEmpty ? _nameController.text.trim() : baseProfile.name,
      email: authState.userEmail.isNotEmpty ? authState.userEmail : baseProfile.email,
      college: _collegeController.text.trim(),
      branch: _branchController.text.trim(),
      cgpa: double.tryParse(_cgpaController.text.trim()) ?? baseProfile.cgpa,
      targetRoles: _selectedRoles.toList(),
      leetcodeHandle: _leetcodeController.text.trim(),
      githubHandle: _githubController.text.trim(),
    );

    ref.read(studentProfileProvider.notifier).updateProfile(updatedProfile);
    ref.read(authProvider.notifier).completeOnboarding();
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: _currentStep > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: () => setState(() => _currentStep--),
              )
            : IconButton(
                icon: const Icon(Icons.close_rounded),
                onPressed: () => context.go('/welcome'),
              ),
        title: Text('Step ${_currentStep + 1} of 3'),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Progress Bar
            LinearProgressIndicator(
              value: (_currentStep + 1) / 3,
              backgroundColor: AppColors.surfaceContainer,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
              minHeight: 3,
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                child: _buildStepContent(),
              ),
            ),
            // Bottom Action Bar
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppColors.surfaceContainerLowest,
                border: Border(top: BorderSide(color: AppColors.borderStroke, width: 1)),
              ),
              child: Row(
                children: [
                  if (_currentStep > 0) ...[
                    SipsButton(
                      label: 'Back',
                      variant: SipsButtonVariant.outline,
                      onPressed: () => setState(() => _currentStep--),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    child: SipsButton(
                      label: _currentStep == 2 ? 'Calculate Baseline Readiness' : 'Continue',
                      isFullWidth: true,
                      size: SipsButtonSize.large,
                      trailingIcon: _currentStep == 2 ? Icons.insights_rounded : Icons.arrow_forward_rounded,
                      onPressed: () {
                        if (_currentStep < 2) {
                          setState(() => _currentStep++);
                        } else {
                          _handleComplete();
                        }
                      },
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

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildStep1Academic();
      case 1:
        return _buildStep2TargetRoles();
      case 2:
        return _buildStep3Telemetry();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildStep1Academic() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SipsBadge(
          label: 'ACADEMIC VERIFICATION',
          variant: SipsBadgeVariant.primary,
          isSmall: true,
        ),
        const SizedBox(height: 12),
        Text(
          'Candidate Profile & College Credentials',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: AppColors.onSurface,
            letterSpacing: -0.4,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'This establishes your placement cell eligibility criteria and Tier-1 shortlisting filters.',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 13,
            color: AppColors.onSurfaceVariant,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 20),
        SipsCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            children: [
              SipsTextField(
                label: 'Full Name',
                controller: _nameController,
                prefixIcon: Icons.person_outline_rounded,
              ),
              const SizedBox(height: 14),
              SipsTextField(
                label: 'Engineering College / Institute',
                controller: _collegeController,
                prefixIcon: Icons.school_outlined,
              ),
              const SizedBox(height: 14),
              SipsTextField(
                label: 'Branch / Department',
                controller: _branchController,
                prefixIcon: Icons.account_tree_outlined,
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: SipsTextField(
                      label: 'Current CGPA',
                      controller: _cgpaController,
                      prefixIcon: Icons.grade_outlined,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: SipsTextField(
                      label: 'Active Backlogs',
                      controller: TextEditingController(text: '0'),
                      enabled: false,
                      prefixIcon: Icons.check_circle_outline,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStep2TargetRoles() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SipsBadge(
          label: 'CAREER VECTORS',
          variant: SipsBadgeVariant.secondary,
          isSmall: true,
        ),
        const SizedBox(height: 12),
        Text(
          'Select Your Dream Target Roles',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: AppColors.onSurface,
            letterSpacing: -0.4,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'SIPS AI evaluates your skill gap specifically against the rubric of your selected roles.',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 13,
            color: AppColors.onSurfaceVariant,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 20),
        Column(
          children: _availableRoles.map((role) {
            final isSelected = _selectedRoles.contains(role);
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: SipsCard(
                color: isSelected ? const Color(0xFFEEF2FF) : AppColors.surfaceContainerLowest,
                borderColor: isSelected ? AppColors.primary : AppColors.outlineVariant,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                onTap: () {
                  setState(() {
                    if (isSelected) {
                      _selectedRoles.remove(role);
                    } else {
                      _selectedRoles.add(role);
                    }
                  });
                },
                child: Row(
                  children: [
                    Icon(
                      isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                      color: isSelected ? AppColors.primary : AppColors.outline,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        role,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected ? AppColors.primary : AppColors.onSurface,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildStep3Telemetry() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SipsBadge(
          label: 'TELEMETRY SYNC',
          variant: SipsBadgeVariant.emerald,
          isSmall: true,
        ),
        const SizedBox(height: 12),
        Text(
          'Sync Coding & Resume Telemetry',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: AppColors.onSurface,
            letterSpacing: -0.4,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Connect handles to calculate real-time technical depth and automated ATS parse readiness.',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 13,
            color: AppColors.onSurfaceVariant,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 20),
        SipsCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            children: [
              SipsTextField(
                label: 'LeetCode Username',
                controller: _leetcodeController,
                prefixIcon: Icons.code_rounded,
              ),
              const SizedBox(height: 14),
              SipsTextField(
                label: 'GitHub Profile Handle',
                controller: _githubController,
                prefixIcon: Icons.terminal_rounded,
              ),
              const SizedBox(height: 20),
              Builder(
                builder: (context) {
                  final profile = ref.watch(studentProfileProvider).value;
                  final hasResume = profile != null && profile.resumeUrl.isNotEmpty;
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerLow,
                      borderRadius: AppRadius.lgRadius,
                      border: Border.all(
                        color: hasResume ? AppColors.emerald.withValues(alpha: 0.3) : AppColors.outlineVariant,
                        width: 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: hasResume ? const Color(0xFFD1FAE5) : AppColors.surfaceContainerHigh,
                            borderRadius: AppRadius.mdRadius,
                          ),
                          child: Icon(
                            Icons.description_rounded,
                            color: hasResume ? AppColors.emerald : AppColors.onSurfaceVariant,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                hasResume ? (profile.resumeVersion.isNotEmpty ? profile.resumeVersion : 'Resume Attached') : 'No Resume Uploaded',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.onSurface,
                                ),
                              ),
                              Text(
                                hasResume
                                    ? (profile.resumeScore > 0 ? 'Resume Score: ${profile.resumeScore.round()}/100' : 'Uploaded to student profile')
                                    : 'Upload your PDF resume anytime from Profile',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 11,
                                  color: hasResume ? const Color(0xFF059669) : AppColors.onSurfaceVariant,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          hasResume ? Icons.check_circle_rounded : Icons.info_outline_rounded,
                          color: hasResume ? const Color(0xFF10B981) : AppColors.outline,
                          size: 20,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}
