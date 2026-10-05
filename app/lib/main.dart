import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/app.dart';
import 'core/network/api_client.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiConfig.init();
  await PracticeApiConfig.init();
  runApp(
    const ProviderScope(
      child: SipsApp(),
    ),
  );
}
