import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award
} from "lucide-react";
import { studentService } from "../../services/studentService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { ProgressBar } from "../../components/common/ProgressBar";
import { ProbabilityGauge } from "../../components/charts/ProbabilityGauge";
import { DashboardSkeleton } from "../../components/common/LoadingSkeleton";

export function PlacementReadinessPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await studentService.getReadinessBreakdown();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const { metrics, weights, positiveFactors, negativeFactors } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <GraduationCap className="w-8 h-8 text-indigo-600" />
          Placement Readiness & Employability Index
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          A multi-dimensional scoring model assessing technical, behavioral, and academic placement fit.
        </p>
      </div>

      {/* Top Banner: Probability Gauge & Employability Core Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <h3 className="font-bold text-slate-900 text-lg mb-2">
            Overall Placement Probability
          </h3>
          <ProbabilityGauge probability={metrics.placementProbability} size={200} />
          <p className="text-xs text-slate-500 max-w-xs mt-3">
            Simulated over 48 Tier-1 and Tier-2 campus recruiters based on the 2025 hiring criteria.
          </p>
        </Card>

        {/* Weighted Score Breakdown Table */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Weighted Employability Index (78/100)"
            subtitle="Algorithm composite weighting across 5 distinct assessment pillars"
          />
          <div className="space-y-4">
            {weights.map((w, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                  <span className="text-slate-800 flex items-center gap-2">
                    {w.factor}
                    <span className="text-slate-400 font-normal text-xs">
                      (Weight: {w.weight})
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600 font-bold">{w.score}/100</span>
                    <Badge
                      variant={
                        w.status === "Strong"
                          ? "success"
                          : w.status === "Good"
                          ? "primary"
                          : "warning"
                      }
                      size="sm"
                    >
                      {w.status}
                    </Badge>
                  </div>
                </div>
                <ProgressBar
                  value={w.score}
                  variant={
                    w.status === "Strong"
                      ? "emerald"
                      : w.status === "Good"
                      ? "primary"
                      : "amber"
                  }
                  size="sm"
                  showPercentage={false}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* What is Affecting Your Score? */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positive Factors */}
        <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/20 to-white">
          <div className="flex items-center gap-3 pb-3 border-b border-emerald-100 mb-4">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Positive Contributors (+ Boosters)
              </h3>
              <p className="text-xs text-emerald-700 font-medium">
                Factors giving you an edge in campus shortlists
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {positiveFactors.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Improvement Areas */}
        <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50/20 to-white">
          <div className="flex items-center gap-3 pb-3 border-b border-amber-100 mb-4">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Critical Focus Areas (- Gaps)
              </h3>
              <p className="text-xs text-amber-700 font-medium">
                Targeted actions needed to hit 90%+ placement probability
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {negativeFactors.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  !
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Campus Placement Season Timeline & Checklist */}
      <Card>
        <CardHeader
          title="Placement Season Preparation Roadmap"
          subtitle="Milestones to track prior to Day-1 on-campus recruitment drives"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex flex-col justify-between">
            <div>
              <Badge variant="success" size="sm" className="mb-2">
                Completed
              </Badge>
              <h4 className="font-bold text-slate-900 text-sm">Phase 1: Resume Verification</h4>
              <p className="text-xs text-slate-500 mt-1">
                ATS score above 85, GitHub portfolio linked, projects verified.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-100 text-xs font-semibold text-emerald-700">
              100% Done
            </div>
          </div>

          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 flex flex-col justify-between">
            <div>
              <Badge variant="primary" size="sm" className="mb-2">
                In Progress
              </Badge>
              <h4 className="font-bold text-slate-900 text-sm">Phase 2: DSA & Tech Drills</h4>
              <p className="text-xs text-slate-500 mt-1">
                LeetCode medium threshold reached. Complete 15 SQL query drills.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-indigo-100 text-xs font-semibold text-indigo-700">
              80% Done
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <Badge variant="neutral" size="sm" className="mb-2">
                Up Next
              </Badge>
              <h4 className="font-bold text-slate-900 text-sm">Phase 3: Behavioral STAR Drills</h4>
              <p className="text-xs text-slate-500 mt-1">
                Record 5 STAR scenarios with speech cadence at 130-140 WPM.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-600">
              40% Done
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <Badge variant="neutral" size="sm" className="mb-2">
                Scheduled
              </Badge>
              <h4 className="font-bold text-slate-900 text-sm">Phase 4: Day-1 Company Drives</h4>
              <p className="text-xs text-slate-500 mt-1">
                Attend pre-placement talks and appear for Day-1 online assessments.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-400">
              Starts Apr 20
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
