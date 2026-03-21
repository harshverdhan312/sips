import React, { useState, useCallback } from 'react';
import { uploadStudents } from '../../api';

const UploadStudents = () => {
  const [csvText, setCsvText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setCsvText(evt.target.result);
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!csvText.trim()) {
      setError('Please paste CSV data or upload a CSV file');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await uploadStudents(csvText);
      setResult(res.data);
      if (res.data.success > 0) setCsvText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-['Manrope',sans-serif] mb-1">Upload Students</h2>
        <p className="text-white/40 text-sm">Upload a CSV file with student data. Format: Name, Roll No, Email</p>
      </div>

      {/* CSV Template */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <p className="text-xs text-white/40 mb-2 font-medium">CSV Template:</p>
        <code className="text-xs text-indigo-400 font-mono">
          Name, Roll No, Email<br/>
          John Doe, 2021001, john@college.edu<br/>
          Jane Smith, 2021002, jane@college.edu
        </code>
      </div>

      {/* File Upload */}
      <div>
        <label className="flex items-center justify-center gap-3 px-6 py-8 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/30 cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.04]">
          <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <div>
            <span className="text-sm text-white/50">Drop a CSV file here or click to browse</span>
          </div>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Text Area */}
      <div>
        <label className="block text-sm font-medium text-white/60 mb-2">Or paste CSV data</label>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={8}
          placeholder="Name, Roll No, Email&#10;John Doe, 2021001, john@college.edu"
          className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-mono resize-none"
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
          <div className="flex items-center gap-4">
            <span className="text-green-400 text-sm font-medium">✓ {result.success} uploaded</span>
            {result.failed > 0 && (
              <span className="text-red-400 text-sm font-medium">✗ {result.failed} failed</span>
            )}
          </div>
          {result.errors?.length > 0 && (
            <div className="mt-2 space-y-1">
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-400/70">{err}</p>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !csvText.trim()}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
      >
        {loading ? 'Uploading...' : 'Upload Students'}
      </button>
    </div>
  );
};

export default UploadStudents;
