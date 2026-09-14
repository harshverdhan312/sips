import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';

enum SkillStatus {
  strong, // Matched / Strong
  developing, // In Progress / Developing
  gap, // Missing / Gap
  neutral,
}

class SkillChip extends StatelessWidget {
  final String label;
  final SkillStatus status;
  final int? proficiency; // e.g. 92%
  final VoidCallback? onTap;

  const SkillChip({
    super.key,
    required this.label,
    this.status = SkillStatus.neutral,
    this.proficiency,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    Color border;
    IconData icon;

    switch (status) {
      case SkillStatus.strong:
        bg = const Color(0xFFE6F8F0);
        fg = const Color(0xFF047857);
        border = const Color(0xFF10B981).withValues(alpha: 0.35);
        icon = Icons.check_circle_rounded;
        break;
      case SkillStatus.developing:
        bg = const Color(0xFFEEF2FF);
        fg = const Color(0xFF4338CA);
        border = const Color(0xFF6366F1).withValues(alpha: 0.35);
        icon = Icons.trending_up_rounded;
        break;
      case SkillStatus.gap:
        bg = const Color(0xFFFFFBEB);
        fg = const Color(0xFFB45309);
        border = const Color(0xFFF59E0B).withValues(alpha: 0.4);
        icon = Icons.warning_amber_rounded;
        break;
      case SkillStatus.neutral:
        bg = AppColors.surfaceContainerLow;
        fg = AppColors.onSurfaceVariant;
        border = AppColors.outlineVariant;
        icon = Icons.code_rounded;
        break;
    }

    final chip = Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: AppRadius.fullRadius,
        border: Border.all(color: border, width: 0.8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: fg),
          const SizedBox(width: 5),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: fg,
              letterSpacing: -0.1,
            ),
          ),
          if (proficiency != null) ...[
            const SizedBox(width: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
              decoration: BoxDecoration(
                color: fg.withValues(alpha: 0.12),
                borderRadius: AppRadius.smRadius,
              ),
              child: Text(
                '$proficiency%',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: fg,
                ),
              ),
            ),
          ],
        ],
      ),
    );

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: AppRadius.fullRadius,
        child: chip,
      );
    }

    return chip;
  }
}
