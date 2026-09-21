import '../models/growth_task.dart';
import '../models/job_opportunity.dart';
import '../models/mock_interview.dart';
import '../models/peer_match.dart';
import '../models/placement_alert.dart';
import '../models/placement_prediction.dart';
import '../models/readiness_metric.dart';
import '../models/roadmap_milestone.dart';
import '../models/skill_intelligence.dart';
import '../models/student_profile.dart';

abstract class SipsRepository {
  Future<StudentProfile> getStudentProfile();
  Future<StudentProfile> updateStudentProfile(StudentProfile profile);

  Future<PlacementPrediction?> getLatestPlacementPrediction();
  Future<PlacementPrediction> requestPlacementPrediction();

  Future<ReadinessMetric> getReadinessMetric();

  Future<List<SkillItem>> getSkills();
  Future<List<JobOpportunity>> getJobOpportunities();
  Future<JobOpportunity?> getJobDetail(String jobId);
  Future<void> toggleJobBookmark(String jobId);
  Future<void> applyForJob(String jobId);

  Future<List<GrowthTask>> getGrowthTasks();
  Future<GrowthTask> toggleTaskCompletion(String taskId);

  Future<List<RoadmapMilestone>> getRoadmapMilestones();

  Future<List<InterviewQuestion>> getMockInterviewQuestions();
  Future<InterviewDiagnosticReport> getDiagnosticReport();

  Future<List<PeerMatch>> getPeerMatches();

  Future<List<PlacementAlert>> getPlacementAlerts();
  Future<void> markAlertAsRead(String alertId);
  Future<String> uploadResume(List<int> bytes, String filename);
  Future<String> uploadProfileImage(List<int> bytes, String filename);
  Future<void> deleteProfileImage();
}

