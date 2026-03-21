import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginUser, getCollegeBySlug } from '../api';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { collegeSlug } = useParams();
  const navigate = useNavigate();
  const { login, isAuthenticated, role, collegeSlug: authSlug } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [collegeName, setCollegeName] = useState('');
  const [collegeNotFound, setCollegeNotFound] = useState(false);

  useEffect(() => {
    if (isAuthenticated && authSlug) {
      const dest = role === 'COLLEGE_ADMIN'
        ? `/${authSlug}/admin-dashboard`
        : `/${authSlug}/student-dashboard`;
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, role, authSlug, navigate]);

  useEffect(() => {
    if (collegeSlug) {
      getCollegeBySlug(collegeSlug)
        .then(res => {
          setCollegeName(res.data.name);
          setCollegeNotFound(false);
        })
        .catch(() => {
          setCollegeNotFound(true);
        });
    }
  }, [collegeSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginUser(email, password);
      login(res.data);

      const dest = res.data.role === 'COLLEGE_ADMIN'
        ? `/${res.data.collegeSlug}/admin-dashboard`
        : `/${res.data.collegeSlug}/student-dashboard`;
      navigate(dest);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (collegeNotFound && collegeSlug) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">College Not Found</h2>
          <p className="text-white/50 mb-6">The college code "{collegeSlug}" doesn't exist.</p>
          <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold font-['Manrope',sans-serif] text-white tracking-tight">SIPS</span>
          </Link>
          {collegeName ? (
            <p className="text-white/40 text-sm">
              Signing in to <span className="text-indigo-400 font-medium">{collegeName}</span>
            </p>
          ) : (
            <p className="text-white/40 text-sm">
              Sign in to your placement portal
            </p>
          )}
        </div>

        {/* Login Card */}
        <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl">
          <h1 className="text-2xl font-bold font-['Manrope',sans-serif] text-white mb-1">Welcome back</h1>
          <p className="text-white/40 text-sm mb-8">Enter your credentials to access your dashboard</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Email Address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all text-sm"
              />
              <p className="text-xs text-white/30 mt-2">Students: default password is your Roll Number</p>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          College admin? <Link to="/register-college" className="text-indigo-400 hover:text-indigo-300 transition-colors">Register your college</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
