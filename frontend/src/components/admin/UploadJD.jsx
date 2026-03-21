import React, { useState } from 'react';
import { createJD } from '../../api';

const UploadJD = () => {
  const [form, setForm] = useState({ title: '', company: '', description: '' });
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (!skills.includes(s.toLowerCase())) {
      setSkills(prev => [...prev, s.toLowerCase()]);
    }
    setSkillInput('');
  };

  const removeSkill = (s) => setSkills(prev => prev.filter(x => x !== s));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await createJD({
        title: form.title,
        company: form.company,
        description: form.description,
        requiredSkills: skills
      });
      setResult(res.data);
      setForm({ title: '', company: '', description: '' });
      setSkills([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create JD');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-['Manrope',sans-serif] mb-1">Upload Job Description</h2>
        <p className="text-white/40 text-sm">Add a new JD — skills will be auto-extracted if not specified</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {result && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          ✓ JD created — {result.matchesComputed} student matches computed
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Job Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Software Engineer"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Company</label>
            <input
              value={form.company}
              onChange={(e) => setForm(p => ({ ...p, company: e.target.value }))}
              placeholder="e.g., Google"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">Job Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
            rows={8}
            placeholder="Paste the full job description here. Skills will be auto-extracted..."
            required
            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-all text-sm resize-none"
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">
            Required Skills <span className="text-white/30">(optional — auto-extracted if empty)</span>
          </label>
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="e.g., react"
              className="flex-1 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-sm font-medium hover:bg-indigo-500/30 transition-all"
            >
              Add
            </button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {skills.map(s => (
                <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-400">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Job Description'}
        </button>
      </form>
    </div>
  );
};

export default UploadJD;
