import React from "react";
import { cn } from "../../utils/cn";

export function ProbabilityGauge({
  probability = 82,
  size = 180,
  strokeWidth = 14,
  label = "Placement Probability"
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 240-degree arc for a gauge feel
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * probability) / 100;

  // Determine tone
  let strokeColor = "#10b981"; // Emerald
  let badgeText = "Very High Fit";
  let badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200";

  if (probability < 50) {
    strokeColor = "#ef4444"; // Rose
    badgeText = "Needs Urgent Attention";
    badgeBg = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (probability < 75) {
    strokeColor = "#f59e0b"; // Amber
    badgeText = "Moderate Readiness";
    badgeBg = "bg-amber-50 text-amber-700 border-amber-200";
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-135"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tight text-slate-900">
            {probability}%
          </span>
          <span className="text-xs font-medium text-slate-400 mt-0.5">Predicted</span>
        </div>
      </div>

      <div className="mt-2 text-center">
        <div className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border", badgeBg)}>
          {badgeText}
        </div>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
