import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
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
    info: {
      icon: Info,
      border: "border-indigo-200 bg-indigo-50 text-indigo-900",
      iconColor: "text-indigo-600"
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
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
            <p className="text-xs sm:text-sm font-medium flex-1 leading-snug">
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
