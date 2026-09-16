import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sips_app/core/network/api_client.dart';
import 'package:sips_app/models/student_profile.dart';
import 'package:sips_app/repositories/api_sips_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Profile Actions Integration Tests', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({
        ApiConfig.tokenKey: 'valid-test-token',
      });
    });

    test('updateStudentProfile sends updated skills and github handle via PUT', () async {
      late http.BaseRequest capturedRequest;
      final mockClient = MockClient((request) async {
        if (request.method == 'PUT' && request.url.path == '/api/student/profile') {
          capturedRequest = request;
          final parsed = jsonDecode(request.body) as Map<String, dynamic>;
          return http.Response(
            jsonEncode({
              'message': 'Profile updated',
              'student': {
                '_id': 'st_101',
                'name': 'Aarav Sharma',
                'email': 'aarav@eng.edu',
                'skills': parsed['skills'],
                'github': parsed['github'],
                'readinessScore': 85,
                'cgpa': 8.8,
              }
            }),
            200,
            headers: {'content-type': 'application/json'},
          );
        }
        return http.Response('Not Found', 404);
      });

      final apiClient = ApiClient(client: mockClient, baseUrl: 'http://localhost:5000');
      final repo = ApiSipsRepository(apiClient);

      const initialProfile = StudentProfile(
        id: 'st_101',
        name: 'Aarav Sharma',
        email: 'aarav@eng.edu',
        college: 'Engineering College',
        branch: 'Computer Science',
        graduationYear: '2025',
        cgpa: 8.8,
        skills: ['Dart', 'Flutter'],
        githubHandle: 'aarav-old',
      );

      final updated = await repo.updateStudentProfile(
        initialProfile.copyWith(
          skills: ['Dart', 'Flutter', 'Go', 'Kubernetes'],
          githubHandle: 'aarav-new-dev',
        ),
      );

      expect(capturedRequest.method, 'PUT');
      final sentBody = jsonDecode((capturedRequest as http.Request).body) as Map<String, dynamic>;
      expect(sentBody['skills'], ['Dart', 'Flutter', 'Go', 'Kubernetes']);
      expect(sentBody['github'], 'aarav-new-dev');

      expect(updated.skills, contains('Kubernetes'));
      expect(updated.githubHandle, 'aarav-new-dev');
      expect(updated.readinessScore, 85);
    });

    test('uploadResume uploads PDF multipart and updates resumeUrl in repository', () async {
      late http.BaseRequest capturedRequest;
      final mockClient = MockClient((request) async {
        if (request.method == 'POST' && request.url.path == '/api/student/resume') {
          capturedRequest = request;
          return http.Response(
            jsonEncode({
              'message': 'Resume uploaded',
              'resumeUrl': '/uploads/resume_101.pdf',
            }),
            200,
            headers: {'content-type': 'application/json'},
          );
        }
        return http.Response('Not Found', 404);
      });

      final apiClient = ApiClient(client: mockClient, baseUrl: 'http://localhost:5000');
      final repo = ApiSipsRepository(apiClient);

      final dummyPdfBytes = utf8.encode('%PDF-1.4 dummy content');
      final resumeUrl = await repo.uploadResume(dummyPdfBytes, 'resume_aarav.pdf');

      expect(capturedRequest.method, 'POST');
      expect(resumeUrl, '/uploads/resume_101.pdf');
    });
  });
}
