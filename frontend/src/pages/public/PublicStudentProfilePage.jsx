import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  FileText, 
  ExternalLink, 
  Star, 
  GitFork, 
  GraduationCap, 
  Building2, 
  Award, 
  CheckCircle2, 
  Share2, 
  AlertCircle, 
  Loader2, 
  Code,
  Sparkles,
  BookOpen
} from "lucide-react";
import { studentService } from "../../services/studentService";
import { resolveAssetUrl } from "../../services/api";

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function PublicStudentProfilePage() {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);
      setImageError(false);
      try {
        const response = await studentService.getPublicStudentProfile(username);
        if (isMounted) {
          if (response && response.success) {
            setProfileData(response);
          } else {
            setError(response?.message || "Profile not found.");
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Public career profile not found or currently unavailable.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (username) {
      loadProfile();
    } else {
      setError("No username specified.");
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [username]);

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // Fallback
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
          <p className="text-slate-600 font-medium">Loading SIPS Career Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Profile Not Available</h1>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            {error || "The requested student career profile does not exist or has not been made publicly accessible."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-md shadow-indigo-600/20"
          >
            Go to SIPS Home
          </Link>
        </div>
      </div>
    );
  }

  const { profile, links, skills, projects, codingProfiles, resume } = profileData;
  const college = profile?.college;
  const resumeUrl = resume?.available && resume?.url ? resolveAssetUrl(resume.url) : null;
  const avatarUrl = profile?.profileImageUrl ? resolveAssetUrl(profile.profileImageUrl) : null;

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "ST";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-slate-200/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/branding/sips-logo-compact.png"
              alt="SIPS - Skill Intelligence Placement System"
              className="h-8 sm:h-9 w-auto max-w-[160px] sm:max-w-[190px] object-contain"
            />
            <span className="hidden sm:inline-flex text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              Verified Profile
            </span>
          </Link>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm transition-all active:scale-95"
            title="Copy profile link to clipboard"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>{copied ? "Link Copied!" : "Share Profile"}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-10">
        {/* Profile Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-10 shadow-sm">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-indigo-50/70 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 rounded-full bg-blue-50/60 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 text-center md:text-left">
            {/* Avatar */}
            <div className="relative shrink-0">
              {avatarUrl && !imageError ? (
                <img
                  src={avatarUrl}
                  alt={profile.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-2 border-slate-100 shadow-md"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center font-bold text-3xl sm:text-4xl text-white shadow-md shadow-indigo-600/20 border-2 border-indigo-100">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 border border-slate-200 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    {profile.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Verified Candidate
                  </span>
                </div>

                <p className="text-slate-700 font-medium text-sm sm:text-base">
                  {[profile.course, profile.branch].filter(Boolean).join(" • ") || "Engineering Student"}
                </p>

                {college && (
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-1.5 text-xs sm:text-sm text-slate-500">
                    <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-medium text-slate-700">{college.name}</span>
                    {profile.batch && (
                      <span className="text-slate-400">• Class of {profile.batch}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-slate-700 text-sm leading-relaxed max-w-2xl bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 whitespace-pre-line">
                  {profile.bio}
                </p>
              )}

              {/* Action / Social Links */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                {links?.github && (
                  <a
                    href={links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium transition-all shadow-sm"
                  >
                    <GithubIcon className="w-4 h-4 text-white" />
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3 text-slate-300" />
                  </a>
                )}

                {links?.linkedin && (
                  <a
                    href={links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs sm:text-sm font-semibold text-sky-700 transition-all shadow-xs"
                  >
                    <LinkedinIcon className="w-4 h-4 text-sky-600" />
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3 h-3 text-sky-500" />
                  </a>
                )}

                {resumeUrl && (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-indigo-600/20"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Resume</span>
                    <ExternalLink className="w-3 h-3 text-indigo-200" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        {skills && skills.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs">
                <Award className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Verified Skills & Competencies</h2>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex flex-wrap gap-2.5">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-xs font-semibold text-slate-800 capitalize tracking-wide shadow-xs transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Coding & Problem Solving Section */}
        {codingProfiles && codingProfiles.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 shadow-xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Coding & Problem Solving</h2>
                <p className="text-xs text-slate-500">Competitive programming & algorithmic practice</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {codingProfiles.map((cp, idx) => {
                const isLeetCode = cp.platform === 'LEETCODE';
                const isCodeforces = cp.platform === 'CODEFORCES';
                const stats = cp.stats || {};

                return (
                  <div
                    key={idx}
                    className="flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all shadow-sm group"
                  >
                    <div className="space-y-4">
                      {/* Platform Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl border ${
                            isLeetCode
                              ? 'bg-amber-50 text-amber-600 border-amber-200'
                              : 'bg-blue-50 text-blue-600 border-blue-200'
                          }`}>
                            <Code className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-base">
                                {isLeetCode ? 'LeetCode' : isCodeforces ? 'Codeforces' : cp.platform}
                              </h3>
                              {isLeetCode && stats.rankingTier && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {stats.rankingTier}
                                </span>
                              )}
                              {isCodeforces && stats.rank && stats.rank.toLowerCase() !== 'unrated' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                                  {stats.rank}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-mono">@{cp.username}</p>
                          </div>
                        </div>

                        {cp.profileUrl && (
                          <a
                            href={cp.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                          >
                            <span>View Profile</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Platform-Specific Metrics */}
                      {isLeetCode ? (
                        <>
                          {/* LeetCode Stats Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                            {typeof stats.problemsSolved === 'number' && (
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[11px] font-medium text-slate-500 block">Problems Solved</span>
                                <span className="text-lg font-extrabold text-slate-900">{stats.problemsSolved}</span>
                              </div>
                            )}

                            {typeof stats.globalRank === 'number' && stats.globalRank > 0 && (
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[11px] font-medium text-slate-500 block">Global Rank</span>
                                <span className="text-lg font-extrabold text-slate-900">#{stats.globalRank.toLocaleString()}</span>
                              </div>
                            )}

                            {typeof stats.currentRating === 'number' && stats.currentRating > 0 && (
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[11px] font-medium text-slate-500 block">Contest Rating</span>
                                <span className="text-lg font-extrabold text-indigo-600">{stats.currentRating}</span>
                              </div>
                            )}

                            {typeof stats.contestParticipationCount === 'number' && stats.contestParticipationCount > 0 && (
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[11px] font-medium text-slate-500 block">Contests</span>
                                <span className="text-lg font-extrabold text-slate-900">{stats.contestParticipationCount}</span>
                              </div>
                            )}
                          </div>

                          {/* LeetCode Difficulty Breakdown Pills (Only non-null counts rendered) */}
                          {stats.difficultyBreakdown && (
                            typeof stats.difficultyBreakdown.easy === 'number' ||
                            typeof stats.difficultyBreakdown.medium === 'number' ||
                            typeof stats.difficultyBreakdown.hard === 'number'
                          ) && (
                            <div className="flex items-center gap-2 pt-1">
                              {typeof stats.difficultyBreakdown.easy === 'number' && (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                                  Easy: {stats.difficultyBreakdown.easy}
                                </span>
                              )}
                              {typeof stats.difficultyBreakdown.medium === 'number' && (
                                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                                  Medium: {stats.difficultyBreakdown.medium}
                                </span>
                              )}
                              {typeof stats.difficultyBreakdown.hard === 'number' && (
                                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                                  Hard: {stats.difficultyBreakdown.hard}
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        /* Codeforces Stats Grid */
                        (() => {
                          const hasRating = typeof stats.currentRating === 'number' && stats.currentRating > 0;
                          const hasMaxRating = typeof stats.maxRating === 'number' && stats.maxRating > 0;
                          const hasRank = stats.rank && stats.rank.toLowerCase() !== 'unrated';
                          const hasMaxRank = stats.maxRank && stats.maxRank.toLowerCase() !== 'unrated';
                          const hasContests = typeof stats.contestParticipationCount === 'number' && stats.contestParticipationCount > 0;
                          const hasActivity = hasRating || hasMaxRating || hasRank || hasMaxRank || hasContests;

                          if (!hasActivity) {
                            return (
                              <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                                No contest activity yet
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                              {hasRating && (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                  <span className="text-[11px] font-medium text-slate-500 block">Current Rating</span>
                                  <span className="text-lg font-extrabold text-indigo-600">{stats.currentRating}</span>
                                </div>
                              )}

                              {hasMaxRating && (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                  <span className="text-[11px] font-medium text-slate-500 block">Max Rating</span>
                                  <span className="text-lg font-extrabold text-slate-700">{stats.maxRating}</span>
                                </div>
                              )}

                              {hasMaxRank && (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                  <span className="text-[11px] font-medium text-slate-500 block">Max Rank</span>
                                  <span className="text-lg font-extrabold text-blue-700 capitalize">{stats.maxRank}</span>
                                </div>
                              )}

                              {hasContests && (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                  <span className="text-[11px] font-medium text-slate-500 block">Contests</span>
                                  <span className="text-lg font-extrabold text-slate-900">{stats.contestParticipationCount}</span>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )}

                      {/* Badges */}
                      {Array.isArray(stats.badges) && stats.badges.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {stats.badges.map((b, bIdx) => (
                            <span
                              key={bIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold"
                            >
                              <Award className="w-3 h-3 text-amber-600" />
                              {b.name || b}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Featured Projects Section */}
        {projects && projects.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Featured GitHub Projects</h2>
                  <p className="text-xs text-slate-500">Verified codebases selected by candidate</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all group shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {proj.name}
                      </h3>
                      {proj.htmlUrl && (
                        <a
                          href={proj.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                          title="View on GitHub"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    {proj.description && (
                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                        {proj.description}
                      </p>
                    )}

                    {proj.topics && proj.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {proj.topics.slice(0, 4).map((topic, tidx) => (
                          <span
                            key={tidx}
                            className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-medium"
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>{proj.primaryLanguage || "Code"}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {proj.stars > 0 && (
                        <span className="flex items-center gap-1 font-medium text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          {proj.stars}
                        </span>
                      )}
                      {proj.forks > 0 && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <GitFork className="w-3.5 h-3.5" />
                          {proj.forks}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Academic Credentials</h2>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  {college ? college.name : "University Campus"}
                </h3>
                <p className="text-slate-700 text-sm font-medium">
                  {[profile.course, profile.branch].filter(Boolean).join(" — ") || "Degree Program"}
                </p>
                {college && (college.city || college.state) && (
                  <p className="text-slate-500 text-xs">
                    {[college.city, college.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>

              {profile.batch && (
                <div className="shrink-0">
                  <span className="px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
                    Batch of {profile.batch}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200/80 bg-white py-8 px-4 text-center">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Powered by <strong>SIPS</strong> — Skill Intelligence Placement System</span>
          </div>
          <div>
            <span>Verified Student Profile &bull; Recruiter Gateway</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
