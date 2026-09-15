import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';

enum SipsBadgeVariant {
  primary,
  secondary,
  emerald,
  amber,
  neutral,
  error,
}

class SipsBadge extends StatelessWidget {
  final String label;
  final IconData? icon;
  final SipsBadgeVariant variant;
  final bool isSmall;

  const SipsBadge({
    super.key,
    required this.label,
    this.icon,
    this.variant = SipsBadgeVariant.neutral,
    this.isSmall = false,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    Color border;

    switch (variant) {
      case SipsBadgeVariant.primary:
        bg = AppColors.primaryFixed;
        fg = AppColors.onPrimaryFixed;
        border = AppColors.primary.withValues(alpha: 0.2);
        break;
      case SipsBadgeVariant.secondary:
        bg = AppColors.secondaryFixed;
        fg = AppColors.onSecondaryFixed;
        border = AppColors.secondary.withValues(alpha: 0.2);
        break;
      case SipsBadgeVariant.emerald:
        bg = const Color(0xFFD1FAE5);
        fg = const Color(0xFF065F46);
        border = const Color(0xFF10B981).withValues(alpha: 0.3);
        break;
      case SipsBadgeVariant.amber:
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFF92400E);
        border = const Color(0xFFF59E0B).withValues(alpha: 0.3);
        break;
      case SipsBadgeVariant.error:
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFF991B1B);
        border = const Color(0xFFEF4444).withValues(alpha: 0.3);
        break;
      case SipsBadgeVariant.neutral:
        bg = AppColors.surfaceContainer;
        fg = AppColors.onSurface;
        border = AppColors.outlineVariant;
        break;
    }

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isSmall ? 8 : 10,
        vertical: isSmall ? 3 : 4,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: AppRadius.fullRadius,
        border: Border.all(color: border, width: 0.8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: isSmall ? 12 : 14, color: fg),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: isSmall ? 10 : 11,
              fontWeight: FontWeight.w700,
              color: fg,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}
