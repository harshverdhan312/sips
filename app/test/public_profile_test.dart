import 'package:flutter_test/flutter_test.dart';
import 'package:sips_app/models/student_profile.dart';

void main() {
  group('StudentPublicProfile Model Tests', () {
    test('StudentPublicProfile initializes with sensible defaults', () {
      const pub = StudentPublicProfile();

      expect(pub.enabled, false);
      expect(pub.username, '');
      expect(pub.bio, '');
      expect(pub.showResume, false);
      expect(pub.showGithub, true);
      expect(pub.showLinkedIn, true);
      expect(pub.showSkills, true);
      expect(pub.showProjects, true);
    });

    test('StudentPublicProfile parses complete JSON correctly', () {
      final json = {
        'enabled': true,
        'username': 'rahul-sharma',
        'bio': 'Passionate Flutter & backend developer.',
        'showResume': true,
        'showGithub': true,
        'showLinkedIn': true,
        'showSkills': true,
        'showProjects': true,
      };

      final pub = StudentPublicProfile.fromJson(json);

      expect(pub.enabled, true);
      expect(pub.username, 'rahul-sharma');
      expect(pub.bio, 'Passionate Flutter & backend developer.');
      expect(pub.showResume, true);
      expect(pub.showGithub, true);
      expect(pub.showLinkedIn, true);
      expect(pub.showSkills, true);
      expect(pub.showProjects, true);
    });

    test('StudentPublicProfile serializes to JSON correctly', () {
      const pub = StudentPublicProfile(
        enabled: true,
        username: 'priya-singh',
        bio: 'AI researcher and competitive programmer.',
        showResume: false,
        showGithub: true,
        showLinkedIn: false,
        showSkills: true,
        showProjects: false,
      );

      final json = pub.toJson();

      expect(json['enabled'], true);
      expect(json['username'], 'priya-singh');
      expect(json['bio'], 'AI researcher and competitive programmer.');
      expect(json['showResume'], false);
      expect(json['showGithub'], true);
      expect(json['showLinkedIn'], false);
      expect(json['showSkills'], true);
      expect(json['showProjects'], false);
    });

    test('StudentPublicProfile copyWith updates fields without mutating unchanged ones', () {
      const initial = StudentPublicProfile(
        enabled: false,
        username: 'arjun-2026',
        bio: 'Initial bio',
        showResume: false,
        showGithub: true,
      );

      final updated = initial.copyWith(
        enabled: true,
        bio: 'Updated bio',
        showResume: true,
      );

      expect(updated.enabled, true);
      expect(updated.username, 'arjun-2026');
      expect(updated.bio, 'Updated bio');
      expect(updated.showResume, true);
      expect(updated.showGithub, true);
      expect(updated.showLinkedIn, true);
    });

    test('StudentProfile parses publicProfile and linkedin from backend JSON', () {
      final backendJson = {
        '_id': 'student_123',
        'name': 'Rahul Sharma',
        'email': 'rahul@example.com',
        'github': 'rahul-sharma',
        'linkedin': 'https://www.linkedin.com/in/rahul-sharma',
        'publicProfile': {
          'enabled': true,
          'username': 'rahul-sharma',
          'bio': 'Software engineer and system architect.',
          'showResume': true,
          'showGithub': true,
          'showLinkedIn': true,
          'showSkills': true,
          'showProjects': true,
        },
      };

      final profile = StudentProfile.fromBackendJson(backendJson);

      expect(profile.name, 'Rahul Sharma');
      expect(profile.githubHandle, 'rahul-sharma');
      expect(profile.linkedin, 'https://www.linkedin.com/in/rahul-sharma');
      expect(profile.publicProfile.enabled, true);
      expect(profile.publicProfile.username, 'rahul-sharma');
      expect(profile.publicProfile.bio, 'Software engineer and system architect.');
      expect(profile.publicProfile.showResume, true);
    });
  });
}
