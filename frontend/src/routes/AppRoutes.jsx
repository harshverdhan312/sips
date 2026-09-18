import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";
import { DashboardLayout } from "../components/layout/DashboardLayout";

// Auth
import { LoginPage } from "../pages/auth/LoginPage";
import { LandingPage } from "../pages/LandingPage";
import { NotFoundPage } from "../pages/NotFoundPage";

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

export function AppRoutes() {
  const { role, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Marketing & Gateway Layer */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Student Portal Routes */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
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
          <Route path="/placement/students" element={<StudentManagementPage />} />
          <Route path="/placement/jobs" element={<JobDescriptionsPage />} />
          <Route path="/placement/job-descriptions" element={<JobDescriptionsPage />} />
          <Route path="/placement/analytics" element={<PlacementAnalyticsPage />} />
          <Route path="/placement/reports" element={<PlacementReportsPage />} />
        </Route>
      </Route>

      {/* Admin Portal Routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUserManagementPage />} />
          <Route path="/admin/students" element={<AdminStudentsPage />} />
          <Route path="/admin/placement-cell" element={<AdminUserManagementPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      {/* 404 Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
