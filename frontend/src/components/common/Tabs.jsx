import React from "react";
import { cn } from "../../utils/cn";

export function Tabs({ tabs, activeTab, onChange, variant = "pills", className = "" }) {
  if (variant === "underline") {
    return (
      <div className={cn("border-b border-slate-200 flex gap-6 overflow-x-auto no-scrollbar", className)}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || activeTab === tab;
          const id = tab.id || tab;
          const label = tab.label || tab;
          const count = tab.count;

          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={cn(
                "pb-3 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2",
                isActive
                  ? "border-indigo-600 text-indigo-600 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              )}
            >
              <span>{label}</span>
              {count !== undefined && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    isActive ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 w-fit", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id || activeTab === tab;
        const id = tab.id || tab;
        const label = tab.label || tab;
        const count = tab.count;

        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5",
              isActive
                ? "bg-white text-slate-900 font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            )}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[11px]",
                  isActive ? "bg-indigo-50 text-indigo-700 font-bold" : "bg-slate-200 text-slate-600"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
