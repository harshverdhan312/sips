import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { cn } from "../../utils/cn";

export function ToastContainer() {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      border: "border-emerald-200 bg-emerald-50 text-emerald-900",
      iconColor: "text-emerald-600"
    },
    error: {
      icon: AlertCircle,
      border: "border-rose-200 bg-rose-50 text-rose-900",
      iconColor: "text-rose-600"
    },
    warning: {
      icon: AlertTriangle,
      border: "border-amber-200 bg-amber-50 text-amber-900",
      iconColor: "text-amber-600"
    },
    info: {
      icon: Info,
      border: "border-indigo-200 bg-indigo-50 text-indigo-900",
      iconColor: "text-indigo-600"
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const config = typeConfig[toast.type] || typeConfig.success;
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all animate-in slide-in-from-bottom-5 duration-200",
              config.border
            )}
          >
            <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", config.iconColor)} />
            <div className="flex-1 min-w-0">
              {toast.title && (
                <div className="text-xs sm:text-sm font-bold leading-tight mb-0.5">
                  {typeof toast.title === "string" ? toast.title : String(toast.title)}
                </div>
              )}
              {toast.message && (
                <p className="text-xs sm:text-sm font-medium leading-snug">
                  {typeof toast.message === "string" ? toast.message : JSON.stringify(toast.message)}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
