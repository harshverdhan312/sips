import '../mock/mock_data.dart';
import '../models/growth_task.dart';
import '../models/job_match_analysis.dart';
import '../models/job_opportunity.dart';
import '../models/mock_interview.dart';
import '../models/peer_match.dart';
import '../models/placement_alert.dart';
import '../models/placement_prediction.dart';
import '../models/readiness_metric.dart';
import '../models/roadmap_milestone.dart';
import '../models/skill_intelligence.dart';
import '../models/student_profile.dart';
import 'sips_repository.dart';

class MockSipsRepository implements SipsRepository {
  StudentProfile _profile = MockData.studentProfile;
  PlacementPrediction? _prediction;
  ReadinessMetric _readiness = MockData.readinessMetric;
  final List<SkillItem> _skills = List.from(MockData.skills);
  List<JobOpportunity> _jobs = List.from(MockData.jobs);
  List<GrowthTask> _tasks = List.from(MockData.tasks);
  final List<RoadmapMilestone> _milestones = List.from(MockData.roadmapMilestones);
  final List<InterviewQuestion> _interviewQuestions = List.from(MockData.mockInterviewQuestions);
  final InterviewDiagnosticReport _diagnostic = MockData.diagnosticReport;
  final List<PeerMatch> _peers = List.from(MockData.peers);
  List<PlacementAlert> _alerts = List.from(MockData.alerts);

  @override
  Future<StudentProfile> getStudentProfile() async {
    return _profile;
  }

  @override
  Future<StudentProfile> updateStudentProfile(StudentProfile profile) async {
    _profile = profile;
    return _profile;
  }

  @override
  Future<PlacementPrediction?> getLatestPlacementPrediction() async {
    return _prediction;
  }

  @override
  Future<PlacementPrediction> requestPlacementPrediction() async {
    throw UnsupportedError('ML Prediction is only supported in live backend mode');
  }

  @override
  Future<ReadinessMetric> getReadinessMetric() async {
    return _readiness;
  }

  @override
  Future<List<SkillItem>> getSkills() async {
    return _skills;
  }

  @override
  Future<List<JobOpportunity>> getJobOpportunities() async {
    return _jobs;
  }

  @override
  Future<JobOpportunity?> getJobDetail(String jobId) async {
    try {
      return _jobs.firstWhere((j) => j.id == jobId);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<JobMatchAnalysis> analyzeJobMatch(String jobId) async {
    final job = await getJobDetail(jobId);
    final role = job?.role ?? 'Role';
    final company = job?.company ?? 'Company';
    final matched = job?.matchedSkills ?? [];
    final missing = job?.missingSkills ?? [];
    final score = (job?.matchScore ?? 75).toDouble();
    return JobMatchAnalysis(
      jobId: jobId,
      jobTitle: role,
      company: company,
      mlStatus: 'completed',
      matchedSkills: matched,
      missingSkills: missing,
      skillCoverageScore: score,
      semanticSimilarity: score / 100.0,
      semanticScore: score,
      hybridMatchScore: score,
      skillWeight: 0.6,
      semanticWeight: 0.4,
    );
  }

  @override
  Future<void> toggleJobBookmark(String jobId) async {
    _jobs = _jobs.map((j) {
      if (j.id == jobId) {
        return j.copyWith(isBookmarked: !j.isBookmarked);
      }
      return j;
    }).toList();
  }

  @override
  Future<void> applyForJob(String jobId) async {
    _jobs = _jobs.map((j) {
      if (j.id == jobId) {
        return j.copyWith(hasApplied: true);
      }
      return j;
    }).toList();
  }

  @override
  Future<List<GrowthTask>> getGrowthTasks() async {
    return _tasks;
  }

  @override
  Future<GrowthTask> toggleTaskCompletion(String taskId) async {
    GrowthTask? updated;
    _tasks = _tasks.map((t) {
      if (t.id == taskId) {
        final nextState = !t.isCompleted;
        updated = t.copyWith(isCompleted: nextState);
        // If completed, dynamically recalculate readiness metric!
        if (nextState) {
          _readiness = _readiness.copyWith(
            overallScore: (_readiness.overallScore + t.scoreBoost.round()).clamp(0, 100),
          );
        } else {
          _readiness = _readiness.copyWith(
            overallScore: (_readiness.overallScore - t.scoreBoost.round()).clamp(0, 100),
          );
        }
        return updated!;
      }
      return t;
    }).toList();

    return updated ?? _tasks.first;
  }

  @override
  Future<List<RoadmapMilestone>> getRoadmapMilestones() async {
    return _milestones;
  }

  @override
  Future<List<InterviewQuestion>> getMockInterviewQuestions() async {
    return _interviewQuestions;
  }

  @override
  Future<InterviewDiagnosticReport> getDiagnosticReport() async {
    return _diagnostic;
  }

  @override
  Future<List<PeerMatch>> getPeerMatches() async {
    return _peers;
  }

  @override
  Future<List<PlacementAlert>> getPlacementAlerts() async {
    return _alerts;
  }

  @override
  Future<void> markAlertAsRead(String alertId) async {
    _alerts = _alerts.map((a) {
      if (a.id == alertId) {
        return a.copyWith(isRead: true);
      }
      return a;
    }).toList();
  }

  @override
  Future<String> uploadResume(List<int> bytes, String filename) async {
    _profile = _profile.copyWith(
      resumeUrl: '/uploads/$filename',
      resumeVersion: 'v3.5 (Uploaded $filename)',
    );
    return _profile.resumeUrl;
  }

  @override
  Future<String> uploadProfileImage(List<int> bytes, String filename) async {
    final imageUrl = '/uploads/$filename';
    _profile = _profile.copyWith(profileImageUrl: imageUrl);
    return imageUrl;
  }

  @override
  Future<void> deleteProfileImage() async {
    _profile = _profile.copyWith(profileImageUrl: '');
  }
}
