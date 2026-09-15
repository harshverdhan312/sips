import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sips_app/app/app.dart';

void main() {
  testWidgets('SIPS app launches and displays welcome branding', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(
      const ProviderScope(
        child: SipsApp(),
      ),
    );

    await tester.pumpAndSettle();

    // Verify SIPS branding and header renders
    expect(find.text('SIPS'), findsWidgets);
    expect(find.text('Get Started — Setup Profile'), findsOneWidget);
    expect(find.byType(ElevatedButton), findsNothing); // custom SipsButton used
  });
}
