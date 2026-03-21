import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showSlugInput, setShowSlugInput] = useState(false);
  const [slugValue, setSlugValue] = useState('');

  const handleSlugSubmit = () => {
    const s = slugValue.trim().toLowerCase();
    if (s) navigate(`/${s}/login`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Inter',sans-serif]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold font-['Manrope',sans-serif] tracking-tight">SIPS</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register-college')}
              className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
            >
              Register College
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />

        <div className="relative max-w-5xl mx-auto px-6 pt-32 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/60 mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              AI-Powered Placement Intelligence
            </div>

            <h1 className="text-5xl md:text-7xl font-bold font-['Manrope',sans-serif] tracking-tight leading-[1.1] mb-6">
              Smart Placement
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Intelligence for Colleges
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed">
              Upload job descriptions, analyze student skills, and get instant AI-powered recommendations. 
              The modern placement cell platform built for scale.
            </p>

            <div className="flex flex-col items-center gap-6">
              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="group px-8 py-4 text-base font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02]"
                >
                  Login
                  <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
                </button>
                <button
                  onClick={() => navigate('/register-college')}
                  className="px-8 py-4 text-base font-semibold text-white/80 border border-white/10 rounded-2xl hover:bg-white/5 hover:border-white/20 transition-all hover:scale-[1.02]"
                >
                  Register Your College
                </button>
              </div>

              {/* College Slug Quick Access */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setShowSlugInput(!showSlugInput)}
                  className="text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  Go to your college portal directly →
                </button>

                <AnimatePresence>
                  {showSlugInput && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className="flex items-center gap-2 mt-1"
                    >
                      <span className="text-white/20 text-sm">sips.com /</span>
                      <input
                        value={slugValue}
                        onChange={(e) => setSlugValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSlugSubmit()}
                        placeholder="college-slug"
                        autoFocus
                        className="px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all text-sm w-40"
                      />
                      <button
                        onClick={handleSlugSubmit}
                        className="px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-sm font-medium hover:bg-indigo-500/30 transition-all"
                      >
                        Go
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-['Manrope',sans-serif] tracking-tight mb-4">
            Placement Made <span className="text-indigo-400">Intelligent</span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Everything your placement cell needs, built with modern architecture and AI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
              ),
              title: 'Multi-Tenant Architecture',
              desc: 'Each college gets isolated data, custom URL slugs, and complete administrative independence.'
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              ),
              title: 'AI Skill Matching',
              desc: 'Intelligent JD parsing and student-skill matching with ranked recommendations and missing skill analysis.'
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              ),
              title: 'CSV Bulk Upload',
              desc: 'Onboard hundreds of students instantly via CSV upload with domain validation and automatic account creation.'
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group relative p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold font-['Manrope',sans-serif] mb-3">{feature.title}</h3>
                <p className="text-white/40 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid grid-cols-3 gap-8">
          {[
            { value: '100%', label: 'Tenant Isolation' },
            { value: '< 1s', label: 'Match Computation' },
            { value: '∞', label: 'Scalable Colleges' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-bold font-['Manrope',sans-serif] bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-white/40 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">S</span>
            </div>
            SIPS — Student Intelligence Placement System
          </div>
          <div className="text-white/20 text-sm">
            © {new Date().getFullYear()} All rights reserved
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
