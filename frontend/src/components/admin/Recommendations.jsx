import React, { useState, useEffect } from 'react';
import { getJDs, getJDMatches } from '../../api';

const Recommendations = () => {
  const [jds, setJds] = useState([]);
  const [selectedJD, setSelectedJD] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);

  useEffect(() => {
    getJDs()
      .then(res => {
        setJds(res.data);
        if (res.data.length > 0) loadMatches(res.data[0]._id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadMatches = async (jdId) => {
    setSelectedJD(jdId);
    setMatchLoading(true);
    try {
      const res = await getJDMatches(jdId);
      setMatches(res.data.matches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMatchLoading(false);
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-['Manrope',sans-serif] mb-1">Recommended Students</h2>
        <p className="text-white/40 text-sm">View student-JD match scores and recommendations</p>
      </div>

      {jds.length === 0 ? (
        <div className="text-center py-16 text-white/30">No job descriptions found. Upload a JD first.</div>
      ) : (
        <div className="flex gap-6">
          {/* JD List */}
          <div className="w-72 shrink-0 space-y-2">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Select a JD</p>
            {jds.map(jd => (
              <button
                key={jd._id}
                onClick={() => loadMatches(jd._id)}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  selectedJD === jd._id
                    ? 'bg-indigo-500/10 border border-indigo-500/20'
                    : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
                }`}
              >
                <div className="text-sm font-medium truncate">{jd.title}</div>
                <div className="text-xs text-white/40 mt-1">{jd.company}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(jd.requiredSkills || []).slice(0, 3).map((s, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40 text-[9px]">{s}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Matches */}
          <div className="flex-1">
            {matchLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-16 text-white/30">No matches found for this JD</div>
            ) : (
              <div className="space-y-3">
                {matches.map((m) => (
                  <div key={m.rank} className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          m.score >= 80 ? 'bg-green-500/20 text-green-400' :
                          m.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          #{m.rank}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{m.student?.name || 'Unknown'}</div>
                          <div className="text-xs text-white/40">{m.student?.email}</div>
                        </div>
                      </div>
                      <div className={`text-2xl font-bold font-['Manrope',sans-serif] ${
                        m.score >= 80 ? 'text-green-400' :
                        m.score >= 50 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {m.score}%
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full mb-3">
                      <div
                        className={`h-full rounded-full transition-all ${
                          m.score >= 80 ? 'bg-green-500' :
                          m.score >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${m.score}%` }}
                      />
                    </div>

                    <div className="flex gap-6">
                      {m.matchedSkills?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Matched</p>
                          <div className="flex flex-wrap gap-1">
                            {m.matchedSkills.map((s, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px]">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {m.missingSkills?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Missing</p>
                          <div className="flex flex-wrap gap-1">
                            {m.missingSkills.map((s, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px]">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Recommendations;
