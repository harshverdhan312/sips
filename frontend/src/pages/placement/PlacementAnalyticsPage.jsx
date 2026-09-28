import React from "react";
import {
  Sparkles,
  Clock,
  BrainCircuit,
  Zap,
  BarChart3
} from "lucide-react";

export function PlacementAnalyticsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Coming Soon Announcement Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-8 sm:p-12 shadow-xl border border-indigo-700/50">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Coming Soon • Advanced Intelligence Suite</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-indigo-300 shrink-0" />
              AI Multi-Cohort Placement & Market Forecasting Analytics
            </h1>
            
            <p className="text-sm sm:text-base text-indigo-200/90 leading-relaxed">
              We are currently calibrating our multi-stream predictive placement models to provide multi-year salary projection bands, corporate recruiter demand forecasting, and automated curriculum intervention heatmaps.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs sm:text-sm text-indigo-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Target Rollout: Q4 2026
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-emerald-400" />
                FastAPI ML Powered
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-indigo-300" />
                Deep Cohort Intelligence
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <span className="px-4 py-2 rounded-xl bg-indigo-500/30 border border-indigo-400/40 text-white font-bold text-sm">
              Under Development
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

