import React, { useState, useEffect } from 'react';
import { getStudents } from '../../api';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getStudents()
      .then(res => setStudents(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

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
          <h2 className="text-xl font-bold font-['Manrope',sans-serif] mb-1">Students</h2>
          <p className="text-white/40 text-sm">{students.length} students enrolled</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students..."
          className="px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all text-sm w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/30">No students found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.06]">
                <th className="text-left px-5 py-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Roll No</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">Skills</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">GitHub</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((s) => (
                <tr key={s._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4 text-sm font-medium">{s.name}</td>
                  <td className="px-5 py-4 text-sm text-white/60">{s.rollNo}</td>
                  <td className="px-5 py-4 text-sm text-white/60">{s.email}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {(s.skills || []).slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px]">
                          {skill}
                        </span>
                      ))}
                      {(s.skills || []).length > 3 && (
                        <span className="text-white/30 text-[10px]">+{s.skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {s.github ? (
                      <a href={`https://github.com/${s.github}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-xs">
                        @{s.github}
                      </a>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentList;
