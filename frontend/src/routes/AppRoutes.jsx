import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";
import { DashboardLayout } from "../components/layout/DashboardLayout";

// Auth
import { LoginPage } from "../pages/auth/LoginPage";
import { LandingPage } from "../pages/LandingPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PublicStudentProfilePage } from "../pages/public/PublicStudentProfilePage";

// Student Pages
import { StudentDashboard } from "../pages/student/StudentDashboard";
import { ResumeAnalysisPage } from "../pages/student/ResumeAnalysisPage";
import { SkillGapPage } from "../pages/student/SkillGapPage";
import { PlacementReadinessPage } from "../pages/student/PlacementReadinessPage";
import { MockInterviewPage } from "../pages/student/MockInterviewPage";
import { StarTrackerPage } from "../pages/student/StarTrackerPage";
import { BehavioralTasksPage } from "../pages/student/BehavioralTasksPage";
import { PeerMatchingPage } from "../pages/student/PeerMatchingPage";
import { RecommendationsPage } from "../pages/student/RecommendationsPage";
import { StudentJobsPage } from "../pages/student/StudentJobsPage";
import { StudentProfilePage } from "../pages/student/StudentProfilePage";
import { PracticeHubPage } from "../pages/student/PracticeHubPage";
import { PracticeHistoryPage } from "../pages/student/PracticeHistoryPage";
import { PracticeSessionPage } from "../pages/student/PracticeSessionPage";
import { PracticeResultPage } from "../pages/student/PracticeResultPage";
import { CodingQuestionListPage } from "../pages/student/CodingQuestionListPage";
import { CodingArenaPage } from "../pages/student/CodingArenaPage";
import { ContestListPage } from "../pages/student/ContestListPage";
import { ContestDetailsPage } from "../pages/student/ContestDetailsPage";
import { ContestWorkspacePage } from "../pages/student/ContestWorkspacePage";
import { ContestResultPage } from "../pages/student/ContestResultPage";
import { ContestLeaderboardPage } from "../pages/student/ContestLeaderboardPage";
import { StudentAssessmentListPage } from "../pages/student/StudentAssessmentListPage";
import { StudentAssessmentDetailsPage } from "../pages/student/StudentAssessmentDetailsPage";
import { StudentAssessmentWorkspacePage } from "../pages/student/StudentAssessmentWorkspacePage";
import { StudentAssessmentResultPage } from "../pages/student/StudentAssessmentResultPage";

// Placement Cell Pages
import { PlacementDashboard } from "../pages/placement/PlacementDashboard";
import { StudentManagementPage } from "../pages/placement/StudentManagementPage";
import { JobDescriptionsPage } from "../pages/placement/JobDescriptionsPage";
import { PlacementAnalyticsPage } from "../pages/placement/PlacementAnalyticsPage";
import { PlacementReportsPage } from "../pages/placement/PlacementReportsPage";

// Admin Pages
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { AdminUserManagementPage } from "../pages/admin/AdminUserManagementPage";
import { AdminStudentsPage } from "../pages/admin/AdminStudentsPage";
import { AdminAnalyticsPage } from "../pages/admin/AdminAnalyticsPage";
import { AdminSettingsPage } from "../pages/admin/AdminSettingsPage";
import { CollegeProfilePage } from "../pages/admin/CollegeProfilePage";
import { QuestionListPage } from "../pages/admin/QuestionListPage";
import { QuestionDetailsPage } from "../pages/admin/QuestionDetailsPage";
import { AssessmentListPage } from "../pages/admin/AssessmentListPage";
import { AssessmentBuilderPage } from "../pages/admin/AssessmentBuilderPage";
import { AssessmentResultsPage } from "../pages/admin/AssessmentResultsPage";

// University / Institution Admin Pages
import { InstitutionDashboard } from "../pages/institution/InstitutionDashboard";
import { DepartmentsPage } from "../pages/institution/DepartmentsPage";

// Super Admin Pages
import { SuperAdminDashboard } from "../pages/superadmin/SuperAdminDashboard";
import { CollegeApprovalsPage } from "../pages/superadmin/CollegeApprovalsPage";
import { InstitutionsDirectoryPage } from "../pages/superadmin/InstitutionsDirectoryPage";
import { GlobalQuestionBankPage } from "../pages/superadmin/GlobalQuestionBankPage";

import { DepartmentProfilePage } from "../pages/admin/DepartmentProfilePage";

