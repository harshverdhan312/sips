import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sips_app/core/network/api_client.dart';
import 'package:sips_app/core/network/api_exception.dart';
import 'package:sips_app/models/student_profile.dart';
import 'package:sips_app/models/job_opportunity.dart';
import 'package:sips_app/models/placement_alert.dart';
import 'package:sips_app/repositories/api_sips_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ApiClient Tests', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    test('GET request attaches Bearer token if present', () async {
      SharedPreferences.setMockInitialValues({
        ApiConfig.tokenKey: 'test-jwt-token-123',
      });

      late http.BaseRequest capturedRequest;
      final mockClient = MockClient((request) async {
        capturedRequest = request;
        return http.Response(jsonEncode({'message': 'success'}), 200, headers: {'content-type': 'application/json'});
      });

      final apiClient = ApiClient(client: mockClient, baseUrl: 'http://localhost:5000');
      final result = await apiClient.get('/api/test');

      expect(capturedRequest.headers['Authorization'], 'Bearer test-jwt-token-123');
      expect(result['message'], 'success');
    });

    test('401 response clears token and triggers onUnauthorized callback', () async {
      SharedPreferences.setMockInitialValues({
        ApiConfig.tokenKey: 'expired-token',
      });

      bool unauthorizedCalled = false;
      final mockClient = MockClient((request) async {
        return http.Response(jsonEncode({'message': 'Invalid token'}), 401, headers: {'content-type': 'application/json'});
      });

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'http://localhost:5000',
        onUnauthorized: () => unauthorizedCalled = true,
      );

      expect(
        () async => await apiClient.get('/api/student/profile'),
        throwsA(isA<ApiException>().having((e) => e.statusCode, 'statusCode', 401)),
      );

      await Future.delayed(const Duration(milliseconds: 50));
      expect(unauthorizedCalled, true);
      final savedToken = await apiClient.getToken();
      expect(savedToken, isNull);
    });

    test('POST multipart sends resume field', () async {
      SharedPreferences.setMockInitialValues({
        ApiConfig.tokenKey: 'valid-jwt',
      });

      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({'message': 'Resume uploaded', 'resumeUrl': '/uploads/resume.pdf'}),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final apiClient = ApiClient(client: mockClient, baseUrl: 'http://localhost:5000');
      final response = await apiClient.uploadMultipart(
        '/api/student/resume',
        fieldName: 'resume',
        fileBytes: [1, 2, 3, 4],
        filename: 'resume.pdf',
      );

      expect(response['resumeUrl'], '/uploads/resume.pdf');
    });
  });

  group('ApiSipsRepository & Model Mapping Tests', () {
    test('Backend Student JSON maps accurately to StudentProfile', () {
      final backendJson = {
        '_id': 'std_101',
        'name': 'Aarav Sharma',
        'rollNo': '1RV21CS001',
        'usn': '1RV21CS001',
        'email': 'aarav@rvce.edu',
        'branch': 'Computer Science & Engineering',
        'batch': '2025',
        'cgpa': 8.85,
        'readinessScore': 82,
        'technicalScore': 85,
        'softSkillScore': 78,
        'resumeScore': 84,
        'skills': ['React', 'Node.js', 'Python', 'SQL'],
        'github': 'https://github.com/aarav',
        'resumeUrl': '/uploads/aarav_resume.pdf'
      };

      final profile = StudentProfile.fromBackendJson(backendJson, collegeName: 'RV College of Engineering');

      expect(profile.id, 'std_101');
      expect(profile.name, 'Aarav Sharma');
      expect(profile.email, 'aarav@rvce.edu');
      expect(profile.cgpa, 8.85);
      expect(profile.readinessScore, 82);
      expect(profile.tier, 'Tier-1 Contender • Placement Ready');
      expect(profile.skills, contains('React'));
      expect(profile.resumeUrl, '/uploads/aarav_resume.pdf');
      expect(profile.resumeVersion, 'Uploaded Resume');
    });

    test('Backend Job JSON maps accurately to JobOpportunity with matches', () {
      final backendJson = {
        '_id': 'job_201',
        'company': 'Google India',
        'title': 'Associate Software Engineer',
        'role': 'Associate Software Engineer',
        'location': 'Bengaluru, India',
        'type': 'Full-time',
        'ctc': '28 LPA - 32 LPA',
        'matchScore': 94,
        'deadline': '2025-10-15T00:00:00.000Z',
        'description': 'Building next-generation cloud infra.',
        'requiredSkills': ['Python', 'Go', 'Distributed Systems'],
        'matchedSkills': ['Python', 'Distributed Systems'],
        'missingSkills': ['Go'],
        'allowedBranches': ['Computer Science'],
        'minCgpa': 8.0,
      };

      final job = JobOpportunity.fromBackendJson(backendJson);

      expect(job.id, 'job_201');
      expect(job.company, 'Google India');
      expect(job.matchScore, 94);
      expect(job.matchedSkills, ['Python', 'Distributed Systems']);
      expect(job.missingSkills, ['Go']);
      expect(job.requiredSkills, ['Python', 'Go', 'Distributed Systems']);
      expect(job.eligibilityCriteria, contains('Min CGPA: 8.0'));
    });

    test('Backend Notification JSON maps accurately to PlacementAlert', () {
      final backendJson = {
        '_id': 'notif_301',
        'message': 'Cisco Placement Drive: Online Assessment scheduled for Friday.',
        'target': 'ALL',
        'createdAt': '2025-09-15T10:00:00.000Z'
      };

      final alert = PlacementAlert.fromBackendJson(backendJson);

      expect(alert.id, 'notif_301');
      expect(alert.title, 'Cisco Placement Drive');
      expect(alert.description, 'Online Assessment scheduled for Friday.');
    });

    test('ApiSipsRepository returns empty/honest states for unsupported features without mock fabrication', () async {
      final mockClient = MockClient((request) async {
        return http.Response(jsonEncode({}), 200);
      });

      final apiClient = ApiClient(client: mockClient, baseUrl: 'http://localhost:5000');
      final repo = ApiSipsRepository(apiClient);

      final tasks = await repo.getGrowthTasks();
      expect(tasks.isEmpty, true);

      final milestones = await repo.getRoadmapMilestones();
      expect(milestones.isEmpty, true);

      final interviewQuestions = await repo.getMockInterviewQuestions();
      expect(interviewQuestions.isEmpty, true);

      final peers = await repo.getPeerMatches();
      expect(peers.isEmpty, true);
    });
  });
}
