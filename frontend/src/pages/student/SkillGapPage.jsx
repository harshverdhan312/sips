import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Layers,
  FileCode
} from "lucide-react";
import { studentService } from "../../services/studentService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { RadarSkillChart } from "../../components/charts/RadarSkillChart";
import { DashboardSkeleton } from "../../components/common/LoadingSkeleton";

export function SkillGapPage() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [skills, setSkills] = useState([]);
  const [radarData, setRadarData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [studentData, radar] = await Promise.all([
          studentService.getCurrentStudent(),
          studentService.getRadarData()
        ]);
        setStudent(studentData);
        setSkills(studentData?.skills || []);
        setRadarData(radar);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !student) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Target className="w-8 h-8 text-indigo-600" />
            Verified Technical Skills & Alignment
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Skills synchronized with your student profile (GET /api/student/profile) used for campus recruitment matching.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="success" size="lg">
            {skills.length} Verified Skills
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/student/profile")}
          >
            Manage in Profile
          </Button>
        </div>
      </div>

      {/* Overview Card: Metric Summary + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col justify-between">
          <CardHeader
            title="Readiness Index"
            subtitle="Calculated technical and profile readiness"
          />
          <div className="py-4 text-center">
            <div className="inline-flex items-baseline gap-1 text-5xl font-extrabold text-indigo-600">
              {student.readinessScore}<span className="text-xl text-slate-400 font-medium">/100</span>
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-2">
              {student.status}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Live placement status: {student.placementStatus}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Technical Score:</span>
              <span className="font-semibold text-slate-800">{student.metrics?.technicalScore || 0}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Resume Status:</span>
              <span className="font-semibold text-slate-800">{student.resumeUrl ? "Synced" : "Upload Pending"}</span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Readiness Dimension Telemetry"
            subtitle="Verified student attributes across placement readiness pillars"
          />
          <RadarSkillChart data={radarData} height={280} />
        </Card>
      </div>

      {/* Verified Skills Grid or Clean Empty State */}
      <div>
        <h3 className="font-bold text-slate-900 text-lg mb-3">
          Verified Competencies
        </h3>

        {skills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {skills.map((skill, index) => (
              <Card key={index} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{skill}</h4>
                    <span className="text-[11px] text-slate-400">Verified Technical Skill</span>
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  Verified
                </Badge>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">No verified technical skills yet</h4>
            <p className="text-xs text-slate-500 mb-4">
              Add your programming languages and technical competencies in your Profile to calculate company drive match scores.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/student/profile")}
            >
              Add Skills from Profile
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
