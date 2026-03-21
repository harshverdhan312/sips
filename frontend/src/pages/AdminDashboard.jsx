import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getStudents, getJDs } from '../api';
import DashboardLayout from '../components/layout/DashboardLayout';
import UploadStudents from '../components/admin/UploadStudents';
import UploadJD from '../components/admin/UploadJD';
import StudentList from '../components/admin/StudentList';
import Recommendations from '../components/admin/Recommendations';
import NotificationManager from '../components/admin/NotificationManager';

const AdminDashboard = () => {
  const { collegeSlug } = useParams();
  const navigate = useNavigate();
  const { isAdmin, collegeName, collegeSlug: authSlug } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [stats, setStats] = useState({ students: 0, jds: 0 });

  useEffect(() => {
    if (!isAdmin || authSlug !== collegeSlug) {
      navigate('/', { replace: true });
    }
  }, [isAdmin, authSlug, collegeSlug, navigate]);

  useEffect(() => {
    Promise.all([getStudents(), getJDs()])
      .then(([studRes, jdRes]) => {
        setStats({ students: studRes.data.length, jds: jdRes.data.length });
      })
      .catch(console.error);
  }, [activeView]);

  const navItems = [
    {
      id: 'dashboard', label: 'Dashboard',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
    },
    {
      id: 'upload-students', label: 'Upload Students',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
    },
    {
      id: 'upload-jd', label: 'Upload JD',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
    },
    {
      id: 'students', label: 'View Students',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
    },
    {
      id: 'recommendations', label: 'Recommendations',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
    }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'upload-students': return <UploadStudents />;
      case 'upload-jd': return <UploadJD />;
      case 'students': return <StudentList />;
      case 'recommendations': return <Recommendations />;
      default: return (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold font-['Manrope',sans-serif] mb-1">
              Welcome back<span className="text-indigo-400">.</span>
            </h2>
            <p className="text-white/40 text-sm">Here's your placement cell overview</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Students', value: stats.students, color: 'indigo' },
              { label: 'Active JDs', value: stats.jds, color: 'purple' },
              { label: 'Match Rate', value: '—', color: 'blue' }
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">{stat.label}</p>
                <p className="text-3xl font-bold font-['Manrope',sans-serif] bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <h3 className="text-sm font-medium text-white/60 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setActiveView('upload-students')} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-left">
                <div className="text-sm font-medium mb-1">Upload Students</div>
                <div className="text-xs text-white/30">Add students via CSV</div>
              </button>
              <button onClick={() => setActiveView('upload-jd')} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-left">
                <div className="text-sm font-medium mb-1">Create Job Description</div>
                <div className="text-xs text-white/30">Add a new JD to match</div>
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <DashboardLayout
      navItems={navItems}
      activeView={activeView}
      onNavChange={setActiveView}
      subtitle={collegeName || collegeSlug}
      title={null}
      rightSidebar={<NotificationManager isAdmin={true} />}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default AdminDashboard;
