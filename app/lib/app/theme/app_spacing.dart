import 'package:flutter/material.dart';

/// Spacing system from Stitch specifications.
class AppSpacing {
  AppSpacing._();

  static const double space2xs = 2.0;
  static const double spaceXs = 4.0;
  static const double spaceSm = 8.0;
  static const double spaceMd = 12.0;
  static const double spaceBase = 16.0;
  static const double spaceLg = 20.0;
  static const double spaceXl = 24.0;
  static const double space2xl = 32.0;
  static const double space3xl = 48.0;

  static const double gutterScreen = 16.0;
  static const double navHeight = 68.0;

  // Edge insets presets
  static const EdgeInsets screenPadding = EdgeInsets.symmetric(
    horizontal: gutterScreen,
    vertical: spaceBase,
  );

  static const EdgeInsets cardPadding = EdgeInsets.all(spaceBase);
  static const EdgeInsets cardPaddingDense = EdgeInsets.all(spaceMd);
  static const EdgeInsets pillPadding = EdgeInsets.symmetric(
    horizontal: spaceMd,
    vertical: spaceXs + 2,
  );
}
