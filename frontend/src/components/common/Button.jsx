import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  const variantStyles = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-200 border border-transparent",
    secondary:
      "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-200",
    outline:
      "bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-200 hover:border-slate-300 shadow-xs",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm shadow-rose-200 border border-transparent",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent",
    emerald:
      "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-200 border border-transparent"
  };

  const sizeStyles = {
    xs: "text-xs px-2.5 py-1 rounded-md",
    sm: "text-xs px-3 py-1.5 rounded-lg font-medium",
    md: "text-sm px-4 py-2 rounded-lg font-medium",
    lg: "text-base px-5 py-2.5 rounded-xl font-medium"
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant] || variantStyles.primary,
        sizeStyles[size] || sizeStyles.md,
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        Icon && iconPosition === "left" && <Icon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === "right" && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
}