export function AppRoutes() {
  const { role, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Marketing & Gateway Layer */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Login & Registration */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/onboard" element={<LoginPage initialRegisterMode={true} />} />

      {/* Aliases for Canonical Dashboard and Student Routes */}
      <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />
      <Route path="/students" element={<Navigate to="/student/dashboard" replace />} />
      <Route path="/students/dashboard" element={<Navigate to="/student/dashboard" replace />} />
      <Route path="/students/*" element={<Navigate to="/student/dashboard" replace />} />

      {/* Public Student Career Profile */}
      <Route path="/u/:username" element={<PublicStudentProfilePage />} />

      {/* Super Admin Portal Routes */}
      <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/super-admin/approvals" element={<CollegeApprovalsPage />} />
          <Route path="/super-admin/institutions" element={<InstitutionsDirectoryPage />} />
          <Route path="/super-admin/questions" element={<GlobalQuestionBankPage />} />
          <Route path="/superadmin/*" element={<Navigate to="/super-admin/dashboard" replace />} />
        </Route>
      </Route>

      {/* University / Institution Admin Portal Routes */}
      <Route element={<ProtectedRoute allowedRoles={["university_admin", "admin"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/institution/dashboard" element={<InstitutionDashboard />} />
          <Route path="/institution/assessments" element={<AssessmentListPage />} />
          <Route path="/institution/assessments/:assessmentId" element={<AssessmentBuilderPage />} />
          <Route path="/institution/assessments/:assessmentId/results" element={<AssessmentResultsPage />} />
          <Route path="/institution/questions" element={<QuestionListPage />} />
          <Route path="/institution/questions/:questionId" element={<QuestionDetailsPage />} />
          <Route path="/institution/profile" element={<CollegeProfilePage />} />
          <Route path="/institution/departments" element={<DepartmentsPage />} />
          <Route path="/university_admin/dashboard" element={<InstitutionDashboard />} />
        </Route>
      </Route>

      {/* Student Portal Routes */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/practice" element={<PracticeHubPage />} />
          <Route path="/student/practice/history" element={<PracticeHistoryPage />} />
          <Route path="/student/practice/coding" element={<CodingQuestionListPage />} />
          <Route path="/student/practice/coding/:attemptId" element={<CodingArenaPage />} />
          <Route path="/student/practice/attempt/:attemptId" element={<PracticeSessionPage />} />
          <Route path="/student/practice/attempt/:attemptId/result" element={<PracticeResultPage />} />
          <Route path="/student/contests" element={<ContestListPage />} />
          <Route path="/student/contests/:contestId" element={<ContestDetailsPage />} />
          <Route path="/student/contests/:contestId/leaderboard" element={<ContestLeaderboardPage />} />
          <Route path="/student/contests/:contestId/attempt/:attemptId" element={<ContestWorkspacePage />} />
          <Route path="/student/contests/:contestId/attempt/:attemptId/result" element={<ContestResultPage />} />
          <Route path="/student/contests/:contestId/result/:attemptId" element={<ContestResultPage />} />
          <Route path="/student/assessments" element={<StudentAssessmentListPage />} />
          <Route path="/student/assessments/:assessmentId" element={<StudentAssessmentDetailsPage />} />
          <Route path="/student/assessments/:assessmentId/attempt/:attemptId" element={<StudentAssessmentWorkspacePage />} />
          <Route path="/student/assessments/:assessmentId/result/:attemptId" element={<StudentAssessmentResultPage />} />
          <Route path="/student/assessments/:assessmentId/attempt/:attemptId/result" element={<StudentAssessmentResultPage />} />
          <Route path="/student/resume" element={<ResumeAnalysisPage />} />
          <Route path="/student/skills" element={<SkillGapPage />} />
          <Route path="/student/skill-analysis" element={<SkillGapPage />} />
          <Route path="/student/readiness" element={<PlacementReadinessPage />} />
          <Route path="/student/placement-readiness" element={<PlacementReadinessPage />} />
          <Route path="/student/interview" element={<MockInterviewPage />} />
          <Route path="/student/mock-interview" element={<MockInterviewPage />} />
          <Route path="/student/star" element={<StarTrackerPage />} />
          <Route path="/student/star-tracker" element={<StarTrackerPage />} />
          <Route path="/student/tasks" element={<BehavioralTasksPage />} />
          <Route path="/student/behavioral-tasks" element={<BehavioralTasksPage />} />
          <Route path="/student/peers" element={<PeerMatchingPage />} />
          <Route path="/student/peer-matching" element={<PeerMatchingPage />} />
          <Route path="/student/jobs" element={<StudentJobsPage />} />
          <Route path="/student/recommendations" element={<RecommendationsPage />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
        </Route>
      </Route>

      {/* Placement Cell Portal Routes */}
      <Route element={<ProtectedRoute allowedRoles={["placement"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/placement/dashboard" element={<PlacementDashboard />} />
          <Route path="/placement/assessments" element={<AssessmentListPage />} />
          <Route path="/placement/assessments/:assessmentId" element={<AssessmentBuilderPage />} />
          <Route path="/placement/assessments/:assessmentId/results" element={<AssessmentResultsPage />} />
          <Route path="/placement/questions" element={<QuestionListPage />} />
          <Route path="/placement/questions/:questionId" element={<QuestionDetailsPage />} />
          <Route path="/placement/students" element={<StudentManagementPage />} />
          <Route path="/placement/jobs" element={<JobDescriptionsPage />} />
          <Route path="/placement/job-descriptions" element={<JobDescriptionsPage />} />
          <Route path="/placement/analytics" element={<PlacementAnalyticsPage />} />
          <Route path="/placement/reports" element={<PlacementReportsPage />} />
          <Route path="/placement/profile" element={<DepartmentProfilePage />} />
          <Route path="/placement/college-profile" element={<DepartmentProfilePage />} />
        </Route>
      </Route>

      {/* Admin Portal Routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/assessments" element={<AssessmentListPage />} />
          <Route path="/admin/assessments/:assessmentId" element={<AssessmentBuilderPage />} />
          <Route path="/admin/assessments/:assessmentId/results" element={<AssessmentResultsPage />} />
          <Route path="/admin/questions" element={<QuestionListPage />} />
          <Route path="/admin/questions/:questionId" element={<QuestionDetailsPage />} />
          <Route path="/admin/users" element={<AdminUserManagementPage />} />
          <Route path="/admin/students" element={<AdminStudentsPage />} />
          <Route path="/admin/placement-cell" element={<AdminUserManagementPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/profile" element={<DepartmentProfilePage />} />
          <Route path="/admin/college-profile" element={<DepartmentProfilePage />} />
        </Route>
      </Route>

      {/* 404 Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
