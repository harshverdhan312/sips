import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_radius.dart';

enum SipsButtonVariant {
  primary,
  secondary,
  outline,
  ghost,
  emerald,
}

enum SipsButtonSize {
  small,
  medium,
  large,
}

class SipsButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final IconData? trailingIcon;
  final SipsButtonVariant variant;
  final SipsButtonSize size;
  final bool isLoading;
  final bool isFullWidth;

  const SipsButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.trailingIcon,
    this.variant = SipsButtonVariant.primary,
    this.size = SipsButtonSize.medium,
    this.isLoading = false,
    this.isFullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    BorderSide borderSide = BorderSide.none;

    switch (variant) {
      case SipsButtonVariant.primary:
        bg = AppColors.primary;
        fg = AppColors.onPrimary;
        break;
      case SipsButtonVariant.secondary:
        bg = AppColors.surfaceContainer;
        fg = AppColors.onSurface;
        break;
      case SipsButtonVariant.outline:
        bg = Colors.transparent;
        fg = AppColors.onSurface;
        borderSide = const BorderSide(color: AppColors.outlineVariant, width: 1);
        break;
      case SipsButtonVariant.ghost:
        bg = Colors.transparent;
        fg = AppColors.onSurfaceVariant;
        break;
      case SipsButtonVariant.emerald:
        bg = AppColors.emerald;
        fg = AppColors.onEmerald;
        break;
    }

    double height;
    double fontSize;
    EdgeInsets padding;

    switch (size) {
      case SipsButtonSize.small:
        height = 34;
        fontSize = 12;
        padding = const EdgeInsets.symmetric(horizontal: 12);
        break;
      case SipsButtonSize.medium:
        height = 42;
        fontSize = 13;
        padding = const EdgeInsets.symmetric(horizontal: 16);
        break;
      case SipsButtonSize.large:
        height = 50;
        fontSize = 14;
        padding = const EdgeInsets.symmetric(horizontal: 24);
        break;
    }

    Widget content = Row(
      mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading) ...[
          SizedBox(
            width: fontSize + 2,
            height: fontSize + 2,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(fg),
            ),
          ),
          const SizedBox(width: 8),
        ] else if (icon != null) ...[
          Icon(icon, size: fontSize + 4, color: fg),
          const SizedBox(width: 6),
        ],
        Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: fontSize,
            fontWeight: FontWeight.w600,
            color: fg,
            letterSpacing: -0.1,
          ),
        ),
        if (trailingIcon != null && !isLoading) ...[
          const SizedBox(width: 6),
          Icon(trailingIcon, size: fontSize + 4, color: fg),
        ],
      ],
    );

    final buttonWidget = Material(
      color: onPressed == null ? bg.withValues(alpha: 0.5) : bg,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.lgRadius,
        side: borderSide,
      ),
      child: InkWell(
        onTap: isLoading ? null : onPressed,
        borderRadius: AppRadius.lgRadius,
        child: Container(
          height: height,
          padding: padding,
          alignment: Alignment.center,
          child: content,
        ),
      ),
    );

    return isFullWidth ? SizedBox(width: double.infinity, child: buttonWidget) : buttonWidget;
  }
}
