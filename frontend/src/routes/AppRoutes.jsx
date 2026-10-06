import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";
import { DashboardLayout } from "../components/layout/DashboardLayout";

// Helper for dynamic named imports with React.lazy
const lazyNamed = (importFn, name) =>
  lazy(() => importFn().then((module) => ({ default: module[name] })));

// Eagerly loaded public entry pages for instant first paint
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";

// Lazy-loaded Public Pages
const PublicStudentProfilePage = lazyNamed(() => import("../pages/public/PublicStudentProfilePage"), "PublicStudentProfilePage");
const PrivacyPolicyPage = lazyNamed(() => import("../pages/legal/PrivacyPolicyPage"), "PrivacyPolicyPage");
const TermsOfServicePage = lazyNamed(() => import("../pages/legal/TermsOfServicePage"), "TermsOfServicePage");
const DataSecurityPage = lazyNamed(() => import("../pages/legal/DataSecurityPage"), "DataSecurityPage");

// Lazy-loaded Student Pages
const StudentDashboard = lazyNamed(() => import("../pages/student/StudentDashboard"), "StudentDashboard");
const ResumeAnalysisPage = lazyNamed(() => import("../pages/student/ResumeAnalysisPage"), "ResumeAnalysisPage");
const SkillGapPage = lazyNamed(() => import("../pages/student/SkillGapPage"), "SkillGapPage");
const PlacementReadinessPage = lazyNamed(() => import("../pages/student/PlacementReadinessPage"), "PlacementReadinessPage");
const MockInterviewPage = lazyNamed(() => import("../pages/student/MockInterviewPage"), "MockInterviewPage");
const StarTrackerPage = lazyNamed(() => import("../pages/student/StarTrackerPage"), "StarTrackerPage");
const BehavioralTasksPage = lazyNamed(() => import("../pages/student/BehavioralTasksPage"), "BehavioralTasksPage");
const PeerMatchingPage = lazyNamed(() => import("../pages/student/PeerMatchingPage"), "PeerMatchingPage");
const RecommendationsPage = lazyNamed(() => import("../pages/student/RecommendationsPage"), "RecommendationsPage");
const StudentJobsPage = lazyNamed(() => import("../pages/student/StudentJobsPage"), "StudentJobsPage");
const StudentProfilePage = lazyNamed(() => import("../pages/student/StudentProfilePage"), "StudentProfilePage");
const PracticeHubPage = lazyNamed(() => import("../pages/student/PracticeHubPage"), "PracticeHubPage");
const PracticeHistoryPage = lazyNamed(() => import("../pages/student/PracticeHistoryPage"), "PracticeHistoryPage");
const PracticeSessionPage = lazyNamed(() => import("../pages/student/PracticeSessionPage"), "PracticeSessionPage");
const PracticeResultPage = lazyNamed(() => import("../pages/student/PracticeResultPage"), "PracticeResultPage");
const CodingQuestionListPage = lazyNamed(() => import("../pages/student/CodingQuestionListPage"), "CodingQuestionListPage");
const CodingArenaPage = lazyNamed(() => import("../pages/student/CodingArenaPage"), "CodingArenaPage");
const ContestListPage = lazyNamed(() => import("../pages/student/ContestListPage"), "ContestListPage");
const ContestDetailsPage = lazyNamed(() => import("../pages/student/ContestDetailsPage"), "ContestDetailsPage");
const ContestWorkspacePage = lazyNamed(() => import("../pages/student/ContestWorkspacePage"), "ContestWorkspacePage");
const ContestResultPage = lazyNamed(() => import("../pages/student/ContestResultPage"), "ContestResultPage");
const ContestLeaderboardPage = lazyNamed(() => import("../pages/student/ContestLeaderboardPage"), "ContestLeaderboardPage");
const StudentAssessmentListPage = lazyNamed(() => import("../pages/student/StudentAssessmentListPage"), "StudentAssessmentListPage");
const StudentAssessmentDetailsPage = lazyNamed(() => import("../pages/student/StudentAssessmentDetailsPage"), "StudentAssessmentDetailsPage");
const StudentAssessmentWorkspacePage = lazyNamed(() => import("../pages/student/StudentAssessmentWorkspacePage"), "StudentAssessmentWorkspacePage");
const StudentAssessmentResultPage = lazyNamed(() => import("../pages/student/StudentAssessmentResultPage"), "StudentAssessmentResultPage");

