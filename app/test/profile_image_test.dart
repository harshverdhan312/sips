import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sips_app/core/widgets/student_avatar.dart';
import 'package:sips_app/models/student_profile.dart';
import 'package:sips_app/repositories/mock_sips_repository.dart';
import 'package:sips_app/providers/sips_providers.dart';

void main() {
  group('StudentProfile Image Data Contract Tests', () {
    test('StudentProfile parses profileImageUrl from backend JSON correctly', () {
      final json = {
        '_id': 'std_123',
        'name': 'Kushagra Shukla',
        'email': 'kushagra@college.edu',
        'profileImageUrl': '/uploads/profile-kushagra.jpg',
        'readinessScore': 85,
        'branch': 'CSE',
        'batch': '2025',
      };

      final profile = StudentProfile.fromBackendJson(json);
      expect(profile.profileImageUrl, equals('/uploads/profile-kushagra.jpg'));
      expect(profile.name, equals('Kushagra Shukla'));
    });

    test('StudentProfile defaults profileImageUrl to empty string when missing or null', () {
      final json = {
        '_id': 'std_456',
        'name': 'Harsh Verdhan Singh',
        'email': 'harsh@college.edu',
        'profileImageUrl': null,
      };

      final profile = StudentProfile.fromBackendJson(json);
      expect(profile.profileImageUrl, isEmpty);
    });

    test('copyWith properly updates profileImageUrl', () {
      const profile = StudentProfile(name: 'Aditi Rao', profileImageUrl: '');
      final updated = profile.copyWith(profileImageUrl: '/uploads/aditi.png');
      expect(updated.profileImageUrl, equals('/uploads/aditi.png'));
    });
  });

  group('StudentAvatar Widget & Deterministic Initials Tests', () {
    testWidgets('StudentAvatar displays deterministic 2-letter initials when profileImageUrl is empty', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StudentAvatar(
              profileImageUrl: '',
              name: 'Kushagra Shukla',
              size: 50,
            ),
          ),
        ),
      );

      expect(find.text('KS'), findsOneWidget);
    });

    testWidgets('StudentAvatar displays 2-letter initials for single word names', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StudentAvatar(
              profileImageUrl: '',
              name: 'Aditi',
              size: 50,
            ),
          ),
        ),
      );

      expect(find.text('AD'), findsOneWidget);
    });

    testWidgets('StudentAvatar displays ST for empty name', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StudentAvatar(
              profileImageUrl: '',
              name: '',
              size: 50,
            ),
          ),
        ),
      );

      expect(find.text('ST'), findsOneWidget);
    });
  });

  group('Profile Image Repository & State Tests', () {
    test('MockSipsRepository uploadProfileImage and deleteProfileImage persist to studentProfile', () async {
      final repo = MockSipsRepository();
      final initialProfile = await repo.getStudentProfile();
      expect(initialProfile.profileImageUrl, isEmpty);

      final uploadedUrl = await repo.uploadProfileImage([1, 2, 3, 4], 'photo.png');
      expect(uploadedUrl, equals('/uploads/photo.png'));

      final updatedProfile = await repo.getStudentProfile();
      expect(updatedProfile.profileImageUrl, equals('/uploads/photo.png'));

      await repo.deleteProfileImage();
      final clearedProfile = await repo.getStudentProfile();
      expect(clearedProfile.profileImageUrl, isEmpty);
    });

    test('ProfileNotifier triggers loadProfile after uploadProfileImage and deleteProfileImage', () async {
      final repo = MockSipsRepository();
      final container = ProviderContainer(
        overrides: [
          sipsRepositoryProvider.overrideWithValue(repo),
        ],
      );

      final notifier = container.read(studentProfileProvider.notifier);
      await notifier.loadProfile();

      expect(container.read(studentProfileProvider).value?.profileImageUrl, isEmpty);

      await notifier.uploadProfileImage([0xFF, 0xD8, 0xFF], 'avatar.jpg');
      expect(container.read(studentProfileProvider).value?.profileImageUrl, equals('/uploads/avatar.jpg'));

      await notifier.deleteProfileImage();
      expect(container.read(studentProfileProvider).value?.profileImageUrl, isEmpty);
    });
  });
}
