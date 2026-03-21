import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { registerCollege } from '../api';

const CollegeRegistration = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    slug: '',
    adminEmail: '',
    masterPassword: '',
    confirmPassword: ''
  });
  const [domains, setDomains] = useState([]);
  const [domainInput, setDomainInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setForm(prev => ({ ...prev, slug }));
    }
  };

  const addDomain = () => {
    const d = domainInput.trim().toLowerCase();
    if (!d) return;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) {
      setError('Invalid domain format');
      return;
    }
    if (domains.includes(d)) {
      setError('Domain already added');
      return;
    }
    setDomains(prev => [...prev, d]);
    setDomainInput('');
    setError('');
  };

  const removeDomain = (d) => {
    setDomains(prev => prev.filter(x => x !== d));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.masterPassword !== form.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (domains.length === 0) {
      return setError('At least one accepted domain is required');
    }
    if (form.masterPassword.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await registerCollege({
        name: form.name,
        slug: form.slug,
        adminEmail: form.adminEmail,
        masterPassword: form.masterPassword,
        acceptedDomains: domains
      });
      navigate(`/${form.slug}/login`);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-bold font-['Manrope',sans-serif] text-white tracking-tight">SIPS</span>
          </Link>
          <h1 className="text-2xl font-bold font-['Manrope',sans-serif] text-white">Register Your College</h1>
          <p className="text-white/40 text-sm mt-1">Set up your placement intelligence platform</p>
        </div>

        <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl">
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
              <label className="block text-sm font-medium text-white/60 mb-2">College Name</label>
              <input
                id="reg-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., PSIT College of Technology"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">College Slug (URL)</label>
              <div className="flex items-center gap-2">
                <span className="text-white/30 text-sm shrink-0">sips.com/</span>
                <input
                  id="reg-slug"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="psit"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Admin Email</label>
              <input
                id="reg-email"
                name="adminEmail"
                type="email"
                value={form.adminEmail}
                onChange={handleChange}
                placeholder="admin@psit.ac.in"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Master Password</label>
              <input
                id="reg-password"
                name="masterPassword"
                type="password"
                value={form.masterPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Confirm Password</label>
              <input
                id="reg-confirm-password"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
              />
            </div>

            {/* Domains */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Accepted Email Domains</label>
              <div className="flex gap-2">
                <input
                  id="reg-domain-input"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                  placeholder="psit.ac.in"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={addDomain}
                  className="px-4 py-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-sm font-medium hover:bg-indigo-500/30 transition-all"
                >
                  Add
                </button>
              </div>
              {domains.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {domains.map(d => (
                    <span key={d} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs">
                      @{d}
                      <button
                        type="button"
                        onClick={() => removeDomain(d)}
                        className="text-indigo-400/60 hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              id="reg-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 mt-2"
            >
              {loading ? 'Registering...' : 'Register College'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          Already registered? <Link to="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">Go back home</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default CollegeRegistration;
