import React, { useState, useEffect } from 'react';
import { getStudentJobs, getPreferredJobs } from '../../api';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [preferred, setPreferred] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('all'); // 'all' or 'preferred'

  useEffect(() => {
    Promise.all([getStudentJobs(), getPreferredJobs()])
      .then(([allRes, prefRes]) => {
        setJobs(allRes.data);
        setPreferred(prefRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const displayJobs = view === 'preferred' ? preferred : jobs;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-['Manrope',sans-serif] mb-1">Job Opportunities</h2>
          <p className="text-white/40 text-sm">{jobs.length} jobs available</p>
        </div>

        {/* Toggle */}
        <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
          <button
            onClick={() => setView('all')}
            className={`px-4 py-2 text-xs font-medium transition-all ${
              view === 'all' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-transparent text-white/40 hover:text-white/60'
            }`}
          >
            All Jobs
          </button>
          <button
            onClick={() => setView('preferred')}
            className={`px-4 py-2 text-xs font-medium transition-all ${
              view === 'preferred' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-transparent text-white/40 hover:text-white/60'
            }`}
          >
            ⭐ Most Preferred
          </button>
        </div>
      </div>

      {displayJobs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/30">
            {view === 'preferred' ? 'No preferred jobs yet. Update your skills to see matches.' : 'No jobs posted yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayJobs.map((job) => (
            <div key={job._id} className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold">{job.title}</h3>
                  <p className="text-sm text-white/40 mt-0.5">{job.company}</p>
                </div>
                {(job.matchScore !== undefined && job.matchScore > 0) && (
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-bold font-['Manrope',sans-serif] ${
                    job.matchScore >= 80 ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    job.matchScore >= 50 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {job.matchScore}% match
                  </div>
                )}
              </div>

              <p className="text-sm text-white/40 leading-relaxed mb-4 line-clamp-3">{job.description}</p>

              {/* Required Skills */}
              <div className="mb-3">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {(job.requiredSkills || []).map((s, i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-full text-[11px] ${
                      (job.matchedSkills || []).includes(s)
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-white/[0.04] text-white/40 border border-white/[0.06]'
                    }`}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              {job.missingSkills?.length > 0 && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Skills to Learn</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.missingSkills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Match Bar */}
              {job.matchScore > 0 && (
                <div className="mt-4">
                  <div className="w-full h-1 bg-white/[0.06] rounded-full">
                    <div
                      className={`h-full rounded-full ${
                        job.matchScore >= 80 ? 'bg-green-500' :
                        job.matchScore >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${job.matchScore}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;
