import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile, uploadResume } from '../../api';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [editSkills, setEditSkills] = useState([]);
  const [github, setGithub] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    getProfile()
      .then(res => {
        setProfile(res.data);
        setEditSkills(res.data.skills || []);
        setGithub(res.data.github || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addSkill = () => {
    const s = skillInput.trim().toLowerCase();
    if (!s || editSkills.includes(s)) return;
    setEditSkills(prev => [...prev, s]);
    setSkillInput('');
  };

  const removeSkill = (s) => setEditSkills(prev => prev.filter(x => x !== s));

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const data = { skills: editSkills, github };
      if (newPassword) data.newPassword = newPassword;
      const res = await updateProfile(data);
      setProfile(res.data.student);
      setNewPassword('');
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadResume(file);
      setProfile(prev => ({ ...prev, resumeUrl: res.data.resumeUrl }));
      setMessage({ type: 'success', text: 'Resume uploaded successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Resume upload failed' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold font-['Manrope',sans-serif] mb-1">Your Profile</h2>
        <p className="text-white/40 text-sm">Manage your skills, resume, and settings</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm ${
          message.type === 'success' 
            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Non-editable Fields */}
      <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-4">
        <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/30 block mb-1">Name</label>
            <div className="px-4 py-2.5 rounded-lg bg-white/[0.03] text-white/60 text-sm">{profile?.name}</div>
          </div>
          <div>
            <label className="text-xs text-white/30 block mb-1">Roll Number</label>
            <div className="px-4 py-2.5 rounded-lg bg-white/[0.03] text-white/60 text-sm">{profile?.rollNo}</div>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-white/30 block mb-1">Email</label>
            <div className="px-4 py-2.5 rounded-lg bg-white/[0.03] text-white/60 text-sm">{profile?.email}</div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">Skills</h3>
        <div className="flex gap-2 mb-3">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            placeholder="Add a skill..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
          />
          <button onClick={addSkill} className="px-4 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-sm font-medium hover:bg-indigo-500/30 transition-all">
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {editSkills.map(s => (
            <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs">
              {s}
              <button onClick={() => removeSkill(s)} className="hover:text-red-400">×</button>
            </span>
          ))}
          {editSkills.length === 0 && <p className="text-white/20 text-xs">No skills added yet</p>}
        </div>
      </div>

      {/* GitHub */}
      <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">GitHub</h3>
        <input
          value={github}
          onChange={(e) => setGithub(e.target.value)}
          placeholder="your-github-username"
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
        />
      </div>

      {/* Resume Upload */}
      <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">Resume</h3>
        {profile?.resumeUrl ? (
          <div className="flex items-center gap-3 mb-3">
            <span className="text-green-400 text-xs">✓ Resume uploaded</span>
            <a href={`http://localhost:5000${profile.resumeUrl}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-xs hover:text-indigo-300">
              View Resume
            </a>
          </div>
        ) : (
          <p className="text-white/30 text-xs mb-3">No resume uploaded yet</p>
        )}
        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/50 text-sm cursor-pointer hover:bg-white/[0.08] transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Upload PDF
          <input type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" />
        </label>
      </div>

      {/* Change Password */}
      <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">Change Password</h3>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (leave empty to keep current)"
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
};

export default Profile;
