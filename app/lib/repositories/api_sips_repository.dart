import '../core/network/api_client.dart';
import '../core/widgets/skill_chip.dart';
import '../mock/mock_data.dart';
import '../models/growth_task.dart';
import '../models/job_opportunity.dart';
import '../models/mock_interview.dart';
import '../models/peer_match.dart';
import '../models/placement_alert.dart';
import '../models/readiness_metric.dart';
import '../models/roadmap_milestone.dart';
import '../models/skill_intelligence.dart';
import '../models/student_profile.dart';
import 'sips_repository.dart';

class ApiSipsRepository implements SipsRepository {
  final ApiClient _apiClient;

  // In-memory caches for live data
  StudentProfile? _cachedProfile;
  List<JobOpportunity> _cachedJobs = [];
  List<PlacementAlert> _cachedAlerts = [];

  // Session state tracking across API re-fetches
  final Set<String> _readAlertIds = {};
  final Set<String> _appliedJobIds = {};
  final Set<String> _bookmarkedJobIds = {};

  // Local state for unsupported features (Backend Gaps)
  List<GrowthTask> _localTasks = List.from(MockData.tasks);
  final List<RoadmapMilestone> _localMilestones = List.from(MockData.roadmapMilestones);
  final List<InterviewQuestion> _localInterviewQuestions = List.from(MockData.mockInterviewQuestions);
  final InterviewDiagnosticReport _localDiagnostic = MockData.diagnosticReport;
  final List<PeerMatch> _localPeers = List.from(MockData.peers);

  ApiSipsRepository(this._apiClient);

  // ==========================================
  // 1. Student Profile (LIVE)
  // ==========================================
  @override
  Future<StudentProfile> getStudentProfile() async {
    final response = await _apiClient.get('/api/student/profile');
    if (response is Map<String, dynamic>) {
      _cachedProfile = StudentProfile.fromBackendJson(response);
      return _cachedProfile!;
    }
    throw Exception('Invalid profile response format');
  }

  @override
  Future<StudentProfile> updateStudentProfile(StudentProfile profile) async {
    final body = <String, dynamic>{
      'skills': profile.skills,
      'github': profile.githubHandle,
    };

    final response = await _apiClient.put('/api/student/profile', body: body);
    if (response is Map<String, dynamic>) {
      final studentData = response['student'] as Map<String, dynamic>? ?? response;
      _cachedProfile = StudentProfile.fromBackendJson(studentData);
      return _cachedProfile!;
    }
    _cachedProfile = profile;
    return profile;
  }

  // ==========================================
  // 2. Readiness Metric (LIVE via Profile)
  // ==========================================
  @override
  Future<ReadinessMetric> getReadinessMetric() async {
    final profile = _cachedProfile ?? await getStudentProfile();
    final overall = profile.readinessScore > 0 ? profile.readinessScore : 78;

    return ReadinessMetric(
      overallScore: overall,
      maxScore: 100,
      percentileText: 'Top ${overall >= 80 ? '12%' : '25%'} in CSE Batch',
      profileSummary: 'Calibrated readiness profile for core engineering drives.',
      scoreGainText: '+14 pts • Active',
      techDepthScore: (overall * 0.95).round().clamp(50, 98),
      starBehaviorScore: 82,
      systemArchScore: (overall * 0.9).round().clamp(50, 95),
      domainScores: [
        DomainScore(title: 'Core Technical Skills', score: (overall * 0.95).round().clamp(50, 98), category: 'technical'),
        DomainScore(title: 'System Architecture', score: (overall * 0.9).round().clamp(50, 95), category: 'arch'),
        DomainScore(title: 'Soft Skills & Communication', score: 82, category: 'soft_skills'),
        DomainScore(title: 'Resume & Portfolio Impact', score: profile.atsScore > 0 ? profile.atsScore : 80, category: 'resume'),
      ],
    );
  }

  // ==========================================
  // 3. Skills (LIVE via Profile)
  // ==========================================
  @override
  Future<List<SkillItem>> getSkills() async {
    final profile = _cachedProfile ?? await getStudentProfile();
    if (profile.skills.isNotEmpty) {
      return profile.skills.asMap().entries.map((entry) {
        final index = entry.key;
        final skillName = entry.value;
        return SkillItem(
          id: 'sk_$index',
          name: skillName,
          category: 'Core Skills',
          status: SkillStatus.strong,
          proficiency: 85,
        );
      }).toList();
    }
    return MockData.skills;
  }

