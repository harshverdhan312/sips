import React from "react";
import { cn } from "../../utils/cn";

export function Card({
  children,
  className = "",
  hover = false,
  padding = "normal",
  onClick,
  ...props
}) {
  const paddingStyles = {
    none: "p-0",
    tight: "p-3 sm:p-4",
    normal: "p-5 sm:p-6",
    spacious: "p-6 sm:p-8"
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-2xl border border-slate-200/80 shadow-xs transition-all duration-200",
        hover && "hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5",
        paddingStyles[padding] || paddingStyles.normal,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 pb-4 border-b border-slate-100 mb-5", className)}>
      <div>
        <h3 className="font-semibold text-slate-900 text-base sm:text-lg tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
