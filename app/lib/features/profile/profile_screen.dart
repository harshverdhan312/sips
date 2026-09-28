import 'dart:io' as io;
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
import '../../core/widgets/student_avatar.dart';
import '../../models/student_profile.dart';
import '../../providers/sips_providers.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _isUploadingResume = false;
  bool _isUploadingImage = false;
  bool _isPredicting = false;
  bool _isSyncingProjects = false;

  String _formatTimeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 30) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  Future<void> _handleSyncProjects(StudentProfile profile) async {
    if (_isSyncingProjects) return;
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _isSyncingProjects = true);
    try {
      final res = await ref.read(sipsRepositoryProvider).syncFeaturedProjects();
      await ref.read(studentProfileProvider.notifier).loadProfile();
      if (!mounted) return;
      final missingCount = res['missingCount'] as int? ?? 0;
      final updatedCount = res['updatedCount'] as int? ?? (res['projects'] as List?)?.length ?? 0;
      if (missingCount > 0) {
        messenger.showSnackBar(
          SnackBar(
            content: Text('Projects synced: $updatedCount updated, $missingCount unavailable on GitHub.'),
            backgroundColor: Colors.amber.shade800,
          ),
        );
      } else {
        messenger.showSnackBar(
          SnackBar(
            content: Text('Successfully refreshed $updatedCount GitHub project(s)!'),
            backgroundColor: const Color(0xFF047857),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text('GitHub sync failed: ${e.toString()}'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSyncingProjects = false);
      }
    }
  }

  Future<void> _handlePredictPlacement() async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _isPredicting = true);
    try {
      final pred = await ref.read(placementPredictionProvider.notifier).requestPrediction();
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text('Placement prediction computed: ${pred.predictedLabel} (${(pred.placementProbability * 100).toStringAsFixed(1)}%)'),
          backgroundColor: const Color(0xFF047857),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text('Prediction failed: ${e.toString()}'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isPredicting = false);
      }
    }
  }

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

  Future<void> _handleImageUpload(StudentProfile profile) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        withData: true,
      );

      if (result == null || result.files.isEmpty) {
        return;
      }

      final file = result.files.first;

      // Validate 5 MB limit (5 * 1024 * 1024 bytes)
      const maxSizeBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Image size exceeds 5MB limit. Please select a smaller photo.'),
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
            content: Text('Could not read image content. Please try again.'),
            backgroundColor: AppColors.error,
          ),
        );
        return;
      }

      setState(() => _isUploadingImage = true);

      await ref.read(studentProfileProvider.notifier).uploadProfileImage(bytes, file.name);

      if (!mounted) return;
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Profile photo updated successfully!'),
          backgroundColor: Color(0xFF047857),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text('Photo upload failed: ${e.toString()}'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isUploadingImage = false);
      }
    }
  }

  Future<void> _handleImageDelete() async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _isUploadingImage = true);
    try {
      await ref.read(studentProfileProvider.notifier).deleteProfileImage();
      if (!mounted) return;
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Profile photo removed.'),
          backgroundColor: Color(0xFF047857),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text('Failed to remove photo: ${e.toString()}'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isUploadingImage = false);
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

  Future<void> _showPublicProfileDialog(BuildContext context, StudentProfile profile) async {
    final pub = profile.publicProfile;
    bool enabled = pub.enabled;
    final usernameCtrl = TextEditingController(text: pub.username);
    final bioCtrl = TextEditingController(text: pub.bio);
    final linkedinCtrl = TextEditingController(text: profile.linkedin);
    bool showResume = pub.showResume;
    bool showGithub = pub.showGithub;
    bool showLinkedIn = pub.showLinkedIn;
    bool showSkills = pub.showSkills;
    bool showProjects = pub.showProjects;
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
                  const Icon(Icons.public, color: AppColors.primary, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    'Public Career Profile',
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
                        'Configure your public, shareable portfolio accessible at /u/:username.',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          color: AppColors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Enabled Toggle
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceContainerLow,
                          borderRadius: AppRadius.mdRadius,
                          border: Border.all(color: AppColors.outlineVariant),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Enable Public Profile',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.onSurface,
                              ),
                            ),
                            Switch(
                              value: enabled,
                              activeThumbColor: AppColors.primary,
                              onChanged: isSaving ? null : (val) => setDialogState(() => enabled = val),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      // Username
                      Text('Username *', style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.onSurface)),
                      const SizedBox(height: 4),
                      TextField(
                        controller: usernameCtrl,
                        enabled: !isSaving,
                        decoration: InputDecoration(
                          hintText: 'e.g. rahul-sharma',
                          prefixText: '/u/ ',
                          prefixStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, color: AppColors.primary),
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          filled: true,
                          fillColor: AppColors.surfaceContainerLow,
                          border: OutlineInputBorder(borderRadius: AppRadius.mdRadius, borderSide: const BorderSide(color: AppColors.outlineVariant)),
                        ),
                      ),
                      const SizedBox(height: 14),
                      // Bio
                      Text('Professional Bio (Max 500 chars)', style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.onSurface)),
                      const SizedBox(height: 4),
                      TextField(
                        controller: bioCtrl,
                        maxLines: 3,
                        maxLength: 500,
                        enabled: !isSaving,
                        decoration: InputDecoration(
                          hintText: 'Brief summary of your technical interests...',
                          isDense: true,
                          contentPadding: const EdgeInsets.all(12),
                          filled: true,
                          fillColor: AppColors.surfaceContainerLow,
                          border: OutlineInputBorder(borderRadius: AppRadius.mdRadius, borderSide: const BorderSide(color: AppColors.outlineVariant)),
                        ),
                      ),
                      const SizedBox(height: 10),
                      // LinkedIn
                      Text('LinkedIn Profile URL', style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.onSurface)),
                      const SizedBox(height: 4),
                      TextField(
                        controller: linkedinCtrl,
                        enabled: !isSaving,
                        decoration: InputDecoration(
                          hintText: 'https://www.linkedin.com/in/username',
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          filled: true,
                          fillColor: AppColors.surfaceContainerLow,
                          border: OutlineInputBorder(borderRadius: AppRadius.mdRadius, borderSide: const BorderSide(color: AppColors.outlineVariant)),
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Visibility Toggles
                      Text('Public Visibility', style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.onSurface)),
                      const SizedBox(height: 6),
                      CheckboxListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        title: Text('Show Resume PDF', style: GoogleFonts.plusJakartaSans(fontSize: 12)),
                        value: showResume,
                        onChanged: isSaving ? null : (v) => setDialogState(() => showResume = v ?? false),
                      ),
                      CheckboxListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        title: Text('Show Verified Skills', style: GoogleFonts.plusJakartaSans(fontSize: 12)),
                        value: showSkills,
                        onChanged: isSaving ? null : (v) => setDialogState(() => showSkills = v ?? true),
                      ),
                      CheckboxListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        title: Text('Show Featured Projects', style: GoogleFonts.plusJakartaSans(fontSize: 12)),
                        value: showProjects,
                        onChanged: isSaving ? null : (v) => setDialogState(() => showProjects = v ?? true),
                      ),
                      CheckboxListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        title: Text('Show GitHub Handle', style: GoogleFonts.plusJakartaSans(fontSize: 12)),
                        value: showGithub,
                        onChanged: isSaving ? null : (v) => setDialogState(() => showGithub = v ?? true),
                      ),
                      CheckboxListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        title: Text('Show LinkedIn Profile', style: GoogleFonts.plusJakartaSans(fontSize: 12)),
                        value: showLinkedIn,
                        onChanged: isSaving ? null : (v) => setDialogState(() => showLinkedIn = v ?? true),
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
                          setDialogState(() => isSaving = true);
                          try {
                            final newConfig = StudentPublicProfile(
                              enabled: enabled,
                              username: usernameCtrl.text.trim().toLowerCase(),
                              bio: bioCtrl.text.trim(),
                              showResume: showResume,
                              showGithub: showGithub,
                              showLinkedIn: showLinkedIn,
                              showSkills: showSkills,
                              showProjects: showProjects,
                            );
                            await ref.read(sipsRepositoryProvider).updatePublicProfileConfig(
                              newConfig,
                              linkedin: linkedinCtrl.text.trim(),
                            );
                            await ref.read(studentProfileProvider.notifier).loadProfile();
                            if (dialogCtx.mounted) {
                              Navigator.of(dialogCtx).pop();
                            }
                            if (mounted) {
                              messenger.showSnackBar(
                                const SnackBar(
                                  content: Text('Public Career Profile settings updated!'),
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
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text('Save Settings', style: GoogleFonts.plusJakartaSans(color: Colors.white, fontWeight: FontWeight.w700)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildVisibilityChip(String label, bool isVisible) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: isVisible ? const Color(0xFFECFDF5) : AppColors.surfaceContainerLow,
        borderRadius: AppRadius.smRadius,
        border: Border.all(
          color: isVisible ? const Color(0xFFA7F3D0) : AppColors.outlineVariant,
        ),
      ),
      child: Text(
        '$label: ${isVisible ? "On" : "Off"}',
        style: GoogleFonts.plusJakartaSans(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: isVisible ? const Color(0xFF065F46) : AppColors.outline,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(studentProfileProvider);
    final predictionAsync = ref.watch(placementPredictionProvider);

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
                          StudentAvatar(
                            profileImageUrl: profile.profileImageUrl,
                            name: profile.name,
                            size: 64,
                            showUploadOverlay: true,
                            isUploading: _isUploadingImage,
                            onTap: () => _handleImageUpload(profile),
                            onDelete: profile.profileImageUrl.isNotEmpty ? _handleImageDelete : null,
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

                // ML Placement Likelihood Prediction
                SectionHeader(
                  title: 'Placement ML Prediction',
                  badge: SipsBadge(
                    label: 'FASTAPI ML',
                    variant: SipsBadgeVariant.primary,
                    isSmall: true,
                  ),
                ),
                const SizedBox(height: 8),
                predictionAsync.when(
                  loading: () => const SipsCard(
                    padding: EdgeInsets.all(20),
                    child: Center(
                      child: Padding(
                        padding: EdgeInsets.all(12),
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                      ),
                    ),
                  ),
                  error: (err, _) => SipsCard(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.warning_amber_rounded, color: AppColors.error, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              'Prediction Unavailable',
                              style: GoogleFonts.plusJakartaSans(
                                fontWeight: FontWeight.w700,
                                fontSize: 13,
                                color: AppColors.error,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '$err',
                          style: GoogleFonts.plusJakartaSans(fontSize: 12, color: AppColors.onSurfaceVariant),
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: _isPredicting ? null : _handlePredictPlacement,
                          icon: const Icon(Icons.refresh, size: 16),
                          label: const Text('Try Again'),
                        ),
                      ],
                    ),
                  ),
                  data: (prediction) {
                    if (prediction == null) {
                      return SipsCard(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            const Icon(Icons.analytics_outlined, size: 36, color: AppColors.outline),
                            const SizedBox(height: 8),
                            Text(
                              'No Prediction Calculated Yet',
                              style: GoogleFonts.plusJakartaSans(
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                                color: AppColors.onSurface,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Ensure your profile attributes above are complete, then run the ML placement prediction model.',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.plusJakartaSans(fontSize: 12, color: AppColors.onSurfaceVariant),
                            ),
                            const SizedBox(height: 14),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  shape: RoundedRectangleBorder(borderRadius: AppRadius.mdRadius),
                                  padding: const EdgeInsets.symmetric(vertical: 10),
                                ),
                                onPressed: _isPredicting ? null : _handlePredictPlacement,
                                icon: _isPredicting
                                    ? const SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                      )
                                    : const Icon(Icons.auto_awesome_rounded, size: 18, color: Colors.white),
                                label: Text(
                                  _isPredicting ? 'Computing Prediction...' : 'Run ML Prediction',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }

                    final pct = (prediction.placementProbability * 100).toStringAsFixed(1);
                    final isPlaced = prediction.predictedClass == 1;

                    return SipsCard(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Placement Likelihood',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.outline,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '$pct%',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w800,
                                      color: isPlaced ? const Color(0xFF047857) : AppColors.primary,
                                    ),
                                  ),
                                ],
                              ),
                              SipsBadge(
                                label: prediction.predictedLabel.toUpperCase(),
                                variant: isPlaced ? SipsBadgeVariant.emerald : SipsBadgeVariant.neutral,
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ClipRRect(
                            borderRadius: AppRadius.fullRadius,
                            child: LinearProgressIndicator(
                              value: prediction.placementProbability.clamp(0.0, 1.0),
                              minHeight: 8,
                              backgroundColor: AppColors.surfaceContainerHigh,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                isPlaced ? const Color(0xFF047857) : AppColors.primary,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Decision Threshold: ${(prediction.decisionThreshold * 100).toStringAsFixed(0)}%',
                                style: GoogleFonts.plusJakartaSans(fontSize: 11, color: AppColors.outline),
                              ),
                              Text(
                                'Model: ${prediction.modelVersion.isNotEmpty ? prediction.modelVersion : "Standard"}',
                                style: GoogleFonts.plusJakartaSans(fontSize: 11, color: AppColors.outline),
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
                              onPressed: _isPredicting ? null : _handlePredictPlacement,
                              icon: _isPredicting
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                                    )
                                  : const Icon(Icons.refresh_rounded, size: 18, color: AppColors.primary),
                              label: Text(
                                _isPredicting ? 'Recalculating...' : 'Recalculate Prediction',
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
                    );
                  },
                ),

                const SizedBox(height: 20),

                // Public Career Profile Management
                SectionHeader(
                  title: 'Public Career Profile',
                  badge: SipsBadge(
                    label: profile.publicProfile.enabled ? 'PUBLIC' : 'PRIVATE',
                    variant: profile.publicProfile.enabled ? SipsBadgeVariant.emerald : SipsBadgeVariant.neutral,
                    isSmall: true,
                  ),
                ),
                const SizedBox(height: 8),
                SipsCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Shareable Recruiter Profile',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14,
                                    color: AppColors.onSurface,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  profile.publicProfile.username.isNotEmpty
                                      ? '/u/${profile.publicProfile.username}'
                                      : 'No username configured',
                                  style: GoogleFonts.firaCode(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: profile.publicProfile.enabled ? AppColors.primary : AppColors.outline,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Row(
                            children: [
                              if (profile.publicProfile.username.isNotEmpty)
                                IconButton(
                                  icon: const Icon(Icons.copy_rounded, size: 18, color: AppColors.primary),
                                  tooltip: 'Copy Profile Link',
                                  onPressed: () {
                                    final link = 'https://sips-six.vercel.app/u/${profile.publicProfile.username}';
                                    Clipboard.setData(ClipboardData(text: link));
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Public profile link copied to clipboard!'),
                                        backgroundColor: Color(0xFF047857),
                                      ),
                                    );
                                  },
                                ),
                              IconButton(
                                icon: const Icon(Icons.settings_outlined, size: 18, color: AppColors.primary),
                                tooltip: 'Configure Public Profile',
                                onPressed: () => _showPublicProfileDialog(context, profile),
                              ),
                            ],
                          ),
                        ],
                      ),
                      if (profile.publicProfile.bio.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          profile.publicProfile.bio,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            color: AppColors.onSurfaceVariant,
                          ),
                        ),
                      ],
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          _buildVisibilityChip('Skills', profile.publicProfile.showSkills),
                          _buildVisibilityChip('Projects', profile.publicProfile.showProjects),
                          _buildVisibilityChip('Resume', profile.publicProfile.showResume),
                          _buildVisibilityChip('GitHub', profile.publicProfile.showGithub),
                          _buildVisibilityChip('LinkedIn', profile.publicProfile.showLinkedIn),
                        ],
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

                // Featured GitHub Projects
                Builder(
                  builder: (context) {
                    DateTime? latestSynced;
                    for (final p in profile.projects) {
                      if (p.syncedAt != null) {
                        if (latestSynced == null || p.syncedAt!.isAfter(latestSynced)) {
                          latestSynced = p.syncedAt;
                        }
                      }
                    }

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SectionHeader(
                          title: 'Featured GitHub Projects',
                          badge: SipsBadge(
                            label: '${profile.projects.length} / 3 SELECTED',
                            variant: profile.projects.isNotEmpty
                                ? SipsBadgeVariant.emerald
                                : SipsBadgeVariant.neutral,
                            isSmall: true,
                          ),
                          actionLabel: profile.projects.isNotEmpty
                              ? (_isSyncingProjects ? 'Syncing...' : 'Sync GitHub')
                              : null,
                          onActionTap: profile.projects.isNotEmpty && !_isSyncingProjects
                              ? () => _handleSyncProjects(profile)
                              : null,
                        ),
                        if (latestSynced != null) ...[
                          const SizedBox(height: 2),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: Row(
                              children: [
                                const Icon(Icons.sync_rounded, size: 12, color: AppColors.outline),
                                const SizedBox(width: 4),
                                Text(
                                  'Last synced: ${_formatTimeAgo(latestSynced)}',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 11,
                                    color: AppColors.onSurfaceVariant,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    );
                  },
                ),
                const SizedBox(height: 8),
                if (profile.githubHandle.isEmpty)
                  SipsCard(
                    padding: const EdgeInsets.all(20),
                    child: Center(
                      child: Column(
                        children: [
                          const Icon(Icons.folder_off_outlined, size: 36, color: AppColors.outline),
                          const SizedBox(height: 8),
                          Text(
                            'GitHub Account Not Linked',
                            style: GoogleFonts.plusJakartaSans(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                              color: AppColors.onSurface,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Connect your GitHub profile above to showcase your best public repositories.',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              color: AppColors.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else if (profile.projects.isEmpty)
                  SipsCard(
                    padding: const EdgeInsets.all(20),
                    child: Center(
                      child: Column(
                        children: [
                          const Icon(Icons.folder_special_outlined, size: 36, color: AppColors.primary),
                          const SizedBox(height: 8),
                          Text(
                            'No Featured Projects Selected',
                            style: GoogleFonts.plusJakartaSans(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                              color: AppColors.onSurface,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Select up to 3 repositories from @${profile.githubHandle} on the SIPS web portal to showcase on your profile.',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              color: AppColors.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  ...profile.projects.map((project) {
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
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppColors.primary.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          '#${project.order}',
                                          style: GoogleFonts.plusJakartaSans(
                                            fontWeight: FontWeight.w800,
                                            fontSize: 11,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          project.name,
                                          style: GoogleFonts.plusJakartaSans(
                                            fontWeight: FontWeight.w700,
                                            fontSize: 14,
                                            color: AppColors.onSurface,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (project.isFork)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.amber.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      'FORK',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 9,
                                        color: Colors.amber.shade900,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            if (project.description.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text(
                                project.description,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  color: AppColors.onSurfaceVariant,
                                ),
                              ),
                            ],
                            if (project.topics.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 6,
                                runSpacing: 4,
                                children: project.topics.take(4).map((topic) {
                                  return Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppColors.surfaceContainerLow,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      '#$topic',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.onSurfaceVariant,
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                            const SizedBox(height: 10),
                            const Divider(height: 1, color: AppColors.outlineVariant),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                if (project.primaryLanguage.isNotEmpty)
                                  Row(
                                    children: [
                                      Container(
                                        width: 8,
                                        height: 8,
                                        decoration: const BoxDecoration(
                                          color: AppColors.primary,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        project.primaryLanguage,
                                        style: GoogleFonts.plusJakartaSans(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 11,
                                          color: AppColors.onSurface,
                                        ),
                                      ),
                                    ],
                                  )
                                else
                                  const SizedBox.shrink(),
                                Row(
                                  children: [
                                    const Icon(Icons.star_rounded, size: 14, color: Colors.amber),
                                    const SizedBox(width: 2),
                                    Text(
                                      '${project.stars}',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.onSurfaceVariant,
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    const Icon(Icons.alt_route_rounded, size: 13, color: AppColors.outline),
                                    const SizedBox(width: 2),
                                    Text(
                                      '${project.forks}',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.onSurfaceVariant,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  }),

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
                                ? 'Uploading & Extracting Skills...'
                                : (profile.resumeUrl.isNotEmpty ? 'Replace PDF Resume' : 'Upload PDF Resume'),
                            style: GoogleFonts.plusJakartaSans(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ),
                      if (profile.extractedSkills.isNotEmpty) ...[
                        const SizedBox(height: 14),
                        const Divider(height: 1),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            const Icon(Icons.auto_awesome_rounded, size: 16, color: AppColors.primary),
                            const SizedBox(width: 6),
                            Text(
                              'AI-Extracted Skills (${profile.extractedSkills.length})',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppColors.onSurface,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: profile.extractedSkills
                              .map((s) => SkillChip(label: s, status: SkillStatus.strong))
                              .toList(),
                        ),
                      ],
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