  // ==========================================
  // 4. Job Opportunities (LIVE)
  // ==========================================
  @override
  Future<List<JobOpportunity>> getJobOpportunities() async {
    final response = await _apiClient.get('/api/student/jobs');
    if (response is List) {
      _cachedJobs = response
          .whereType<Map<String, dynamic>>()
          .map((item) {
            final job = JobOpportunity.fromBackendJson(item);
            return job.copyWith(
              hasApplied: _appliedJobIds.contains(job.id),
              isBookmarked: _bookmarkedJobIds.contains(job.id),
            );
          })
          .toList();
      return _cachedJobs;
    }
    return _cachedJobs;
  }

  @override
  Future<JobOpportunity?> getJobDetail(String jobId) async {
    if (_cachedJobs.isEmpty) {
      await getJobOpportunities();
    }
    try {
      return _cachedJobs.firstWhere((j) => j.id == jobId);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> toggleJobBookmark(String jobId) async {
    if (_bookmarkedJobIds.contains(jobId)) {
      _bookmarkedJobIds.remove(jobId);
    } else {
      _bookmarkedJobIds.add(jobId);
    }
    _cachedJobs = _cachedJobs.map((j) {
      if (j.id == jobId) {
        return j.copyWith(isBookmarked: _bookmarkedJobIds.contains(jobId));
      }
      return j;
    }).toList();
  }

  @override
  Future<void> applyForJob(String jobId) async {
    _appliedJobIds.add(jobId);
    _cachedJobs = _cachedJobs.map((j) {
      if (j.id == jobId) {
        return j.copyWith(hasApplied: true);
      }
      return j;
    }).toList();
  }

  // ==========================================
  // 5. Placement Alerts (LIVE)
  // ==========================================
  @override
  Future<List<PlacementAlert>> getPlacementAlerts() async {
    final response = await _apiClient.get('/api/notification');
    if (response is List) {
      _cachedAlerts = response
          .whereType<Map<String, dynamic>>()
          .map((item) {
            final alert = PlacementAlert.fromBackendJson(item);
            return alert.copyWith(
              isRead: _readAlertIds.contains(alert.id),
            );
          })
          .toList();
      return _cachedAlerts;
    }
    return _cachedAlerts;
  }

  @override
  Future<void> markAlertAsRead(String alertId) async {
    _readAlertIds.add(alertId);
    _cachedAlerts = _cachedAlerts.map((a) {
      if (a.id == alertId) {
        return a.copyWith(isRead: true);
      }
      return a;
    }).toList();
  }

  // ==========================================
  // 6. Resume Upload (LIVE)
  // ==========================================
  @override
  Future<String> uploadResume(List<int> bytes, String filename) async {
    final response = await _apiClient.uploadMultipart(
      '/api/student/resume',
      fieldName: 'resume',
      fileBytes: bytes,
      filename: filename,
    );

    if (response is Map<String, dynamic> && response['resumeUrl'] != null) {
      final resumeUrl = response['resumeUrl'] as String;
      if (_cachedProfile != null) {
        _cachedProfile = _cachedProfile!.copyWith(
          resumeUrl: resumeUrl,
          resumeVersion: 'Uploaded Resume ($filename)',
        );
      }
      return resumeUrl;
    }
    throw Exception('Resume upload did not return a valid URL');
  }

  // ==========================================
  // 7. Unsupported Features (Preserved Mocks)
  // ==========================================
  @override
  Future<List<GrowthTask>> getGrowthTasks() async {
    return _localTasks;
  }

  @override
  Future<GrowthTask> toggleTaskCompletion(String taskId) async {
    GrowthTask? updated;
    _localTasks = _localTasks.map((t) {
      if (t.id == taskId) {
        final nextState = !t.isCompleted;
        updated = t.copyWith(isCompleted: nextState);
        return updated!;
      }
      return t;
    }).toList();
    return updated ?? _localTasks.first;
  }

  @override
  Future<List<RoadmapMilestone>> getRoadmapMilestones() async {
    return _localMilestones;
  }

  @override
  Future<List<InterviewQuestion>> getMockInterviewQuestions() async {
    return _localInterviewQuestions;
  }

  @override
  Future<InterviewDiagnosticReport> getDiagnosticReport() async {
    return _localDiagnostic;
  }

  @override
  Future<List<PeerMatch>> getPeerMatches() async {
    return _localPeers;
  }
}
