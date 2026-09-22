import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sips_app/app/app.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('SIPS app launches and displays welcome branding', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(
      const ProviderScope(
        child: SipsApp(),
      ),
    );

    // Initial frame on splash screen
    await tester.pump();
    expect(find.byType(Image), findsWidgets);

    // Advance time for splash delay (1000ms)
    await tester.pump(const Duration(milliseconds: 1000));
    // Settle route navigation transition to welcome screen
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    // Verify SIPS branding image and header renders on WelcomeScreen
    expect(find.byType(Image), findsWidgets);
    expect(find.text('Sign In to Student Portal'), findsOneWidget);
    expect(find.byType(ElevatedButton), findsNothing); // custom SipsButton used
  });
}
