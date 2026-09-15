import 'package:flutter/material.dart';

/// Design tokens for SIPS — Skill Intelligence Placement System.
/// Accurate to Stitch Design System (Kinetic Obsidian & Light telemetry specs).
class AppColors {
  AppColors._();

  // Primary Signals (Electric Cobalt)
  static const Color primary = Color(0xFF4F46E5);
  static const Color primaryLight = Color(0xFF6366F1);
  static const Color primaryFixed = Color(0xFFE2DFFF);
  static const Color primaryContainer = Color(0xFF4F46E5);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color onPrimaryFixed = Color(0xFF0F0069);
  static const Color onPrimaryContainer = Color(0xFFDAD7FF);

  // Secondary Signals (Sky / Steel Precision Blue)
  static const Color secondary = Color(0xFF006398);
  static const Color secondaryLight = Color(0xFF0284C7);
  static const Color secondaryFixed = Color(0xFFCCE5FF);
  static const Color secondaryContainer = Color(0xFF5BB8FE);
  static const Color onSecondary = Color(0xFFFFFFFF);
  static const Color onSecondaryFixed = Color(0xFF001D31);

  // Tertiary Signals (Readiness Emerald)
  static const Color emerald = Color(0xFF10B981);
  static const Color emeraldDark = Color(0xFF006E4C);
  static const Color emeraldFixed = Color(0xFF85F8C4);
  static const Color emeraldContainer = Color(0xFFD1FAE5);
  static const Color onEmerald = Color(0xFFFFFFFF);
  static const Color onEmeraldFixed = Color(0xFF002114);

  // Warning & Intervention Signals (Amber / Orange)
  static const Color amber = Color(0xFFF59E0B);
  static const Color amberDark = Color(0xFFD97706);
  static const Color amberFixed = Color(0xFFFFDDB8);
  static const Color amberContainer = Color(0xFFFEF3C7);
  static const Color onAmber = Color(0xFFFFFFFF);
  static const Color onAmberFixed = Color(0xFF2A1700);

  // Error Signals
  static const Color error = Color(0xFFBA1A1A);
  static const Color errorContainer = Color(0xFFFFDAD6);
  static const Color onError = Color(0xFFFFFFFF);
  static const Color onErrorContainer = Color(0xFF93000A);

  // Light Mode Surfaces & Canvas (Stitch Light Baseline)
  static const Color background = Color(0xFFFAF8FF);
  static const Color surface = Color(0xFFFAF8FF);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow = Color(0xFFF2F3FF);
  static const Color surfaceContainer = Color(0xFFEAEDFF);
  static const Color surfaceContainerHigh = Color(0xFFE2E7FF);
  static const Color surfaceContainerHighest = Color(0xFFDAE2FD);

  // Text & Content (Light Mode)
  static const Color onSurface = Color(0xFF131B2E);
  static const Color onSurfaceVariant = Color(0xFF464555);
  static const Color onBackground = Color(0xFF131B2E);
  static const Color outline = Color(0xFF777587);
  static const Color outlineVariant = Color(0xFFC7C4D8);
  static const Color borderStroke = Color(0x140F172A); // rgba(15,23,42,0.08)

  // Dark Mode Surfaces (Kinetic Obsidian Baseline for future or dark toggle)
  static const Color darkBackground = Color(0xFF0B0F19);
  static const Color darkSurface = Color(0xFF0F131D);
  static const Color darkSurfaceCard = Color(0xFF111827);
  static const Color darkSurfaceSub = Color(0xFF1F2937);
  static const Color darkSurfaceHigh = Color(0xFF262A35);
  static const Color darkOnSurface = Color(0xFFDFE2F1);
  static const Color darkOnSurfaceVariant = Color(0xFF94A3B8);
  static const Color darkOutline = Color(0xFF918FA1);
  static const Color darkBorderStroke = Color(0x14FFFFFF); // rgba(255,255,255,0.08)

  // Gradients
  static const LinearGradient cobaltGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF4F46E5), Color(0xFF006398)],
  );

  static const LinearGradient emeraldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF10B981), Color(0xFF059669)],
  );

  static const LinearGradient amberGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
  );

  static const LinearGradient cardGlowGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFFFFFF), Color(0xFFF8FAFC)],
  );
}
