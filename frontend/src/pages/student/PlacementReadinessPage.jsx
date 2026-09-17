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
          Placement Readiness & Scoring Diagnostics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          A multi-dimensional scoring model assessing technical depth, soft skills, resume optimization, and academic performance.
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
            Computed from your verified backend profile metrics (GET /api/student/profile).
          </p>
        </Card>

        {/* Weighted Score Breakdown Table */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={`Weighted Readiness Index (${metrics.employabilityIndex}/100)`}
            subtitle="Algorithm composite weighting across key assessment dimensions"
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
                Positive Profile Indicators
              </h3>
              <p className="text-xs text-emerald-700 font-medium">
                Verified attributes strengthening your candidacy
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
                Actionable Focus Areas
              </h3>
              <p className="text-xs text-amber-700 font-medium">
                Steps to optimize your placement readiness
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
    </div>
  );
}
