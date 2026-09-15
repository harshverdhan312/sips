import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Code2,
  Award,
  GitBranch,
  ExternalLink,
  Edit2,
  Check,
  Save,
  Sparkles
} from "lucide-react";
import { studentService } from "../../services/studentService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { DashboardSkeleton } from "../../components/common/LoadingSkeleton";
import { useNotifications } from "../../context/NotificationContext";

export function StudentProfilePage() {
  const { addToast } = useNotifications();
  const [student, setStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await studentService.getCurrentStudent();
      setStudent(data);
      setFormData({
        headline: data.headline,
        bio: data.bio,
        phone: data.phone,
        location: data.location
      });
    }
    load();
  }, []);

  if (!student) return <DashboardSkeleton />;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await studentService.updateCurrentStudent(formData);
      setStudent(updated);
      setIsEditing(false);
      addToast("Profile details updated successfully!", "success");
    } catch (e) {
      console.error(e);
      addToast("Failed to save profile changes.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Profile Hero Card */}
      <Card className="overflow-hidden border-slate-200">
        <div className="h-32 bg-gradient-to-r from-indigo-800 via-indigo-600 to-indigo-900 relative" />
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14 mb-4">
            <div className="flex items-end gap-4">
              <img
                src={student.avatar}
                alt={student.name}
                className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-md bg-white shrink-0"
              />
              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900">{student.name}</h1>
                  <Badge variant="success" size="sm">
                    {student.status}
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  USN: {student.usn} • {student.branch} ({student.batch})
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Check}
                    loading={saving}
                    onClick={handleSave}
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit2}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Headline & Bio */}
          {isEditing ? (
            <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Professional Headline
                </label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) =>
                    setFormData({ ...formData, headline: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Bio / Summary
                </label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                {student.headline}
              </p>
              <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
                {student.bio}
              </p>
            </div>
          )}

          {/* Quick Contact Badges */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {student.email}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> {student.phone}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {student.location}
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-indigo-700">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> CGPA: {student.cgpa}/10
            </span>
          </div>
        </div>
      </Card>

      {/* Coding Profiles & Academic Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coding Profiles */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Competitive Coding & Open Source Profiles"
            subtitle="Live synchronized coding statistics and contest badges"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* LeetCode */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm">LeetCode</span>
                  <Badge variant="warning" size="sm">
                    {student.codingProfiles.leetcode.badge}
                  </Badge>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {student.codingProfiles.leetcode.solved}
                  <span className="text-xs text-slate-400 font-normal"> solved</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-medium">
                  <span>Easy: {student.codingProfiles.leetcode.easy}</span>
                  <span>Med: {student.codingProfiles.leetcode.medium}</span>
                  <span>Hard: {student.codingProfiles.leetcode.hard}</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 text-xs font-semibold text-indigo-600">
                Rating: {student.codingProfiles.leetcode.contestRating}
              </div>
            </div>

            {/* GitHub */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                    <GitBranch className="w-4 h-4" /> GitHub
                  </span>
                  <Badge variant="primary" size="sm">
                    Active
                  </Badge>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {student.codingProfiles.github.contributions}
                  <span className="text-xs text-slate-400 font-normal"> commits</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-medium">
                  <span>{student.codingProfiles.github.repos} Repos</span>
                  <span>{student.codingProfiles.github.stars} Stars</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 text-xs font-semibold text-indigo-600">
                @{student.codingProfiles.github.handle}
              </div>
            </div>

            {/* HackerRank */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm">HackerRank</span>
                  <Badge variant="success" size="sm">
                    Verified
                  </Badge>
                </div>
                <div className="space-y-1 mt-1">
                  {student.codingProfiles.hackerrank.badges.map((b, i) => (
                    <span
                      key={i}
                      className="block text-[11px] font-semibold text-slate-700 truncate"
                    >
                      ★ {b}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 text-xs font-semibold text-indigo-600">
                Top Decile
              </div>
            </div>
          </div>
        </Card>

        {/* Academic Semesters Overview */}
        <Card>
          <CardHeader
            title="Academic History"
            subtitle="Consistent GPA performance"
          />
          <div className="space-y-2">
            {student.academics.semesters.map((sem, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs"
              >
                <span className="font-medium text-slate-700">{sem.sem}</span>
                <span className="font-bold text-indigo-600">{sem.gpa} GPA</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs font-medium text-slate-500">
            <span>Backlogs: {student.academics.backlogs}</span>
            <span>Attendance: {student.academics.attendance}</span>
          </div>
        </Card>
      </div>

      {/* Featured Projects Portfolio */}
      <Card>
        <CardHeader
          title="Featured Engineering Projects"
          subtitle="Showcased on campus resume and verified in technical rounds"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {student.projects.map((proj) => (
            <div
              key={proj.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">
                    {proj.title}
                  </h4>
                  <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 cursor-pointer hover:text-indigo-600" />
                </div>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {proj.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80">
                <div className="flex flex-wrap gap-1">
                  {proj.tech.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-semibold text-slate-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