// Lazy-loaded Placement Cell Pages
const PlacementDashboard = lazyNamed(() => import("../pages/placement/PlacementDashboard"), "PlacementDashboard");
const StudentManagementPage = lazyNamed(() => import("../pages/placement/StudentManagementPage"), "StudentManagementPage");
const JobDescriptionsPage = lazyNamed(() => import("../pages/placement/JobDescriptionsPage"), "JobDescriptionsPage");
const PlacementAnalyticsPage = lazyNamed(() => import("../pages/placement/PlacementAnalyticsPage"), "PlacementAnalyticsPage");
const PlacementReportsPage = lazyNamed(() => import("../pages/placement/PlacementReportsPage"), "PlacementReportsPage");

// Lazy-loaded Admin Pages
const AdminDashboard = lazyNamed(() => import("../pages/admin/AdminDashboard"), "AdminDashboard");
const AdminUserManagementPage = lazyNamed(() => import("../pages/admin/AdminUserManagementPage"), "AdminUserManagementPage");
const AdminStudentsPage = lazyNamed(() => import("../pages/admin/AdminStudentsPage"), "AdminStudentsPage");
const AdminAnalyticsPage = lazyNamed(() => import("../pages/admin/AdminAnalyticsPage"), "AdminAnalyticsPage");
const AdminSettingsPage = lazyNamed(() => import("../pages/admin/AdminSettingsPage"), "AdminSettingsPage");
const CollegeProfilePage = lazyNamed(() => import("../pages/admin/CollegeProfilePage"), "CollegeProfilePage");
const QuestionListPage = lazyNamed(() => import("../pages/admin/QuestionListPage"), "QuestionListPage");
const QuestionDetailsPage = lazyNamed(() => import("../pages/admin/QuestionDetailsPage"), "QuestionDetailsPage");
const AssessmentListPage = lazyNamed(() => import("../pages/admin/AssessmentListPage"), "AssessmentListPage");
const AssessmentBuilderPage = lazyNamed(() => import("../pages/admin/AssessmentBuilderPage"), "AssessmentBuilderPage");
const AssessmentResultsPage = lazyNamed(() => import("../pages/admin/AssessmentResultsPage"), "AssessmentResultsPage");
const DepartmentProfilePage = lazyNamed(() => import("../pages/admin/DepartmentProfilePage"), "DepartmentProfilePage");

// Lazy-loaded University / Institution Admin Pages
const InstitutionDashboard = lazyNamed(() => import("../pages/institution/InstitutionDashboard"), "InstitutionDashboard");
const DepartmentsPage = lazyNamed(() => import("../pages/institution/DepartmentsPage"), "DepartmentsPage");

// Lazy-loaded Super Admin Pages
const SuperAdminDashboard = lazyNamed(() => import("../pages/superadmin/SuperAdminDashboard"), "SuperAdminDashboard");
const CollegeApprovalsPage = lazyNamed(() => import("../pages/superadmin/CollegeApprovalsPage"), "CollegeApprovalsPage");
const InstitutionsDirectoryPage = lazyNamed(() => import("../pages/superadmin/InstitutionsDirectoryPage"), "InstitutionsDirectoryPage");
const GlobalQuestionBankPage = lazyNamed(() => import("../pages/superadmin/GlobalQuestionBankPage"), "GlobalQuestionBankPage");

function RouteLoadingFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-3" />
      <span className="text-xs font-mono font-semibold text-slate-500">Loading workspace module...</span>
    </div>
  );
}

export function AppRoutes() {
  const { role, isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Public Marketing & Gateway Layer */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/security" element={<DataSecurityPage />} />

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
            <Route path="/super_admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super_admin/approvals" element={<CollegeApprovalsPage />} />
            <Route path="/super_admin/institutions" element={<InstitutionsDirectoryPage />} />
            <Route path="/super_admin/questions" element={<GlobalQuestionBankPage />} />
            <Route path="/superadmin/*" element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="/super_admin/*" element={<Navigate to="/super-admin/dashboard" replace />} />
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
            <Route path="/student/resume" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/student/skills" element={<SkillGapPage />} />
            <Route path="/student/skill-analysis" element={<SkillGapPage />} />
            <Route path="/student/readiness" element={<PlacementReadinessPage />} />
            <Route path="/student/placement-readiness" element={<PlacementReadinessPage />} />
            <Route path="/student/interview" element={<MockInterviewPage />} />
            <Route path="/student/mock-interview" element={<MockInterviewPage />} />
            <Route path="/student/star" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/student/star-tracker" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/student/tasks" element={<BehavioralTasksPage />} />
            <Route path="/student/behavioral-tasks" element={<BehavioralTasksPage />} />
            <Route path="/student/peers" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/student/peer-matching" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/student/jobs" element={<StudentJobsPage />} />
            <Route path="/student/recommendations" element={<Navigate to="/student/dashboard" replace />} />
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
    </Suspense>
  );
}
