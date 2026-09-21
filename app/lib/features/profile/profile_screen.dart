import 'dart:io' as io;
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/sips_badge.dart';
import '../../core/widgets/sips_button.dart';
import '../../core/widgets/sips_card.dart';
import '../../core/widgets/skill_chip.dart';
import '../../models/student_profile.dart';
import '../../providers/sips_providers.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _isUploadingResume = false;

  Future<void> _handleResumeUpload(StudentProfile profile) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
        withData: true,
      );

      if (result == null || result.files.isEmpty) {
        return;
      }

      final file = result.files.first;

      // Validate file extension
      final ext = file.extension?.toLowerCase();
      if (ext != 'pdf') {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Invalid file format. Only PDF resumes are supported.'),
            backgroundColor: AppColors.error,
          ),
        );
        return;
      }

      // Validate 5 MB limit (5 * 1024 * 1024 bytes)
      const maxSizeBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('File size exceeds 5MB limit. Please upload a smaller PDF.'),
            backgroundColor: AppColors.error,
          ),
        );
        return;
      }

      // Extract bytes
      List<int>? bytes = file.bytes;
      if (bytes == null && !kIsWeb && file.path != null) {
        bytes = await io.File(file.path!).readAsBytes();
      }

      if (bytes == null || bytes.isEmpty) {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Could not read file content. Please try again.'),
            backgroundColor: AppColors.error,
          ),
        );
        return;
      }

      setState(() => _isUploadingResume = true);

      await ref.read(studentProfileProvider.notifier).uploadResume(bytes, file.name);

      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text('Resume "${file.name}" uploaded successfully!'),
          backgroundColor: const Color(0xFF047857),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text('Resume upload failed: ${e.toString()}'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isUploadingResume = false);
      }
    }
  }

  Future<void> _showEditGithubDialog(BuildContext context, StudentProfile profile) async {
    final controller = TextEditingController(text: profile.githubHandle);
    final messenger = ScaffoldMessenger.of(context);
    bool isSaving = false;

    await showDialog(
      context: context,
      builder: (dialogCtx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: AppColors.surface,
              shape: RoundedRectangleBorder(borderRadius: AppRadius.xlRadius),
              title: Row(
                children: [
                  const Icon(Icons.terminal_rounded, color: AppColors.primary, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    'Edit GitHub Handle',
                    style: GoogleFonts.plusJakartaSans(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                      color: AppColors.onSurface,
                    ),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Connected handle used for telemetry analysis and campus drive verification.',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: controller,
                    autofocus: true,
                    enabled: !isSaving,
                    decoration: InputDecoration(
                      hintText: 'e.g. username',
                      prefixText: 'github.com/ ',
                      prefixStyle: GoogleFonts.plusJakartaSans(
                        color: AppColors.outline,
                        fontWeight: FontWeight.w600,
                      ),
                      filled: true,
                      fillColor: AppColors.surfaceContainerLow,
                      border: OutlineInputBorder(
                        borderRadius: AppRadius.mdRadius,
                        borderSide: const BorderSide(color: AppColors.outlineVariant),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: AppRadius.mdRadius,
                        borderSide: const BorderSide(color: AppColors.outlineVariant),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: AppRadius.mdRadius,
                        borderSide: const BorderSide(color: AppColors.primary, width: 2),
                      ),
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: isSaving ? null : () => Navigator.of(dialogCtx).pop(),
                  child: Text(
                    'Cancel',
                    style: GoogleFonts.plusJakartaSans(color: AppColors.outline),
                  ),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: AppRadius.mdRadius),
                  ),
                  onPressed: isSaving
                      ? null
                      : () async {
                          final newHandle = controller.text.trim();
                          setDialogState(() => isSaving = true);
                          try {
                            final updated = profile.copyWith(githubHandle: newHandle);
                            await ref.read(studentProfileProvider.notifier).updateProfile(updated);
                            if (dialogCtx.mounted) {
                              Navigator.of(dialogCtx).pop();
                            }
                            if (mounted) {
                              messenger.showSnackBar(
                                const SnackBar(
                                  content: Text('GitHub handle updated successfully!'),
                                  backgroundColor: Color(0xFF047857),
                                ),
                              );
                            }
                          } catch (e) {
                            setDialogState(() => isSaving = false);
                            if (mounted) {
                              messenger.showSnackBar(
                                SnackBar(
                                  content: Text('Update failed: ${e.toString()}'),
                                  backgroundColor: AppColors.error,
                                ),
                              );
                            }
                          }
                        },
                  child: isSaving
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(
                          'Save',
                          style: GoogleFonts.plusJakartaSans(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _showEditSkillsDialog(BuildContext context, StudentProfile profile) async {
    final List<String> currentSkills = List<String>.from(profile.skills);
    final textController = TextEditingController();
    final messenger = ScaffoldMessenger.of(context);
    bool isSaving = false;

    await showDialog(
      context: context,
      builder: (dialogCtx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: AppColors.surface,
              shape: RoundedRectangleBorder(borderRadius: AppRadius.xlRadius),
              title: Row(
                children: [
                  const Icon(Icons.code_rounded, color: AppColors.primary, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    'Edit Verified Skills',
                    style: GoogleFonts.plusJakartaSans(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                      color: AppColors.onSurface,
                    ),
                  ),
                ],
              ),
              content: SizedBox(
                width: double.maxFinite,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Skills are synchronized with the matching engine to compute drive eligibility.',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: textController,
                              enabled: !isSaving,
                              decoration: InputDecoration(
                                hintText: 'Add skill (e.g. Flutter, Go)',
                                isDense: true,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                filled: true,
                                fillColor: AppColors.surfaceContainerLow,
                                border: OutlineInputBorder(
                                  borderRadius: AppRadius.mdRadius,
                                  borderSide: const BorderSide(color: AppColors.outlineVariant),
                                ),
                              ),
                              onSubmitted: (val) {
                                final trimmed = val.trim();
                                if (trimmed.isNotEmpty && !currentSkills.contains(trimmed)) {
                                  setDialogState(() {
                                    currentSkills.add(trimmed);
                                    textController.clear();
                                  });
                                }
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            style: IconButton.styleFrom(
                              backgroundColor: AppColors.primaryFixed,
                              foregroundColor: AppColors.onPrimaryFixed,
                            ),
                            icon: const Icon(Icons.add, size: 20),
                            onPressed: isSaving
                                ? null
                                : () {
                                    final trimmed = textController.text.trim();
                                    if (trimmed.isNotEmpty && !currentSkills.contains(trimmed)) {
                                      setDialogState(() {
                                        currentSkills.add(trimmed);
                                        textController.clear();
                                      });
                                    }
                                  },
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: currentSkills.map((skill) {
                          return Chip(
                            label: Text(
                              skill,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            deleteIcon: const Icon(Icons.close, size: 14),
                            onDeleted: isSaving
                                ? null
                                : () {
                                    setDialogState(() {
                                      currentSkills.remove(skill);
                                    });
                                  },
                            backgroundColor: AppColors.surfaceContainerLow,
                            shape: RoundedRectangleBorder(
                              borderRadius: AppRadius.smRadius,
                              side: const BorderSide(color: AppColors.outlineVariant),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: isSaving ? null : () => Navigator.of(dialogCtx).pop(),
                  child: Text(
                    'Cancel',
                    style: GoogleFonts.plusJakartaSans(color: AppColors.outline),
                  ),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: AppRadius.mdRadius),
                  ),
                  onPressed: isSaving
                      ? null
                      : () async {
                          setDialogState(() => isSaving = true);
                          try {
                            final updated = profile.copyWith(skills: currentSkills);
                            await ref.read(studentProfileProvider.notifier).updateProfile(updated);
                            // Refresh readiness & opportunities to reflect skill recalculations
                            ref.read(readinessProvider.notifier).loadReadiness();
                            ref.read(opportunitiesProvider.notifier).loadJobs();

                            if (dialogCtx.mounted) {
                              Navigator.of(dialogCtx).pop();
                            }
                            if (mounted) {
                              messenger.showSnackBar(
                                const SnackBar(
                                  content: Text('Technical skills updated & recalculated!'),
                                  backgroundColor: Color(0xFF047857),
                                ),
                              );
                            }
                          } catch (e) {
                            setDialogState(() => isSaving = false);
                            if (mounted) {
                              messenger.showSnackBar(
                                SnackBar(
                                  content: Text('Update failed: ${e.toString()}'),
                                  backgroundColor: AppColors.error,
                                ),
                              );
                            }
                          }
                        },
                  child: isSaving
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(
                          'Save Skills',
                          style: GoogleFonts.plusJakartaSans(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _showEditPlacementDialog(BuildContext context, StudentProfile profile) async {
    final ageCtrl = TextEditingController(text: profile.age?.toString() ?? '');
    final internshipsCtrl = TextEditingController(text: profile.internships?.toString() ?? '');
    final backlogsCtrl = TextEditingController(text: profile.historyOfBacklogs?.toString() ?? '');
    String hostelSelection = profile.hostel == true ? 'true' : (profile.hostel == false ? 'false' : 'unset');
    final messenger = ScaffoldMessenger.of(context);
    bool isSaving = false;

    await showDialog(
      context: context,
      builder: (dialogCtx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: AppColors.surface,
              shape: RoundedRectangleBorder(borderRadius: AppRadius.xlRadius),
              title: Row(
                children: [
                  const Icon(Icons.badge_outlined, color: AppColors.primary, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    'Placement Information',
                    style: GoogleFonts.plusJakartaSans(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                      color: AppColors.onSurface,
                    ),
                  ),
                ],
              ),
              content: SizedBox(
                width: double.maxFinite,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Attributes used for calibrated readiness scoring and institutional drives.',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Age
                      Text('Age (Years)', style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.onSurface)),
                      const SizedBox(height: 4),
                      TextField(
                        controller: ageCtrl,
                        keyboardType: TextInputType.number,
                        enabled: !isSaving,
                        decoration: InputDecoration(
                          hintText: 'e.g. 21',
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          filled: true,
                          fillColor: AppColors.surfaceContainerLow,
                          border: OutlineInputBorder(
                            borderRadius: AppRadius.mdRadius,
                            borderSide: const BorderSide(color: AppColors.outlineVariant),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      // Internships
                      Text('Internships Completed', style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.onSurface)),
                      const SizedBox(height: 4),
                      TextField(
                        controller: internshipsCtrl,
                        keyboardType: TextInputType.number,
                        enabled: !isSaving,
                        decoration: InputDecoration(
                          hintText: 'e.g. 1',
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          filled: true,
                          fillColor: AppColors.surfaceContainerLow,
                          border: OutlineInputBorder(
                            borderRadius: AppRadius.mdRadius,
                            borderSide: const BorderSide(color: AppColors.outlineVariant),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      // Hostel Status
                      Text('Accommodation Status', style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.onSurface)),
                      const SizedBox(height: 4),
                      DropdownButtonFormField<String>(
                        initialValue: hostelSelection,
                        onChanged: isSaving ? null : (val) => setDialogState(() => hostelSelection = val ?? 'unset'),
                        decoration: InputDecoration(
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          filled: true,
                          fillColor: AppColors.surfaceContainerLow,
                          border: OutlineInputBorder(
                            borderRadius: AppRadius.mdRadius,
                            borderSide: const BorderSide(color: AppColors.outlineVariant),
                          ),
                        ),
                        items: const [
                          DropdownMenuItem(value: 'unset', child: Text('Unset / Not Specified')),
                          DropdownMenuItem(value: 'true', child: Text('Hostel Resident')),
                          DropdownMenuItem(value: 'false', child: Text('Day Scholar')),
                        ],
                      ),
                      const SizedBox(height: 12),
                      // History of Backlogs
                      Text('History of Backlogs', style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.onSurface)),
                      const SizedBox(height: 4),
                      TextField(
                        controller: backlogsCtrl,
                        keyboardType: TextInputType.number,
                        enabled: !isSaving,
                        decoration: InputDecoration(
                          hintText: 'e.g. 0',
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          filled: true,
                          fillColor: AppColors.surfaceContainerLow,
                          border: OutlineInputBorder(
                            borderRadius: AppRadius.mdRadius,
                            borderSide: const BorderSide(color: AppColors.outlineVariant),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: isSaving ? null : () => Navigator.of(dialogCtx).pop(),
                  child: Text('Cancel', style: GoogleFonts.plusJakartaSans(color: AppColors.outline)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: AppRadius.mdRadius),
                  ),
                  onPressed: isSaving
                      ? null
                      : () async {
                          final ageText = ageCtrl.text.trim();
                          int? parsedAge;
                          if (ageText.isNotEmpty) {
                            parsedAge = int.tryParse(ageText);
                            if (parsedAge == null || parsedAge < 16 || parsedAge > 100) {
                              messenger.showSnackBar(
                                const SnackBar(
                                  content: Text('Invalid age: Must be an integer between 16 and 100.'),
                                  backgroundColor: AppColors.error,
                                ),
                              );
                              return;
                            }
                          }

                          final internText = internshipsCtrl.text.trim();
                          int? parsedInternships;
                          if (internText.isNotEmpty) {
                            parsedInternships = int.tryParse(internText);
                            if (parsedInternships == null || parsedInternships < 0 || parsedInternships > 20) {
                              messenger.showSnackBar(
                                const SnackBar(
                                  content: Text('Invalid internships: Must be an integer between 0 and 20.'),
                                  backgroundColor: AppColors.error,
                                ),
                              );
                              return;
                            }
                          }

                          bool? parsedHostel;
                          if (hostelSelection == 'true') parsedHostel = true;
                          if (hostelSelection == 'false') parsedHostel = false;

                          final backlogsText = backlogsCtrl.text.trim();
                          int? parsedBacklogs;
                          if (backlogsText.isNotEmpty) {
                            parsedBacklogs = int.tryParse(backlogsText);
                            if (parsedBacklogs == null || parsedBacklogs < 0 || parsedBacklogs > 50) {
                              messenger.showSnackBar(
                                const SnackBar(
                                  content: Text('Invalid backlogs: Must be an integer between 0 and 50.'),
                                  backgroundColor: AppColors.error,
                                ),
                              );
                              return;
                            }
                          }

                          setDialogState(() => isSaving = true);
                          try {
                            final updated = profile.copyWith(
                              age: parsedAge,
                              internships: parsedInternships,
                              hostel: parsedHostel,
                              historyOfBacklogs: parsedBacklogs,
                            );
                            await ref.read(studentProfileProvider.notifier).updateProfile(updated);
                            if (dialogCtx.mounted) {
                              Navigator.of(dialogCtx).pop();
                            }
                            if (mounted) {
                              messenger.showSnackBar(
                                const SnackBar(
                                  content: Text('Placement profile updated successfully!'),
                                  backgroundColor: Color(0xFF047857),
                                ),
                              );
                            }
                          } catch (e) {
                            setDialogState(() => isSaving = false);
                            if (mounted) {
                              messenger.showSnackBar(
                                SnackBar(
                                  content: Text('Update failed: ${e.toString()}'),
                                  backgroundColor: AppColors.error,
                                ),
                              );
                            }
                          }
                        },
                  child: isSaving
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(
                          'Save',
                          style: GoogleFonts.plusJakartaSans(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(studentProfileProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 40),
              const SizedBox(height: 12),
              Text(
                'Failed to load profile',
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                  color: AppColors.onSurface,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '$err',
                style: GoogleFonts.plusJakartaSans(fontSize: 12, color: AppColors.outline),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref.read(studentProfileProvider.notifier).loadProfile(),
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (profile) {
          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Profile Hero Card
                SipsCard(
                  hasGlow: true,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              color: AppColors.primaryFixed,
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.primary.withValues(alpha: 0.3), width: 2),
                            ),
                            child: Center(
                              child: Text(
                                profile.name.isNotEmpty
                                    ? profile.name.trim().split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join().toUpperCase()
                                    : 'ST',
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.onPrimaryFixed,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        profile.name,
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.onSurface,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    const Icon(Icons.verified_rounded, color: AppColors.primary, size: 18),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  profile.email,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 12,
                                    color: AppColors.outline,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                SipsBadge(
                                  label: profile.tier.toUpperCase(),
                                  variant: profile.readinessScore >= 80
                                      ? SipsBadgeVariant.primary
                                      : (profile.readinessScore >= 60 ? SipsBadgeVariant.emerald : SipsBadgeVariant.neutral),
                                  isSmall: true,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      // Academic Credentials Grid
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceContainerLow,
                          borderRadius: AppRadius.lgRadius,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildAcademicPill('CGPA', profile.cgpa > 0 ? profile.cgpa.toStringAsFixed(2) : 'N/A', const Color(0xFF047857)),
                            Container(width: 1, height: 26, color: AppColors.outlineVariant),
                            _buildAcademicPill('Status', profile.placementStatus.isNotEmpty ? profile.placementStatus : 'Active', AppColors.onSurface),
                            Container(width: 1, height: 26, color: AppColors.outlineVariant),
                            _buildAcademicPill('Batch', profile.graduationYear.isNotEmpty ? profile.graduationYear : 'N/A', AppColors.primary),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // College & Department Info
                SectionHeader(title: 'Institute Verification'),
                const SizedBox(height: 8),
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildInfoRow(Icons.school_outlined, 'College / Institute', profile.college.isNotEmpty ? profile.college : 'Not specified'),
                      const Divider(height: 16),
                      _buildInfoRow(Icons.account_tree_outlined, 'Department / Branch', profile.branch.isNotEmpty ? profile.branch : 'Not specified'),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Placement Profile Information
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: SectionHeader(
                        title: 'Placement Information',
                        badge: SipsBadge(
                          label: profile.age != null ? 'CONFIGURED' : 'UNSET',
                          variant: profile.age != null ? SipsBadgeVariant.emerald : SipsBadgeVariant.neutral,
                          isSmall: true,
                        ),
                      ),
                    ),
                    TextButton.icon(
                      onPressed: () => _showEditPlacementDialog(context, profile),
                      icon: const Icon(Icons.edit_note_rounded, size: 18, color: AppColors.primary),
                      label: Text(
                        'Edit Placement Info',
                        style: GoogleFonts.plusJakartaSans(
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildInfoRow(
                        Icons.calendar_today_outlined,
                        'Age',
                        profile.age != null ? '${profile.age} years' : 'Not set',
                      ),
                      const Divider(height: 16),
                      _buildInfoRow(
                        Icons.work_outline_rounded,
                        'Internships Completed',
                        profile.internships != null ? '${profile.internships} completed' : 'Not set',
                      ),
                      const Divider(height: 16),
                      _buildInfoRow(
                        Icons.home_work_outlined,
                        'Accommodation Status',
                        profile.hostel == true
                            ? 'Hostel Resident'
                            : (profile.hostel == false ? 'Day Scholar' : 'Not set'),
                      ),
                      const Divider(height: 16),
                      _buildInfoRow(
                        Icons.history_edu_rounded,
                        'History of Backlogs',
                        profile.historyOfBacklogs != null
                            ? (profile.historyOfBacklogs == 0
                                ? '0 (Clean Record)'
                                : '${profile.historyOfBacklogs} backlog(s)')
                            : 'Not set',
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Connected Telemetry Accounts
                SectionHeader(
                  title: 'Connected Accounts',
                  badge: SipsBadge(
                    label: profile.githubHandle.isNotEmpty ? 'SYNCED' : 'UNLINKED',
                    variant: profile.githubHandle.isNotEmpty ? SipsBadgeVariant.emerald : SipsBadgeVariant.neutral,
                    isSmall: true,
                  ),
                ),
                const SizedBox(height: 8),
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _buildInfoRow(
                              Icons.terminal_rounded,
                              'GitHub Profile',
                              profile.githubHandle.isNotEmpty
                                  ? profile.githubHandle
                                  : 'No handle linked',
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.primary),
                            tooltip: 'Edit GitHub Handle',
                            onPressed: () => _showEditGithubDialog(context, profile),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Verified Skills
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: SectionHeader(
                        title: 'Verified Technical Skills',
                        badge: SipsBadge(
                          label: '${profile.skills.length} VERIFIED',
                          variant: SipsBadgeVariant.emerald,
                          isSmall: true,
                        ),
                      ),
                    ),
                    TextButton.icon(
                      onPressed: () => _showEditSkillsDialog(context, profile),
                      icon: const Icon(Icons.edit_note_rounded, size: 18, color: AppColors.primary),
                      label: Text(
                        'Edit Skills',
                        style: GoogleFonts.plusJakartaSans(
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  child: profile.skills.isNotEmpty
                      ? Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: profile.skills
                              .map((s) => SkillChip(label: s, status: SkillStatus.strong))
                              .toList(),
                        )
                      : Text(
                          'No skills listed yet. Tap "Edit Skills" above to add technical skills and calculate match percentages.',
                          style: GoogleFonts.plusJakartaSans(fontSize: 12, color: AppColors.onSurfaceVariant),
                        ),
                ),

                const SizedBox(height: 20),

                // Resume Hub
                SectionHeader(title: 'Placement Resume'),
                const SizedBox(height: 8),
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: AppColors.primaryFixed,
                              borderRadius: AppRadius.mdRadius,
                            ),
                            child: const Icon(Icons.description_rounded, color: AppColors.primary, size: 24),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  profile.resumeUrl.isNotEmpty
                                      ? profile.resumeUrl.split('/').last
                                      : 'No resume uploaded yet',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.onSurface,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  profile.resumeUrl.isNotEmpty
                                      ? 'Stored on Placement Server • Ready for campus drives'
                                      : 'Upload PDF (Max 5MB) for campus drives',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 11,
                                    color: profile.resumeUrl.isNotEmpty ? const Color(0xFF047857) : AppColors.outline,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppColors.primary),
                            shape: RoundedRectangleBorder(borderRadius: AppRadius.mdRadius),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                          ),
                          onPressed: _isUploadingResume ? null : () => _handleResumeUpload(profile),
                          icon: _isUploadingResume
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                                )
                              : const Icon(Icons.upload_file_rounded, size: 18, color: AppColors.primary),
                          label: Text(
                            _isUploadingResume
                                ? 'Uploading to Server...'
                                : (profile.resumeUrl.isNotEmpty ? 'Replace PDF Resume' : 'Upload PDF Resume'),
                            style: GoogleFonts.plusJakartaSans(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Target Roles
                SectionHeader(title: 'Calibrated Target Roles'),
                const SizedBox(height: 8),
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: profile.targetRoles
                        .map((r) => SkillChip(label: r, status: SkillStatus.neutral))
                        .toList(),
                  ),
                ),

                const SizedBox(height: 24),

                // Sign Out
                SipsButton(
                  label: 'Sign Out of SIPS',
                  variant: SipsButtonVariant.outline,
                  isFullWidth: true,
                  size: SipsButtonSize.large,
                  onPressed: () {
                    ref.read(authProvider.notifier).signOut();
                    context.go('/welcome');
                  },
                ),
                const SizedBox(height: 16),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildAcademicPill(String label, String value, Color valueColor) {
    return Column(
      children: [
        Text(
          value,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: valueColor,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 10,
            color: AppColors.outline,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.outline),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 10,
                color: AppColors.outline,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              value,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.onSurface,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
