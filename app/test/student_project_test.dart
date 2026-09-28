import 'package:flutter_test/flutter_test.dart';
import 'package:sips_app/models/student_profile.dart';

void main() {
  group('StudentProject & Featured Projects Deserialization Tests', () {
    test('StudentProject parses complete backend JSON correctly', () {
      final json = {
        'repoId': 101,
        'name': 'sips-mobile',
        'fullName': 'harsh-dev/sips-mobile',
        'owner': 'harsh-dev',
        'htmlUrl': 'https://github.com/harsh-dev/sips-mobile',
        'description': 'Flutter student application for placement intelligence',
        'primaryLanguage': 'Dart',
        'languages': ['Dart', 'C++'],
        'topics': ['flutter', 'riverpod', 'mobile'],
        'stars': 24,
        'forks': 5,
        'isFork': false,
        'order': 1,
        'updatedAt': '2025-01-15T10:00:00.000Z',
        'selectedAt': '2025-01-16T10:00:00.000Z',
      };

      final project = StudentProject.fromBackendJson(json);

      expect(project.repoId, 101);
      expect(project.name, 'sips-mobile');
      expect(project.fullName, 'harsh-dev/sips-mobile');
      expect(project.owner, 'harsh-dev');
      expect(project.htmlUrl, 'https://github.com/harsh-dev/sips-mobile');
      expect(project.description, 'Flutter student application for placement intelligence');
      expect(project.primaryLanguage, 'Dart');
      expect(project.languages, ['Dart', 'C++']);
      expect(project.topics, ['flutter', 'riverpod', 'mobile']);
      expect(project.stars, 24);
      expect(project.forks, 5);
      expect(project.isFork, false);
      expect(project.order, 1);
      expect(project.updatedAt, isNotNull);
      expect(project.selectedAt, isNotNull);
    });

    test('StudentProject handles missing optional fields gracefully', () {
      final json = {
        'repoId': 202,
        'name': 'minimal-project',
      };

      final project = StudentProject.fromBackendJson(json);

      expect(project.repoId, 202);
      expect(project.name, 'minimal-project');
      expect(project.description, '');
      expect(project.primaryLanguage, '');
      expect(project.languages, isEmpty);
      expect(project.topics, isEmpty);
      expect(project.stars, 0);
      expect(project.forks, 0);
      expect(project.isFork, false);
      expect(project.order, 1);
      expect(project.updatedAt, isNull);
      expect(project.selectedAt, isNull);
    });

    test('StudentProfile parses empty/null projects as empty list', () {
      final json = {
        '_id': 'student_123',
        'name': 'Priya Patel',
        'email': 'priya@college.edu',
        'github': 'priya-dev',
        // projects omitted
      };

      final profile = StudentProfile.fromBackendJson(json);

      expect(profile.projects, isEmpty);
    });

    test('StudentProfile parses 3 featured projects in correct order', () {
      final json = {
        '_id': 'student_123',
        'name': 'Priya Patel',
        'email': 'priya@college.edu',
        'github': 'priya-dev',
        'projects': [
          {
            'repoId': 1,
            'name': 'project-one',
            'order': 1,
            'primaryLanguage': 'Python',
            'stars': 10,
          },
          {
            'repoId': 2,
            'name': 'project-two',
            'order': 2,
            'primaryLanguage': 'JavaScript',
            'stars': 5,
          },
          {
            'repoId': 3,
            'name': 'project-three',
            'order': 3,
            'primaryLanguage': 'Dart',
            'stars': 2,
          }
        ]
      };

      final profile = StudentProfile.fromBackendJson(json);

      expect(profile.projects.length, 3);
      expect(profile.projects[0].name, 'project-one');
      expect(profile.projects[1].name, 'project-two');
      expect(profile.projects[2].name, 'project-three');
    });

    test('StudentProject parses syncedAt timestamp correctly', () {
      final json = {
        'repoId': 101,
        'name': 'sips-mobile',
        'syncedAt': '2025-06-01T12:30:00.000Z',
      };

      final project = StudentProject.fromBackendJson(json);

      expect(project.repoId, 101);
      expect(project.syncedAt, isNotNull);
      expect(project.syncedAt!.year, 2025);
      expect(project.syncedAt!.month, 6);
      expect(project.syncedAt!.day, 1);
    });

    test('StudentProfile copyWith updates projects properly', () {
      final profile = const StudentProfile(
        id: '123',
        name: 'Harsh',
        projects: [],
      );

      final updated = profile.copyWith(
        projects: [
          const StudentProject(
            repoId: 101,
            name: 'sips',
            primaryLanguage: 'JavaScript',
            syncedAt: null,
          )
        ],
      );

      expect(updated.projects.length, 1);
      expect(updated.projects.first.repoId, 101);
      expect(profile.projects, isEmpty);
    });
  });
}
