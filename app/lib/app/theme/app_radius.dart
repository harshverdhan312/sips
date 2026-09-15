import 'package:flutter/material.dart';

/// Border radius tokens according to Stitch specifications.
class AppRadius {
  AppRadius._();

  static const double sm = 4.0;
  static const double md = 8.0;
  static const double lg = 12.0;
  static const double xl = 16.0;
  static const double xxl = 24.0;
  static const double full = 999.0;

  static const BorderRadius smRadius = BorderRadius.all(Radius.circular(sm));
  static const BorderRadius mdRadius = BorderRadius.all(Radius.circular(md));
  static const BorderRadius lgRadius = BorderRadius.all(Radius.circular(lg));
  static const BorderRadius xlRadius = BorderRadius.all(Radius.circular(xl));
  static const BorderRadius xxlRadius = BorderRadius.all(Radius.circular(xxl));
  static const BorderRadius fullRadius = BorderRadius.all(Radius.circular(full));
}
