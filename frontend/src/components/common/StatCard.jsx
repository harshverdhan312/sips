import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card } from "./Card";
import { cn } from "../../utils/cn";

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = "bg-indigo-50 text-indigo-600",
  trend = null, // { value: "+4%", direction: "up" | "down" | "neutral", label: "vs last week" }
  onClick,
  className = ""
}) {
  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      className={cn("flex flex-col justify-between relative overflow-hidden", className)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-slate-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h4 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {value}
            </h4>
          </div>
        </div>
        {Icon && (
          <div className={cn("p-2.5 sm:p-3 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
      </div>

      {(trend || subtitle) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {trend ? (
            <div className="flex items-center gap-1.5 font-medium">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold",
                  trend.direction === "up" && "bg-emerald-50 text-emerald-700",
                  trend.direction === "down" && "bg-rose-50 text-rose-700",
                  trend.direction === "neutral" && "bg-slate-100 text-slate-700"
                )}
              >
                {trend.direction === "up" && <ArrowUpRight className="w-3 h-3" />}
                {trend.direction === "down" && <ArrowDownRight className="w-3 h-3" />}
                {trend.direction === "neutral" && <Minus className="w-3 h-3" />}
                {trend.value}
              </span>
              {trend.label && <span className="text-slate-400">{trend.label}</span>}
            </div>
          ) : (
            <span className="text-slate-500">{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  );
}
