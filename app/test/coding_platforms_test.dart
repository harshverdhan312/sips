import 'package:flutter_test/flutter_test.dart';
import 'package:sips_app/models/student_profile.dart';
import 'package:sips_app/repositories/mock_sips_repository.dart';

void main() {
  group('CodingPlatformProfile Model & Deserialization Tests', () {
    test('LeetCode profile deserializes completely with statistics and breakdown', () {
      final json = {
        'platform': 'LEETCODE',
        'username': 'tourist',
        'profileUrl': 'https://leetcode.com/u/tourist',
        'connectionStatus': 'CONNECTED',
        'verificationStatus': 'UNVERIFIED',
        'showOnPublicProfile': true,
        'lastSyncedAt': '2026-03-30T10:00:00.000Z',
        'syncStatus': 'SUCCESS',
        'stats': {
          'problemsSolved': 450,
          'difficultyBreakdown': {
            'easy': 150,
            'medium': 220,
            'hard': 80,
          },
          'currentRating': 1850,
          'contestParticipationCount': 14,
          'badges': ['Knight', '100 Days Badge'],
          'topLanguages': ['C++', 'Python'],
        },
      };

      final profile = CodingPlatformProfile.fromBackendJson(json);

      expect(profile.platform, 'LEETCODE');
      expect(profile.username, 'tourist');
      expect(profile.profileUrl, 'https://leetcode.com/u/tourist');
      expect(profile.connectionStatus, 'CONNECTED');
      expect(profile.verificationStatus, 'UNVERIFIED');
      expect(profile.showOnPublicProfile, isTrue);
      expect(profile.lastSyncedAt, isNotNull);
      expect(profile.syncStatus, 'SUCCESS');
      expect(profile.stats.problemsSolved, 450);
      expect(profile.stats.difficultyBreakdown?.easy, 150);
      expect(profile.stats.difficultyBreakdown?.medium, 220);
      expect(profile.stats.difficultyBreakdown?.hard, 80);
      expect(profile.stats.currentRating, 1850);
      expect(profile.stats.contestParticipationCount, 14);
      expect(profile.stats.badges, contains('Knight'));
      expect(profile.stats.topLanguages, contains('C++'));
    });

    test('Codeforces profile deserializes with rating, rank, and null breakdown safely', () {
      final json = {
        'platform': 'CODEFORCES',
        'username': 'tourist',
        'profileUrl': 'https://codeforces.com/profile/tourist',
        'connectionStatus': 'CONNECTED',
        'verificationStatus': 'UNVERIFIED',
        'showOnPublicProfile': true,
        'stats': {
          'currentRating': 3800,
          'maxRating': 3979,
          'rank': 'Legendary Grandmaster',
          'maxRank': 'Legendary Grandmaster',
          'contestParticipationCount': 120,
        },
      };

      final profile = CodingPlatformProfile.fromBackendJson(json);

      expect(profile.platform, 'CODEFORCES');
      expect(profile.stats.currentRating, 3800);
      expect(profile.stats.maxRating, 3979);
      expect(profile.stats.rank, 'Legendary Grandmaster');
      expect(profile.stats.maxRank, 'Legendary Grandmaster');
      expect(profile.stats.difficultyBreakdown, isNull);
      expect(profile.stats.problemsSolved, isNull);
    });

    test('Unrated / minimal coding profile does not crash on empty stats', () {
      final json = {
        'platform': 'CODEFORCES',
        'username': 'newbie_dev',
        'connectionStatus': 'CONNECTED',
        'stats': {},
      };

      final profile = CodingPlatformProfile.fromBackendJson(json);

      expect(profile.platform, 'CODEFORCES');
      expect(profile.username, 'newbie_dev');
      expect(profile.stats.currentRating, isNull);
      expect(profile.stats.problemsSolved, isNull);
      expect(profile.stats.badges, isEmpty);
      expect(profile.stats.topLanguages, isEmpty);
    });

    test('StudentProfile parses codingProfiles and derives legacy leetcode stats safely', () {
      final json = {
        '_id': 'student_123',
        'name': 'Harsh Vardhan',
        'email': 'harsh@example.com',
        'codingProfiles': [
          {
            'platform': 'LEETCODE',
            'username': 'harsh_lc',
            'connectionStatus': 'CONNECTED',
            'stats': {
              'problemsSolved': 300,
              'currentRating': 1720,
            },
          },
          {
            'platform': 'CODEFORCES',
            'username': 'harsh_cf',
            'connectionStatus': 'CONNECTED',
            'stats': {
              'currentRating': 1450,
              'rank': 'Specialist',
            },
          }
        ],
      };

      final student = StudentProfile.fromBackendJson(json);

      expect(student.codingProfiles.length, 2);
      expect(student.leetcodeHandle, 'harsh_lc');
      expect(student.leetcodeRating, 1720);
    });
  });

  group('MockSipsRepository Coding Profile Operations Tests', () {
    test('connect, sync, update visibility, and disconnect coding profiles', () async {
      final repo = MockSipsRepository();

      // Initial list
      var profiles = await repo.getCodingProfiles();
      expect(profiles.length, 2);

      // Connect or update LeetCode
      final connected = await repo.connectCodingProfile(
        platform: 'LEETCODE',
        username: 'test_user',
        showOnPublicProfile: true,
      );
      expect(connected.username, 'test_user');
      expect(connected.stats.problemsSolved, 350);

      // Sync LeetCode
      final synced = await repo.syncCodingProfile('LEETCODE');
      expect(synced.syncStatus, 'SUCCESS');
      expect(synced.lastSyncedAt, isNotNull);

      // Update visibility
      final hidden = await repo.updateCodingProfileVisibility('LEETCODE', false);
      expect(hidden.showOnPublicProfile, isFalse);

      // Disconnect LeetCode
      await repo.disconnectCodingProfile('LEETCODE');
      profiles = await repo.getCodingProfiles();
      expect(profiles.any((p) => p.platform == 'LEETCODE'), isFalse);
      expect(profiles.any((p) => p.platform == 'CODEFORCES'), isTrue);
    });
  });
}
