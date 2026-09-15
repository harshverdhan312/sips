import React from "react";
import { cn } from "../../utils/cn";

export function ProgressBar({
  value = 0,
  max = 100,
  label,
  showPercentage = true,
  variant = "primary", // primary | emerald | amber | rose | purple
  size = "md", // sm | md | lg
  className = ""
}) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const variantBarColors = {
    primary: "bg-indigo-600",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    purple: "bg-purple-600",
    blue: "bg-sky-500"
  };

  const sizeHeights = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3.5"
  };

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
          {label && <span>{label}</span>}
          {showPercentage && (
            <span className="text-slate-500 tabular-nums">{percentage}%</span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-slate-100 rounded-full overflow-hidden", sizeHeights[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variantBarColors[variant] || variantBarColors.primary
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
